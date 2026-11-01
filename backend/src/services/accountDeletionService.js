const crypto = require('crypto');
const pool = require('../config/database');
const { comparePassword } = require('./authService');

const GRACE_PERIOD_DAYS = Math.max(7, Number(process.env.ACCOUNT_DELETION_GRACE_DAYS || 30));

const requestDeletion = async (userId, currentPassword, confirmation) => {
  if (confirmation !== 'DELETE') throw new Error('Type DELETE to confirm account deletion');
  if (!currentPassword) throw new Error('Current password is required');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      'SELECT id, password_hash, email_verified FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    if (!userResult.rows[0]) throw new Error('User not found');
    if (!(await comparePassword(currentPassword, userResult.rows[0].password_hash))) {
      throw new Error('Current password is incorrect');
    }

    const existing = await client.query(
      `SELECT id, status, scheduled_for FROM account_deletion_requests
       WHERE user_id = $1 AND status = 'requested' LIMIT 1`,
      [userId]
    );
    if (existing.rows[0]) {
      await client.query('COMMIT');
      return { success: true, status: 'requested', scheduled_for: existing.rows[0].scheduled_for, already_requested: true };
    }

    const scheduledFor = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const result = await client.query(
      `INSERT INTO account_deletion_requests (user_id, scheduled_for)
       VALUES ($1, $2) RETURNING id, status, requested_at, scheduled_for`,
      [userId, scheduledFor]
    );
    await client.query(
      'UPDATE users SET deletion_requested_at = CURRENT_TIMESTAMP, deletion_scheduled_for = $1 WHERE id = $2',
      [scheduledFor, userId]
    );
    await client.query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1', [userId]);
    await client.query('COMMIT');
    return { success: true, ...result.rows[0], grace_period_days: GRACE_PERIOD_DAYS };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

const getDeletionStatus = async (userId) => {
  const result = await pool.query(
    `SELECT id, status, requested_at, scheduled_for, cancelled_at, processed_at, blocked_reason
     FROM account_deletion_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || { status: 'not_requested' };
};

const cancelDeletion = async (userId, currentPassword) => {
  if (!currentPassword) throw new Error('Current password is required');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query('SELECT password_hash FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (!userResult.rows[0]) throw new Error('User not found');
    if (!(await comparePassword(currentPassword, userResult.rows[0].password_hash))) {
      throw new Error('Current password is incorrect');
    }
    const result = await client.query(
      `UPDATE account_deletion_requests
       SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'requested'
       RETURNING id, status, cancelled_at`,
      [userId]
    );
    if (!result.rows[0]) throw new Error('No active deletion request was found');
    await client.query(
      'UPDATE users SET deletion_requested_at = NULL, deletion_scheduled_for = NULL WHERE id = $1',
      [userId]
    );
    await client.query('COMMIT');
    return { success: true, ...result.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

const processDueDeletions = async () => {
  const due = await pool.query(
    `SELECT id, user_id FROM account_deletion_requests
     WHERE status = 'requested' AND scheduled_for <= CURRENT_TIMESTAMP
     ORDER BY scheduled_for ASC LIMIT 50`
  );
  let processed = 0;
  let blocked = 0;

  for (const request of due.rows) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query(
        `SELECT adr.id, adr.user_id FROM account_deletion_requests adr
         WHERE adr.id = $1 AND adr.status = 'requested' FOR UPDATE SKIP LOCKED`,
        [request.id]
      );
      if (!locked.rows[0]) { await client.query('ROLLBACK'); continue; }
      const userId = locked.rows[0].user_id;
      const financials = await client.query(
        `SELECT
           COALESCE(w.main_balance, 0) + COALESCE(w.cashback_balance, 0) + COALESCE(w.referral_balance, 0) AS balance,
           EXISTS (SELECT 1 FROM payments p WHERE p.user_id = $1 AND p.status IN ('pending', 'processing')) AS pending_payment
         FROM users u LEFT JOIN wallets w ON w.user_id = u.id WHERE u.id = $1 FOR UPDATE OF u`,
        [userId]
      );
      const row = financials.rows[0];
      if (!row || Number(row.balance) > 0 || row.pending_payment) {
        blocked += 1;
        await client.query('UPDATE account_deletion_requests SET blocked_reason = $2 WHERE id = $1', [request.id, Number(row?.balance || 0) > 0 ? 'Wallet balance must be settled before anonymization' : 'Pending payment must be reconciled before anonymization']);
        await client.query('COMMIT');
        continue;
      }

      const redactedEmail = `deleted+${userId}@redacted.invalid`;
      const redactedUsername = `deleted_${userId.replace(/-/g, '').slice(0, 24)}`;
      await client.query(
        `UPDATE users SET email = $1, full_name = 'Deleted user', username = $2,
          phone = NULL, avatar_url = NULL, password_hash = $3, pin_hash = NULL,
          email_verified = FALSE, is_active = FALSE,
          deletion_requested_at = NULL, deletion_scheduled_for = NULL
         WHERE id = $4`,
        [redactedEmail, redactedUsername, crypto.randomBytes(48).toString('hex'), userId]
      );
      await client.query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1', [userId]);
      await client.query(
        `UPDATE account_deletion_requests SET status = 'processed', processed_at = CURRENT_TIMESTAMP,
          blocked_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [request.id]
      );
      await client.query('COMMIT');
      processed += 1;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Account Deletion] Processing failed:', error.message);
    } finally {
      client.release();
    }
  }
  return { processed, blocked, examined: due.rows.length };
};

module.exports = { requestDeletion, getDeletionStatus, cancelDeletion, processDueDeletions };
