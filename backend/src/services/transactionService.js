const pool = require('../config/database');
const walletService = require('./walletService');

// Create transaction
const createTransaction = async (transactionData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      user_id,
      service_id,
      plan_id,
      type,
      amount,
      phone,
      meter_number,
      smartcard_number,
      customer_name,
      customer_address,
      metadata = {}
    } = transactionData;

    // Generate reference
    const reference = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert transaction
    const result = await client.query(
      `INSERT INTO transactions (user_id, service_id, plan_id, type, amount, reference, phone, meter_number, smartcard_number, customer_name, customer_address, metadata, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
       RETURNING *`,
      [user_id, service_id, plan_id, type, amount, reference, phone, meter_number, smartcard_number, customer_name, customer_address, JSON.stringify(metadata)]
    );

    const transaction = result.rows[0];

    await client.query('COMMIT');

    return transaction;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Transaction Service] Error creating transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Update transaction status
const updateTransactionStatus = async (transactionId, status, providerReference = null, metadata = null) => {
  try {
    const updateFields = ['status = $2'];
    const updateValues = [transactionId, status];
    let paramIndex = 3;

    if (providerReference) {
      updateFields.push(`provider_reference = $${paramIndex}`);
      updateValues.push(providerReference);
      paramIndex++;
    }

    if (metadata) {
      updateFields.push(`metadata = metadata || $${paramIndex}::jsonb`);
      updateValues.push(JSON.stringify(metadata));
      paramIndex++;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE transactions 
      SET ${updateFields.join(', ')} 
      WHERE id = $1 
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Transaction Service] Error updating transaction:', error);
    throw error;
  }
};

// Get transaction by ID
const getTransactionById = async (transactionId, userId = null) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
              u.email, u.full_name,
              s.name as service_name, s.category as service_category,
              sp.name as plan_name, sp.network as plan_network
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN services s ON t.service_id = s.id
       LEFT JOIN service_plans sp ON t.plan_id = sp.id
       WHERE t.id = $1${userId ? ' AND t.user_id = $2' : ''}`,
      userId ? [transactionId, userId] : [transactionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Transaction Service] Error getting transaction:', error);
    throw error;
  }
};

// Get transactions by user ID
const getTransactionsByUserId = async (userId, limit = 50, offset = 0, status = null) => {
  try {
    let query = `
      SELECT t.*, 
             s.name as service_name, s.category as service_category,
             sp.name as plan_name, sp.network as plan_network
      FROM transactions t
      LEFT JOIN services s ON t.service_id = s.id
      LEFT JOIN service_plans sp ON t.plan_id = sp.id
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    console.error('[Transaction Service] Error getting user transactions:', error);
    throw error;
  }
};

// Get all transactions (admin)
const getAllTransactions = async (limit = 100, offset = 0, status = null, type = null) => {
  try {
    let query = `
      SELECT t.*, 
             u.email, u.full_name, u.username,
             s.name as service_name, s.category as service_category,
             sp.name as plan_name, sp.network as plan_network
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN services s ON t.service_id = s.id
      LEFT JOIN service_plans sp ON t.plan_id = sp.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      query += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    console.error('[Transaction Service] Error getting all transactions:', error);
    throw error;
  }
};

// Get transaction by reference
const getTransactionByReference = async (reference) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
              u.email, u.full_name,
              s.name as service_name, s.category as service_category,
              sp.name as plan_name, sp.network as plan_network
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN services s ON t.service_id = s.id
       LEFT JOIN service_plans sp ON t.plan_id = sp.id
       WHERE t.reference = $1`,
      [reference]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Transaction Service] Error getting transaction by reference:', error);
    throw error;
  }
};

// Process transaction with wallet payment
const processTransactionWithWallet = async (transactionId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get transaction
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error('Transaction is not in pending status');
    }

    // Debit wallet
    await walletService.debitWallet(
      transaction.user_id,
      transaction.amount,
      'main',
      `Payment for ${transaction.type} transaction`,
      transaction.reference
    );

    // Update transaction status to processing
    await updateTransactionStatus(transactionId, 'processing');

    await client.query('COMMIT');

    return transaction;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Transaction Service] Error processing transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Complete transaction (success)
const completeTransaction = async (transactionId, providerReference = null, metadata = null) => {
  try {
    const transaction = await updateTransactionStatus(
      transactionId,
      'success',
      providerReference,
      metadata
    );

    try {
      const cashbackService = require('./cashbackService');
      const referralService = require('./referralService');
      await cashbackService.processCashback(transaction.user_id, Number(transaction.amount), transaction.id);
      await referralService.processReferral(transaction.user_id, transaction.id);
    } catch (rewardError) {
      console.error('[Transaction Service] Reward processing failed:', rewardError.message);
    }

    return transaction;
  } catch (error) {
    console.error('[Transaction Service] Error completing transaction:', error);
    throw error;
  }
};

// Fail transaction and refund wallet
const failTransaction = async (transactionId, reason = null, shouldRefund = false) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get transaction
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update transaction status
    await updateTransactionStatus(transactionId, 'failed', null, {
      failure_reason: reason,
      failed_at: new Date().toISOString()
    });

    // Refund only when the caller explicitly asks this helper to do it. The
    // VTU route debits and refunds through the wallet service separately.
    if (shouldRefund && transaction.status === 'processing') {
      await walletService.creditWallet(
        transaction.user_id,
        transaction.amount,
        'main',
        `Refund for failed ${transaction.type} transaction: ${reason || 'Transaction failed'}`,
        `REFUND_${transaction.reference}`
      );
    }

    await client.query('COMMIT');

    return transaction;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Transaction Service] Error failing transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get transaction statistics
const getTransactionStats = async (userId = null, startDate = null, endDate = null) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        SUM(amount) FILTER (WHERE status = 'success') as total_amount,
        AVG(amount) FILTER (WHERE status = 'success') as average_amount
      FROM transactions
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
    console.error('[Transaction Service] Error getting stats:', error);
    throw error;
  }
};

module.exports = {
  createTransaction,
  updateTransactionStatus,
  getTransactionById,
  getTransactionsByUserId,
  getAllTransactions,
  getTransactionByReference,
  processTransactionWithWallet,
  completeTransaction,
  failTransaction,
  getTransactionStats
};
