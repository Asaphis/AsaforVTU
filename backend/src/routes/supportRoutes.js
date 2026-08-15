const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const notificationService = require('../services/notificationService');

const router = express.Router();
router.use(authenticate);

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'support'));
fs.mkdirSync(uploadDirectory, { recursive: true });
const maxAttachmentBytes = Number(process.env.MAX_SUPPORT_ATTACHMENT_MB || 15) * 1024 * 1024;
const supportedAttachmentTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/webm', 'video/quicktime'
]);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: maxAttachmentBytes, files: 3 },
  fileFilter: (_req, file, callback) => callback(null, supportedAttachmentTypes.has(file.mimetype)),
});

const removeUploadedFiles = (files = []) => files.forEach(file => fs.unlink(file.path, () => {}));
const ownedTicket = async (ticketId, userId) => {
  const result = await pool.query('SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2', [ticketId, userId]);
  return result.rows[0] || null;
};
const canAccessTicket = (ticket, user) => ticket && (ticket.user_id === user.id || user.is_admin || user.role === 'admin');
const createAttachments = async (client, ticketId, messageId, userId, files = []) => {
  const attachments = [];
  for (const file of files) {
    const result = await client.query(
      `INSERT INTO support_attachments (ticket_id, message_id, uploaded_by, original_name, storage_name, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, original_name, mime_type, size_bytes, created_at`,
      [ticketId, messageId, userId, path.basename(file.originalname), file.filename, file.mimetype, file.size]
    );
    attachments.push(result.rows[0]);
  }
  return attachments;
};

router.post('/tickets', upload.array('attachments', 3), async (req, res) => {
  const client = await pool.connect();
  try {
    const { subject, message, category = 'general', priority = 'normal' } = req.body || {};
    if (!subject || (!message && !(req.files || []).length)) return res.status(400).json({ error: 'Subject and a message or attachment are required' });
    await client.query('BEGIN');
    const ticketResult = await client.query(
      `INSERT INTO support_tickets (user_id, subject, category, priority) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, subject.trim(), category, priority]
    );
    const ticket = ticketResult.rows[0];
    const messageResult = await client.query(
      `INSERT INTO support_messages (ticket_id, user_id, is_admin, message) VALUES ($1, $2, false, $3) RETURNING *`,
      [ticket.id, req.user.id, String(message || '').trim()]
    );
    const attachments = await createAttachments(client, ticket.id, messageResult.rows[0].id, req.user.id, req.files || []);
    await client.query('COMMIT');
    try { await notificationService.sendNotification(req.user.id, 'Support ticket created', `Your support ticket "${ticket.subject}" was received.`, 'support', { ticketId: ticket.id }); } catch (notificationError) { console.error('[Support Routes] Ticket notification failed:', notificationError.message); }
    res.status(201).json({ ...ticket, attachments });
  } catch (error) {
    await client.query('ROLLBACK');
    removeUploadedFiles(req.files || []);
    console.error('[Support Routes] Create ticket error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tickets/:id/messages', async (req, res) => {
  try {
    if (!await ownedTicket(req.params.id, req.user.id)) return res.status(404).json({ error: 'Ticket not found' });
    const result = await pool.query(
      `SELECT sm.*, COALESCE(json_agg(json_build_object('id', sa.id, 'original_name', sa.original_name, 'mime_type', sa.mime_type, 'size_bytes', sa.size_bytes)
       ORDER BY sa.created_at) FILTER (WHERE sa.id IS NOT NULL), '[]'::json) AS attachments
       FROM support_messages sm LEFT JOIN support_attachments sa ON sa.message_id = sm.id
       WHERE sm.ticket_id = $1 GROUP BY sm.id ORDER BY sm.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tickets/:id/reply', upload.array('attachments', 3), async (req, res) => {
  const client = await pool.connect();
  try {
    const { message } = req.body || {};
    if (!message && !(req.files || []).length) return res.status(400).json({ error: 'A message or attachment is required' });
    if (!await ownedTicket(req.params.id, req.user.id)) return res.status(404).json({ error: 'Ticket not found' });
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO support_messages (ticket_id, user_id, is_admin, message) VALUES ($1, $2, false, $3) RETURNING *`,
      [req.params.id, req.user.id, String(message || '').trim()]
    );
    const attachments = await createAttachments(client, req.params.id, result.rows[0].id, req.user.id, req.files || []);
    await client.query(
      `UPDATE support_tickets SET status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
       updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    await client.query('COMMIT');
    try { await notificationService.sendNotification(req.user.id, 'Support reply sent', 'Your reply was added to the support ticket.', 'support', { ticketId: req.params.id, messageId: result.rows[0].id }); } catch (notificationError) { console.error('[Support Routes] Reply notification failed:', notificationError.message); }
    res.status(201).json({ ...result.rows[0], attachments });
  } catch (error) {
    await client.query('ROLLBACK');
    removeUploadedFiles(req.files || []);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

router.get('/attachments/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sa.*, st.user_id FROM support_attachments sa JOIN support_tickets st ON st.id = sa.ticket_id WHERE sa.id = $1`,
      [req.params.id]
    );
    const attachment = result.rows[0];
    if (!canAccessTicket(attachment, req.user)) return res.status(404).json({ error: 'Attachment not found' });
    const safePath = path.resolve(uploadDirectory, attachment.storage_name);
    if (!safePath.startsWith(`${uploadDirectory}${path.sep}`) || !fs.existsSync(safePath)) return res.status(404).json({ error: 'Attachment file not found' });
    res.type(attachment.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.original_name.replace(/["\\]/g, '_')}"`);
    res.sendFile(safePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
