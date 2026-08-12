const pool = require('../config/database');
const flutterwaveService = require('../services/flutterwaveService');

/**
 * Reconciles pending payments by verifying them with Flutterwave
 * and crediting the user if successful.
 */
const reconcilePayments = async () => {
  console.log('[Cron] Starting payment reconciliation...');
  try {
    // Get pending payments
    const result = await pool.query(
      `SELECT * FROM payments 
       WHERE status = 'pending' 
       AND provider = 'flutterwave'
       ORDER BY created_at ASC
       LIMIT 50`
    );

    if (result.rows.length === 0) {
      console.log('[Cron] No pending payments found to reconcile.');
      return;
    }

    console.log(`[Cron] Processing ${result.rows.length} pending payments.`);

    const results = await Promise.all(result.rows.map(async (payment) => {
      const tx_ref = payment.tx_ref;
      const userId = payment.user_id;
      const expectedAmount = payment.amount;

      if (!userId) {
        console.warn(`[Cron] Payment ${payment.id} missing userId. Skipping.`);
        return { id: payment.id, status: 'skipped', reason: 'missing_userId' };
      }

      try {
        // Attempt verification
        const verifyResult = await flutterwaveService.creditIfValid(tx_ref, expectedAmount, userId);
        
        if (verifyResult.success) {
          console.log(`[Cron] Payment ${tx_ref} verified and credited.`);
          return { id: payment.id, status: 'success' };
        } else {
          return { id: payment.id, status: 'failed', data: verifyResult.data };
        }
      } catch (error) {
        console.error(`[Cron] Error reconciling payment ${tx_ref}:`, error.message);
        return { id: payment.id, status: 'error', error: error.message };
      }
    }));

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`[Cron] Reconciliation complete. Success: ${successCount}/${result.rows.length}`);

  } catch (error) {
    console.error('[Cron] Payment reconciliation failed:', error);
  }
};

module.exports = reconcilePayments;
