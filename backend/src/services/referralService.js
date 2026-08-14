const walletService = require('./walletService');
const pool = require('../config/database');
const notificationService = require('./notificationService');

const DEFAULT_REWARD = 10;

class ReferralService {
  async getSettings() {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'referral_settings'");
    return result.rows[0]?.value || { enabled: true, reward_amount: DEFAULT_REWARD, daily_budget: 1000 };
  }

  async getDailyUsage() {
    const result = await pool.query(
      `SELECT COALESCE(SUM(reward_amount), 0) AS total FROM referrals
       WHERE is_paid = true AND DATE(created_at) = CURRENT_DATE`
    );
    return Number(result.rows[0]?.total || 0);
  }

  async processReferral(userId, transactionId) {
    const settings = await this.getSettings();
    if (settings.enabled === false) return;
    const reward = Number(settings.reward_amount || DEFAULT_REWARD);
    if (!Number.isFinite(reward) || reward <= 0) return;

    const relation = await pool.query(
      `SELECT r.id AS referral_id, r.referrer_id, r.is_paid, u.referred_by,
              ref.id AS resolved_referrer_id
       FROM users u
       LEFT JOIN referrals r ON r.referred_id = u.id
       LEFT JOIN users ref ON ref.referral_code = u.referred_by
       WHERE u.id = $1
       ORDER BY r.created_at ASC LIMIT 1`,
      [userId]
    );
    const row = relation.rows[0];
    const referrerId = row?.resolved_referrer_id || row?.referrer_id;
    if (!referrerId || row?.is_paid) return;

    const budget = Number(settings.daily_budget || 1000);
    if (await this.getDailyUsage() + reward > budget) {
      await notificationService.sendNotification(referrerId, 'Referral Bonus Missed', 'The daily referral reward budget has been reached.', 'referral', { userId, transactionId });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query('SELECT id, is_paid FROM referrals WHERE referred_id = $1 FOR UPDATE', [userId]);
      if (locked.rows[0]?.is_paid) {
        await client.query('ROLLBACK');
        return;
      }
      if (!locked.rows[0]) {
        await client.query(
          `INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_amount, is_paid)
           SELECT $1, $2, COALESCE(u.referred_by, ''), 0, false FROM users u WHERE u.id = $2`,
          [referrerId, userId]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    await walletService.creditWallet(referrerId, reward, 'referral', `Referral bonus from user ${userId}`, `REFERRAL_${userId}`, { transactionId });
    await pool.query(
      `UPDATE referrals SET reward_amount = $1, is_paid = true, updated_at = CURRENT_TIMESTAMP
       WHERE referred_id = $2 AND is_paid = false`,
      [reward, userId]
    );
    await notificationService.sendNotification(referrerId, 'Referral Bonus', `You earned ₦${reward.toFixed(2)} referral bonus!`, 'referral', { userId, transactionId });
  }
}

module.exports = new ReferralService();
