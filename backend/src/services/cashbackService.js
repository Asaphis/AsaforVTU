const walletService = require('./walletService');
const pool = require('../config/database');
const notificationService = require('./notificationService');

const CASHBACK_PERCENTAGE = 0.03; // 3%

class CashbackService {
  async processCashback(userId, amount, transactionId) {
    try {
      // Check if cashback is enabled globally
      const settingsResult = await pool.query(
        "SELECT value FROM settings WHERE key = 'cashback_settings'"
      );
      
      if (settingsResult.rows.length > 0) {
        const cashbackSettings = settingsResult.rows[0].value;
        if (cashbackSettings.enabled === false) {
          console.log('[Cashback Service] Cashback is disabled globally');
          return;
        }
      }

      const cashbackAmount = amount * CASHBACK_PERCENTAGE;

      if (cashbackAmount > 0) {
        await walletService.creditWallet(
          userId, 
          cashbackAmount, 
          'cashback',
          `Cashback for transaction ${transactionId}`,
          `CASHBACK_${transactionId}`,
          { transactionId }
        );

        await notificationService.sendNotification(
          userId,
          'Cashback Received',
          `You received ₦${cashbackAmount.toFixed(2)} cashback!`,
          'wallet',
          { transactionId }
        );
      }
    } catch (error) {
      console.error('[Cashback Service] Error processing cashback:', error);
    }
  }
}

module.exports = new CashbackService();
