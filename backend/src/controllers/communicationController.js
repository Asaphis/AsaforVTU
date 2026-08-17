const pool = require('../config/database');
const { eligibleCustomer, parseMetadata, sendCampaignDelivery, markDeliveryComplete } = require('../services/campaignService');

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

const parseSchedule = (body) => {
  const scheduleMode = String(body?.scheduleMode || 'immediate').toLowerCase();
  const recurrence = String(body?.recurrence || 'none').toLowerCase();
  if (!['immediate', 'scheduled'].includes(scheduleMode)) throw new Error('Schedule mode must be immediate or scheduled.');
  if (!['none', 'daily', 'weekly'].includes(recurrence)) throw new Error('Recurrence must be none, daily, or weekly.');
  if (scheduleMode === 'immediate') return { scheduleMode, recurrence: 'none', scheduledFor: null, nextRunAt: null, status: 'sent' };
  const scheduledFor = new Date(String(body?.scheduledFor || ''));
  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now() + 30 * 1000) {
    throw new Error('Choose a future time at least one minute from now for a scheduled campaign.');
  }
  return { scheduleMode, recurrence, scheduledFor, nextRunAt: scheduledFor, status: recurrence === 'none' ? 'scheduled' : 'recurring' };
};

const parseCampaignInput = (body) => {
  const title = String(body?.title || '').trim();
  const message = String(body?.message || '').trim();
  const channels = [...new Set((Array.isArray(body?.channels) ? body.channels : [])
    .map((channel) => String(channel).toLowerCase()).filter((channel) => ['push', 'email'].includes(channel)))];
  const audience = String(body?.audience || 'all').toLowerCase();
  const userIds = Array.isArray(body?.userIds) ? body.userIds.map(String).slice(0, 500) : [];
  const deviceIds = Array.isArray(body?.deviceIds) ? body.deviceIds.map(String).slice(0, 500) : [];
  if (!title || title.length > 255 || !message || message.length > 5000) throw new Error('A title up to 255 characters and a message up to 5,000 characters are required.');
  if (!channels.length) throw new Error('Choose at least one delivery channel.');
  if (!['all', 'selected'].includes(audience)) throw new Error('Audience must be all or selected.');
  if (audience === 'selected' && !userIds.length && !deviceIds.length) throw new Error('Select at least one customer or device.');
  const schedule = parseSchedule(body);
  return {
    title, message, channels, audience, userIds, deviceIds,
    destination: allowedDestination(body?.destination), imageUrl: allowedImageUrl(body?.imageUrl), schedule
  };
};

const getStatus = async (_req, res) => {
  try {
    const devices = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notification_devices d INNER JOIN users u ON u.id = d.user_id WHERE d.is_active = TRUE AND ${eligibleCustomer}`
    );
    res.json({
      push: { enabled: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS), activeDevices: devices.rows[0].count, required: 'Firebase backend credential and a user-installed mobile app that has approved notification permission.' },
      email: { enabled: Boolean(process.env.RESEND_API_KEY), from: process.env.EMAIL_FROM || process.env.RESEND_FROM || null, required: 'Resend API key and a verified sender domain.' }
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const listDeliveries = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
    const result = await pool.query(
      `SELECT c.id AS campaign_id, c.title, c.message, c.channels, c.audience, c.destination, c.image_url, c.status, c.scheduled_for, c.next_run_at, c.last_run_at, c.recurrence, c.is_paused, c.metadata, c.created_at, c.updated_at,
              u.full_name, u.email,
              COUNT(d.id)::int AS attempted,
              COUNT(*) FILTER (WHERE d.status = 'sent')::int AS sent,
              COUNT(*) FILTER (WHERE d.status = 'queued')::int AS queued,
              COUNT(*) FILTER (WHERE d.status = 'failed')::int AS failed
       FROM notification_campaigns c
       LEFT JOIN notification_deliveries d ON d.campaign_id = c.id
       LEFT JOIN users u ON u.id = c.admin_id
       WHERE c.deleted_at IS NULL
       GROUP BY c.id, u.full_name, u.email
       ORDER BY COALESCE(c.next_run_at, c.created_at) DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const listRecipients = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id AS user_id, u.full_name, u.email, d.id AS device_id, d.platform, d.last_seen_at
       FROM users u LEFT JOIN notification_devices d ON d.user_id = u.id AND d.is_active = TRUE
       WHERE ${eligibleCustomer}
       ORDER BY LOWER(COALESCE(u.full_name, u.email)), d.last_seen_at DESC NULLS LAST`
    );
    const grouped = new Map();
    for (const row of result.rows) {
      if (!grouped.has(row.user_id)) grouped.set(row.user_id, { id: row.user_id, name: row.full_name || 'Customer', email: row.email || '', devices: [] });
      if (row.device_id) grouped.get(row.user_id).devices.push({ id: row.device_id, platform: row.platform, lastSeenAt: row.last_seen_at });
    }
    res.json({ recipients: [...grouped.values()], deviceCount: [...grouped.values()].reduce((count, user) => count + user.devices.length, 0) });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const createCampaign = async (adminId, input) => {
  const metadata = { userIds: input.userIds, deviceIds: input.deviceIds, scheduleMode: input.schedule.scheduleMode, recipientCount: 0 };
  const result = await pool.query(
    `INSERT INTO notification_campaigns (admin_id, title, message, channels, audience, destination, image_url, metadata, status, scheduled_for, next_run_at, recurrence)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10, $11, $12)
     RETURNING *`,
    [adminId, input.title, input.message, JSON.stringify(input.channels), input.audience, input.destination, input.imageUrl, JSON.stringify(metadata), input.schedule.status, input.schedule.scheduledFor, input.schedule.nextRunAt, input.schedule.recurrence]
  );
  return result.rows[0];
};

const sendCampaign = async (req, res) => {
  try {
    const input = parseCampaignInput(req.body);
    let campaign = await createCampaign(req.user.id, input);
    if (input.schedule.scheduleMode === 'scheduled') return res.status(201).json({ campaign, scheduled: true });
    const summary = await sendCampaignDelivery(campaign);
    campaign = await markDeliveryComplete(campaign, summary);
    res.status(201).json({ campaign, summary, scheduled: false });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

const updateCampaign = async (req, res) => {
  try {
    const input = parseCampaignInput(req.body);
    const existing = await pool.query('SELECT * FROM notification_campaigns WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Campaign not found.' });
    const metadata = { ...parseMetadata(existing.rows[0].metadata), userIds: input.userIds, deviceIds: input.deviceIds, scheduleMode: input.schedule.scheduleMode };
    const result = await pool.query(
      `UPDATE notification_campaigns SET title=$2, message=$3, channels=$4::jsonb, audience=$5, destination=$6, image_url=$7, metadata=$8::jsonb,
         status=$9, scheduled_for=$10, next_run_at=$11, recurrence=$12, is_paused=FALSE, updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 RETURNING *`,
      [req.params.id, input.title, input.message, JSON.stringify(input.channels), input.audience, input.destination, input.imageUrl, JSON.stringify(metadata), input.schedule.status, input.schedule.scheduledFor, input.schedule.nextRunAt, input.schedule.recurrence]
    );
    res.json({ campaign: result.rows[0] });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

const setCampaignPause = async (req, res) => {
  try {
    const paused = Boolean(req.body?.paused);
    const result = await pool.query(
      `UPDATE notification_campaigns SET is_paused=$2, status=CASE WHEN $2 THEN 'paused' WHEN recurrence IN ('daily','weekly') THEN 'recurring' ELSE 'scheduled' END, updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
      [req.params.id, paused]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Campaign not found.' });
    res.json({ campaign: result.rows[0] });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

const resendCampaign = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notification_campaigns WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    const campaign = result.rows[0];
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    const summary = await sendCampaignDelivery(campaign);
    await pool.query(`UPDATE notification_campaigns SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [campaign.id, JSON.stringify({ lastResendAt: new Date().toISOString(), lastResendSummary: summary })]);
    res.json({ campaign, summary });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

const deleteCampaign = async (req, res) => {
  try {
    const result = await pool.query(`UPDATE notification_campaigns SET deleted_at=CURRENT_TIMESTAMP, status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND deleted_at IS NULL RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Campaign not found.' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

module.exports = { getStatus, listDeliveries, listRecipients, sendCampaign, updateCampaign, setCampaignPause, resendCampaign, deleteCampaign };
