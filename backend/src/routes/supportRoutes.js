const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

const ownedTicket = async (ticketId, userId) => {
  const result = await pool.query('SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2', [ticketId, userId]);
  return result.rows[0] || null;
};

router.post('/tickets', async (req, res) => {
  const client = await pool.connect();
  try {
    const { subject, message, category = 'general', priority = 'normal' } = req.body || {};
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
    await client.query('BEGIN');
    const ticketResult = await client.query(
      `INSERT INTO support_tickets (user_id, subject, category, priority)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, subject.trim(), category, priority]
    );
    const ticket = ticketResult.rows[0];
    await client.query(
      `INSERT INTO support_messages (ticket_id, user_id, is_admin, message)
       VALUES ($1, $2, false, $3)`,
      [ticket.id, req.user.id, message.trim()]
    );
    await client.query('COMMIT');
    res.status(201).json(ticket);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Support Routes] Create ticket error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tickets/:id/messages', async (req, res) => {
  try {
    if (!await ownedTicket(req.params.id, req.user.id)) return res.status(404).json({ error: 'Ticket not found' });
    const result = await pool.query(
      `SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const ticket = await ownedTicket(req.params.id, req.user.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    const result = await pool.query(
      `INSERT INTO support_messages (ticket_id, user_id, is_admin, message)
       VALUES ($1, $2, false, $3) RETURNING *`,
      [req.params.id, req.user.id, message.trim()]
    );
    await pool.query(
      `UPDATE support_tickets SET status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
       updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
