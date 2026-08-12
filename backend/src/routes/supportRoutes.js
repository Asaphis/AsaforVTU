const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

router.use(authenticate);

// Create support ticket
router.post('/tickets', async (req, res) => {
  try {
    const { subject, category, priority } = req.body;
    
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, category, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, subject, category || 'general', priority || 'normal']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Support Routes] Create ticket error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's tickets
router.get('/tickets', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM support_tickets 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[Support Routes] Get tickets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get ticket messages
router.get('/tickets/:id/messages', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM support_messages 
       WHERE ticket_id = $1 
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[Support Routes] Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reply to ticket
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await pool.query(
      `INSERT INTO support_messages (ticket_id, user_id, is_admin, message)
       VALUES ($1, $2, false, $3)
       RETURNING *`,
      [req.params.id, req.user.id, message]
    );

    // Update ticket status to in_progress if it was open
    await pool.query(
      `UPDATE support_tickets 
       SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND status = 'open'`,
      [req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Support Routes] Reply error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
