const pool = require('../config/database');
const walletService = require('./walletService');
const transactionService = require('./transactionService');

// Create payment
const createPayment = async (paymentData) => {
  try {
    const {
      user_id,
      transaction_id,
      amount,
      payment_method = 'flutterwave',
      provider = 'flutterwave',
      metadata = {},
      tx_ref: suppliedTxRef = null
    } = paymentData;

    const tx_ref = suppliedTxRef || `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await pool.query(
      `INSERT INTO payments (user_id, transaction_id, amount, payment_method, provider, tx_ref, metadata, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [user_id, transaction_id, amount, payment_method, provider, tx_ref, JSON.stringify(metadata)]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[Payment Service] Error creating payment:', error);
    throw error;
  }
};

// Update payment status
const updatePaymentStatus = async (paymentId, status, providerData = {}) => {
  try {
    const updateFields = ['status = $2'];
    const updateValues = [paymentId, status];
    let paramIndex = 3;

    if (providerData.provider_reference) {
      updateFields.push(`provider_reference = $${paramIndex}`);
      updateValues.push(providerData.provider_reference);
      paramIndex++;
    }

    if (providerData.flw_ref) {
      updateFields.push(`flw_ref = $${paramIndex}`);
      updateValues.push(providerData.flw_ref);
      paramIndex++;
    }

    if (providerData.metadata) {
      updateFields.push(`metadata = metadata || $${paramIndex}::jsonb`);
      updateValues.push(JSON.stringify(providerData.metadata));
      paramIndex++;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE payments 
      SET ${updateFields.join(', ')} 
      WHERE id = $1 
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      throw new Error('Payment not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Payment Service] Error updating payment:', error);
    throw error;
  }
};

// Get payment by ID
const getPaymentById = async (paymentId) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              u.email, u.full_name,
              t.reference as transaction_reference, t.type as transaction_type
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN transactions t ON p.transaction_id = t.id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Payment Service] Error getting payment:', error);
    throw error;
  }
};

// Get payment by transaction reference
const getPaymentByTxRef = async (txRef, userId = null) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              u.email, u.full_name,
              t.reference as transaction_reference, t.type as transaction_type
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN transactions t ON p.transaction_id = t.id
       WHERE (p.tx_ref = $1 OR p.provider_reference = $1)${userId ? ' AND p.user_id = $2' : ''}`,
      userId ? [txRef, userId] : [txRef]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Payment Service] Error getting payment by tx_ref:', error);
    throw error;
  }
};

// Get payments by user ID
const getPaymentsByUserId = async (userId, limit = 50, offset = 0, status = null) => {
  try {
    let query = `
      SELECT p.*, 
             t.reference as transaction_reference, t.type as transaction_type
      FROM payments p
      LEFT JOIN transactions t ON p.transaction_id = t.id
      WHERE p.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    console.error('[Payment Service] Error getting user payments:', error);
    throw error;
  }
};

// Process successful payment. Wallet credit uses the unique payment tx_ref as
// its ledger reference, making retries safe even if the status update is retried.
const processSuccessfulPayment = async (paymentId, providerData = {}) => {
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new Error('Payment not found');
  if (payment.status === 'success') return payment;

  await walletService.creditWallet(
    payment.user_id,
    Number(payment.amount),
    'main',
    'Payment for wallet funding',
    payment.tx_ref,
    { paymentId, providerData }
  );

  const updatedPayment = await updatePaymentStatus(paymentId, 'success', providerData);
  if (payment.transaction_id) {
    await transactionService.completeTransaction(payment.transaction_id, providerData.provider_reference, providerData);
  }
  return updatedPayment;
};

// Process failed payment
const processFailedPayment = async (paymentId, reason = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get payment
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Update payment status
    const updatedPayment = await updatePaymentStatus(paymentId, 'failed', {
      metadata: { failure_reason: reason }
    });

    // If payment is linked to a transaction, fail it
    if (payment.transaction_id) {
      await transactionService.failTransaction(payment.transaction_id, reason || 'Payment failed');
    }

    await client.query('COMMIT');

    return updatedPayment;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Payment Service] Error processing failed payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Reverse payment
const reversePayment = async (paymentId, reason = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get payment
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'success') {
      throw new Error('Can only reverse successful payments');
    }

    // Update payment status
    const updatedPayment = await updatePaymentStatus(paymentId, 'reversed', {
      metadata: { reversal_reason: reason }
    });

    // Debit wallet (reverse the credit)
    await walletService.debitWallet(
      payment.user_id,
      payment.amount,
      'main',
      `Payment reversal: ${reason || 'Payment reversed'}`,
      `REVERSAL_${payment.tx_ref}`
    );

    await client.query('COMMIT');

    return updatedPayment;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Payment Service] Error reversing payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get payment statistics
const getPaymentStats = async (userId = null, startDate = null, endDate = null) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        SUM(amount) FILTER (WHERE status = 'success') as total_amount,
        AVG(amount) FILTER (WHERE status = 'success') as average_amount
      FROM payments
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(query, params);

    return result.rows[0];
  } catch (error) {
    console.error('[Payment Service] Error getting stats:', error);
    throw error;
  }
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  getPaymentById,
  getPaymentByTxRef,
  getPaymentsByUserId,
  processSuccessfulPayment,
  processFailedPayment,
  reversePayment,
  getPaymentStats
};
