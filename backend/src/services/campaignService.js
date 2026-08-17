const pool = require('../config/database');
const notificationService = require('./notificationService');
const { sendEmail } = require('./emailService');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const eligibleCustomer = `
  u.is_active = TRUE
  AND COALESCE(u.role, 'user') <> 'admin'
  AND LOWER(COALESCE(u.email, '')) NOT LIKE '%@example.invalid'
  AND LOWER(TRIM(COALESCE(u.full_name, ''))) <> 'auth audit test'
`;

const parseMetadata = (value) => {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value || '{}'); } catch (_) { return {}; }
};

const campaignChannels = (value) => {
  const source = Array.isArray(value) ? value : parseMetadata(value).channels || [];
  return [...new Set(source.map((channel) => String(channel).toLowerCase()).filter((channel) => ['push', 'email'].includes(channel)))];
};

const recordDelivery = (campaignId, userId, channel, status, destination, providerResponse = null) => pool.query(
  `INSERT INTO notification_deliveries (campaign_id, user_id, channel, status, destination, provider_response)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [campaignId, userId, channel, status, destination, providerResponse]
);

const resolveRecipients = async (campaign) => {
  const metadata = parseMetadata(campaign.metadata);
  const selectedUserIds = Array.isArray(metadata.userIds) ? metadata.userIds.map(String).slice(0, 500) : [];
  const selectedDeviceIds = Array.isArray(metadata.deviceIds) ? metadata.deviceIds.map(String).slice(0, 500) : [];
  let deviceOwners = [];
  if (selectedDeviceIds.length) {
    const result = await pool.query(
      `SELECT DISTINCT d.id, d.user_id
       FROM notification_devices d
       INNER JOIN users u ON u.id = d.user_id
       WHERE d.id = ANY($1::uuid[]) AND d.is_active = TRUE AND ${eligibleCustomer}`,
      [selectedDeviceIds]
    );
    deviceOwners = result.rows;
  }
  const effectiveUserIds = [...new Set([...selectedUserIds, ...deviceOwners.map((row) => String(row.user_id))])];
  const audience = String(campaign.audience || 'all').toLowerCase();
  const result = await pool.query(
    audience === 'all'
      ? `SELECT u.id, u.full_name, u.email FROM users u WHERE ${eligibleCustomer}`
      : `SELECT u.id, u.full_name, u.email FROM users u WHERE ${eligibleCustomer} AND u.id = ANY($1::uuid[])`,
    audience === 'all' ? [] : [effectiveUserIds]
  );
  return { recipients: result.rows, selectedDeviceIds };
};

const sendCampaignDelivery = async (campaign) => {
  const metadata = parseMetadata(campaign.metadata);
  const channels = campaignChannels(campaign.channels);
  const { recipients, selectedDeviceIds } = await resolveRecipients(campaign);
  const destination = campaign.destination || '/dashboard/notifications';
  const imageUrl = campaign.image_url || null;
  const summary = { recipients: recipients.length, push: { sent: 0, failed: 0, noDevices: 0 }, email: { sent: 0, failed: 0, skipped: 0 } };

  for (const user of recipients) {
    if (channels.includes('push')) {
      try {
        const notification = await notificationService.sendNotification(user.id, campaign.title, campaign.message, 'announcement', {
          campaignId: campaign.id,
          deep_link: destination,
          image_url: imageUrl || undefined,
          device_ids: selectedDeviceIds.length ? selectedDeviceIds : undefined,
          scheduled: Boolean(metadata.scheduleMode && metadata.scheduleMode !== 'immediate')
        });
        const delivery = notification.push || { delivered: false, reason: 'unknown' };
        const status = delivery.delivered ? 'sent' : delivery.reason === 'no_registered_devices' ? 'skipped' : 'failed';
        await recordDelivery(campaign.id, user.id, 'push', status, destination, JSON.stringify(delivery));
        if (status === 'sent') summary.push.sent += 1;
        else if (status === 'skipped') summary.push.noDevices += 1;
        else summary.push.failed += 1;
      } catch (error) {
        await recordDelivery(campaign.id, user.id, 'push', 'failed', destination, error.message);
        summary.push.failed += 1;
      }
    }

    if (channels.includes('email')) {
      if (!user.email) {
        await recordDelivery(campaign.id, user.id, 'email', 'skipped', null, 'Customer has no email address.');
        summary.email.skipped += 1;
        continue;
      }
      try {
        const name = escapeHtml(user.full_name || 'there');
        const image = imageUrl ? `<p><img src="${escapeHtml(imageUrl)}" alt="" style="max-width:100%;border-radius:12px" /></p>` : '';
        const target = destination.startsWith('/') ? `https://vtu.ferixas.com${destination}` : destination;
        await sendEmail({
          to: user.email,
          subject: campaign.title,
          text: `${campaign.title}\n\n${campaign.message}\n\nOpen AsaforVTU: ${target}`,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#152238"><p>Hello ${name},</p>${image}<h2>${escapeHtml(campaign.title)}</h2><p>${escapeHtml(campaign.message).replace(/\n/g, '<br/>')}</p><p><a href="${escapeHtml(target)}">Open AsaforVTU</a></p></div>`
        });
        await recordDelivery(campaign.id, user.id, 'email', 'sent', user.email);
        summary.email.sent += 1;
      } catch (error) {
        await recordDelivery(campaign.id, user.id, 'email', 'failed', user.email, error.message);
        summary.email.failed += 1;
      }
    }
  }
  return summary;
};

const nextRecurringRun = (campaign, from = new Date()) => {
  const interval = campaign.recurrence === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  let next = new Date(campaign.next_run_at || campaign.scheduled_for || from).getTime();
  const now = from.getTime();
  do { next += interval; } while (next <= now);
  return new Date(next);
};

const markDeliveryComplete = async (campaign, summary, statusOverride = null) => {
  const now = new Date();
  const isRecurring = campaign.recurrence === 'daily' || campaign.recurrence === 'weekly';
  const nextRunAt = isRecurring ? nextRecurringRun(campaign, now) : null;
  const status = statusOverride || (isRecurring ? 'recurring' : 'sent');
  const result = await pool.query(
    `UPDATE notification_campaigns
     SET status = $2, last_run_at = $3, next_run_at = $4, updated_at = CURRENT_TIMESTAMP,
         metadata = COALESCE(metadata, '{}'::jsonb) || $5::jsonb
     WHERE id = $1
     RETURNING *`,
    [campaign.id, status, now, nextRunAt, JSON.stringify({ lastSummary: summary })]
  );
  return result.rows[0];
};

let schedulerRunning = false;
const runDueCampaigns = async () => {
  if (schedulerRunning) return { processed: 0, skipped: true };
  schedulerRunning = true;
  try {
    const due = await pool.query(
      `SELECT * FROM notification_campaigns
       WHERE deleted_at IS NULL AND is_paused = FALSE AND status IN ('scheduled', 'recurring')
         AND next_run_at IS NOT NULL AND next_run_at <= CURRENT_TIMESTAMP
       ORDER BY next_run_at ASC
       LIMIT 20`
    );
    for (const campaign of due.rows) {
      try {
        const summary = await sendCampaignDelivery(campaign);
        await markDeliveryComplete(campaign, summary);
        console.log(`[Campaigns] Delivered scheduled campaign ${campaign.id}.`);
      } catch (error) {
        console.error(`[Campaigns] Scheduled campaign ${campaign.id} failed:`, error.message);
        await pool.query(
          `UPDATE notification_campaigns
           SET status = CASE WHEN recurrence IN ('daily', 'weekly') THEN 'recurring' ELSE 'failed' END,
               last_run_at = CURRENT_TIMESTAMP, next_run_at = CASE WHEN recurrence IN ('daily', 'weekly') THEN $2 ELSE NULL END,
               updated_at = CURRENT_TIMESTAMP,
               metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb
           WHERE id = $1`,
          [campaign.id, campaign.recurrence === 'weekly' || campaign.recurrence === 'daily' ? nextRecurringRun(campaign) : null, JSON.stringify({ lastError: error.message })]
        );
      }
    }
    return { processed: due.rows.length };
  } finally {
    schedulerRunning = false;
  }
};

module.exports = { eligibleCustomer, parseMetadata, resolveRecipients, sendCampaignDelivery, markDeliveryComplete, runDueCampaigns };
