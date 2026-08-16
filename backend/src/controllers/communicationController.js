const pool = require('../config/database');
const notificationService = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const allowedDestination = (value) => {
  const candidate = String(value || '').trim();
  if (!candidate) return '/dashboard/notifications';
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate;
  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:' && url.hostname === 'vtu.ferixas.com') return url.toString();
  } catch (_) {}
  throw new Error('Notification destination must be a platform path or an https://vtu.ferixas.com URL.');
};

const allowedImageUrl = (value) => {
  const candidate = String(value || '').trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:') return url.toString();
  } catch (_) {}
  throw new Error('Notification image must use a secure https URL.');
};

const recordDelivery = (campaignId, userId, channel, status, destination, providerResponse = null) => pool.query(
  `INSERT INTO notification_deliveries (campaign_id, user_id, channel, status, destination, provider_response)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [campaignId, userId, channel, status, destination, providerResponse]
);

const getStatus = async (_req, res) => {
  try {
    const devices = await pool.query('SELECT COUNT(*)::int AS count FROM notification_devices WHERE is_active = TRUE');
    res.json({
      push: {
        enabled: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS),
        activeDevices: devices.rows[0].count,
        required: 'Firebase backend credential and a user-installed mobile app that has approved notification permission.'
      },
      email: {
        enabled: Boolean(process.env.RESEND_API_KEY),
        from: process.env.EMAIL_FROM || process.env.RESEND_FROM || null,
        required: 'Resend API key and a verified sender domain.'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listDeliveries = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
    const result = await pool.query(
      `SELECT c.id AS campaign_id, c.title, c.message, c.channels, c.audience, c.destination, c.image_url,
              c.created_at, u.full_name, u.email,
              COUNT(d.id)::int AS attempted,
              COUNT(*) FILTER (WHERE d.status = 'sent')::int AS sent,
              COUNT(*) FILTER (WHERE d.status = 'queued')::int AS queued,
              COUNT(*) FILTER (WHERE d.status = 'failed')::int AS failed
       FROM notification_campaigns c
       LEFT JOIN notification_deliveries d ON d.campaign_id = c.id
       LEFT JOIN users u ON u.id = c.admin_id
       GROUP BY c.id, u.full_name, u.email
       ORDER BY c.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendCampaign = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const message = String(req.body?.message || '').trim();
    const channels = [...new Set((Array.isArray(req.body?.channels) ? req.body.channels : [])
      .map((channel) => String(channel).toLowerCase()).filter((channel) => ['push', 'email'].includes(channel)))];
    const audience = String(req.body?.audience || 'all').toLowerCase();
    const selectedUserIds = Array.isArray(req.body?.userIds) ? req.body.userIds.map(String).slice(0, 500) : [];
    if (!title || title.length > 255 || !message || message.length > 5000) {
      return res.status(400).json({ error: 'A title up to 255 characters and a message up to 5,000 characters are required.' });
    }
    if (!channels.length) return res.status(400).json({ error: 'Choose at least one delivery channel.' });
    if (!['all', 'selected'].includes(audience)) return res.status(400).json({ error: 'Audience must be all or selected.' });
    if (audience === 'selected' && !selectedUserIds.length) return res.status(400).json({ error: 'Select at least one customer.' });
    const destination = allowedDestination(req.body?.destination);
    const imageUrl = allowedImageUrl(req.body?.imageUrl);

    const recipients = await pool.query(
      audience === 'all'
        ? 'SELECT id, full_name, email FROM users WHERE is_active = TRUE AND COALESCE(role, \'user\') <> \'admin\''
        : 'SELECT id, full_name, email FROM users WHERE is_active = TRUE AND id = ANY($1::uuid[])',
      audience === 'all' ? [] : [selectedUserIds]
    );
    const campaign = await pool.query(
      `INSERT INTO notification_campaigns (admin_id, title, message, channels, audience, destination, image_url, metadata)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb)
       RETURNING *`,
      [req.user.id, title, message, JSON.stringify(channels), audience, destination, imageUrl, JSON.stringify({ recipientCount: recipients.rows.length })]
    );

    const summary = { recipients: recipients.rows.length, push: { sent: 0, failed: 0, noDevices: 0 }, email: { sent: 0, failed: 0, skipped: 0 } };
    for (const user of recipients.rows) {
      if (channels.includes('push')) {
        try {
          const notification = await notificationService.sendNotification(user.id, title, message, 'announcement', {
            campaignId: campaign.rows[0].id,
            deep_link: destination,
            image_url: imageUrl || undefined,
          });
          const delivery = notification.push || { delivered: false, reason: 'unknown' };
          const status = delivery.delivered ? 'sent' : delivery.reason === 'no_registered_devices' ? 'skipped' : 'failed';
          await recordDelivery(campaign.rows[0].id, user.id, 'push', status, destination, JSON.stringify(delivery));
          if (status === 'sent') summary.push.sent += 1;
          else if (status === 'skipped') summary.push.noDevices += 1;
          else summary.push.failed += 1;
        } catch (error) {
          await recordDelivery(campaign.rows[0].id, user.id, 'push', 'failed', destination, error.message);
          summary.push.failed += 1;
        }
      }
      if (channels.includes('email')) {
        if (!user.email) {
          await recordDelivery(campaign.rows[0].id, user.id, 'email', 'skipped', null, 'Customer has no email address.');
          summary.email.skipped += 1;
          continue;
        }
        try {
          const name = escapeHtml(user.full_name || 'there');
          const image = imageUrl ? `<p><img src="${escapeHtml(imageUrl)}" alt="" style="max-width:100%;border-radius:12px" /></p>` : '';
          await sendEmail({
            to: user.email,
            subject: title,
            text: `${title}\n\n${message}\n\nOpen AsaforVTU: https://vtu.ferixas.com${destination.startsWith('/') ? destination : ''}`,
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#152238"><p>Hello ${name},</p>${image}<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p><p><a href="${escapeHtml(destination.startsWith('/') ? `https://vtu.ferixas.com${destination}` : destination)}">Open AsaforVTU</a></p></div>`
          });
          await recordDelivery(campaign.rows[0].id, user.id, 'email', 'sent', user.email);
          summary.email.sent += 1;
        } catch (error) {
          await recordDelivery(campaign.rows[0].id, user.id, 'email', 'failed', user.email, error.message);
          summary.email.failed += 1;
        }
      }
    }
    res.status(201).json({ campaign: campaign.rows[0], summary });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { getStatus, listDeliveries, sendCampaign };
