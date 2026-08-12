const walletService = require('./walletService');
const pool = require('../config/database');
const notificationService = require('./notificationService');

const REFERRAL_BONUS_AMOUNT = 10; // Configurable

class ReferralService {
  
  async getDailyBudget() {
    try {
      const result = await pool.query(
        "SELECT value FROM settings WHERE key = 'referral_settings'"
      );
      
      if (result.rows.length > 0) {
        return result.rows[0].value?.daily_budget || 1000;
      }
      return 1000; // Default
    } catch (error) {
      console.error('[Referral Service] Error getting daily budget:', error);
      return 1000;
    }
  }

  async getDailyUsage() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await pool.query(
        `SELECT COALESCE(SUM(reward_amount), 0) as total 
         FROM referrals 
         WHERE DATE(created_at) = $1`,
        [today]
      );
      return Number(result.rows[0].total || 0);
    } catch (error) {
      console.error('[Referral Service] Error getting daily usage:', error);
      return 0;
    }
  }

  async processReferral(userId, transactionId) {
    try {
      // 1. Get User Profile to find referrer
      const userResult = await pool.query(
        'SELECT referred_by FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        console.log('[Referral Service] User not found');
        return;
      }
      
      const referrerId = userResult.rows[0].referred_by;

      if (!referrerId) {
        console.log('[Referral Service] User has no referrer');
        return;
      }

      // 2. Check Budget
      const budget = await this.getDailyBudget();
      const usage = await this.getDailyUsage();

      if (usage + REFERRAL_BONUS_AMOUNT > budget) {
        console.log('[Referral Service] Daily referral budget exceeded');
        await notificationService.sendNotification(
          referrerId,
          'Referral Bonus Missed',
          'Daily referral budget exceeded. No bonus credited.'
        );
        return;
      }

      // 3. Check if referral already processed
      const existingReferral = await pool.query(
        'SELECT id FROM referrals WHERE referred_id = $1 LIMIT 1',
        [userId]
      );
      
      if (existingReferral.rows.length > 0) {
        console.log('[Referral Service] Referral already processed');
        return;
      }

      // 4. Credit Referrer
      await walletService.creditWallet(
        referrerId,
        REFERRAL_BONUS_AMOUNT,
        'referral',
        `Referral bonus from user ${userId}`
      );

      // 5. Record referral
      await pool.query(
        `INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_amount, is_paid)
         VALUES ($1, $2, $3, $4, true)`,
        [referrerId, userId, '', REFERRAL_BONUS_AMOUNT]
      );
      
      await notificationService.sendNotification(
        referrerId,
        'Referral Bonus',
        `You earned ₦${REFERRAL_BONUS_AMOUNT} referral bonus!`
      );

    } catch (error) {
      console.error('[Referral Service] Error processing referral:', error);
    }
  }
}

module.exports = new ReferralService();
