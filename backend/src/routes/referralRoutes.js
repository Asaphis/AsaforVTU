const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');
const referralService = require('../services/referralService');

const router = express.Router();
router.use(authenticate);

router.get('/me', async (req, res) => {
  try {
    const user = await pool.query('SELECT referral_code FROM users WHERE id = $1', [req.user.id]);
    const referrals = await pool.query(
      `SELECT r.id, r.referral_code, r.reward_amount, r.is_paid, r.created_at,
              u.username, u.full_name
       FROM referrals r JOIN users u ON u.id = r.referred_id
       WHERE r.referrer_id = $1 ORDER BY r.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    const settings = await referralService.getSettings();
    res.json({ code: user.rows[0]?.referral_code || null, enabled: settings.enabled !== false, reward_amount: Number(settings.reward_amount || 0), referrals: referrals.rows, daily_usage: await referralService.getDailyUsage() });
  } catch (error) {
    console.error('[Referral Routes] Summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
