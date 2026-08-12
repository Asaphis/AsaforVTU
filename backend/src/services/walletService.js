const pool = require('../config/database');

// Create wallet for user
const createWallet = async (userId) => {
  try {
    const result = await pool.query(
      `INSERT INTO wallets (user_id) 
       VALUES ($1) 
       ON CONFLICT (user_id) DO NOTHING 
       RETURNING *`,
      [userId]
    );

    return result.rows[0] || await getWalletByUserId(userId);
  } catch (error) {
    console.error('[Wallet Service] Error creating wallet:', error);
    throw error;
  }
};

// Get wallet by user ID
const getWalletByUserId = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Wallet Service] Error getting wallet:', error);
    throw error;
  }
};

// Credit wallet
const creditWallet = async (userId, amount, walletType = 'main', description = null, reference = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Ensure wallet exists
    let wallet = await getWalletByUserId(userId);
    if (!wallet) {
      wallet = await createWallet(userId);
    }

    // Determine which balance to update
    const balanceField = `${walletType}_balance`;
    const currentBalance = wallet[balanceField] || 0;
    const newBalance = parseFloat(currentBalance) + parseFloat(amount);

    // Update wallet balance
    await client.query(
      `UPDATE wallets 
       SET ${balanceField} = $1, 
           total_earned = total_earned + $2,
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $3`,
      [newBalance, amount, userId]
    );

    // Record transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, balance_after, description, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, wallet.id, 'credit', amount, newBalance, description, reference]
    );

    await client.query('COMMIT');

    // Return updated wallet
    const updatedWallet = await getWalletByUserId(userId);
    return updatedWallet;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Wallet Service] Error crediting wallet:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Debit wallet
const debitWallet = async (userId, amount, walletType = 'main', description = null, reference = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Ensure wallet exists
    let wallet = await getWalletByUserId(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Determine which balance to update
    const balanceField = `${walletType}_balance`;
    const currentBalance = wallet[balanceField] || 0;

    // Check sufficient balance
    if (parseFloat(currentBalance) < parseFloat(amount)) {
      throw new Error(`Insufficient ${walletType} balance`);
    }

    const newBalance = parseFloat(currentBalance) - parseFloat(amount);

    // Update wallet balance
    await client.query(
      `UPDATE wallets 
       SET ${balanceField} = $1, 
           total_spent = total_spent + $2,
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $3`,
      [newBalance, amount, userId]
    );

    // Record transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, balance_after, description, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, wallet.id, 'debit', amount, newBalance, description, reference]
    );

    await client.query('COMMIT');

    // Return updated wallet
    const updatedWallet = await getWalletByUserId(userId);
    return updatedWallet;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Wallet Service] Error debiting wallet:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Transfer between wallet types
const transferWalletBalance = async (userId, fromType, toType, amount, description = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Ensure wallet exists
    let wallet = await getWalletByUserId(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const fromField = `${fromType}_balance`;
    const toField = `${toType}_balance`;
    const fromBalance = wallet[fromField] || 0;
    const toBalance = wallet[toField] || 0;

    // Check sufficient balance
    if (parseFloat(fromBalance) < parseFloat(amount)) {
      throw new Error(`Insufficient ${fromType} balance`);
    }

    const newFromBalance = parseFloat(fromBalance) - parseFloat(amount);
    const newToBalance = parseFloat(toBalance) + parseFloat(amount);

    // Update wallet balances
    await client.query(
      `UPDATE wallets 
       SET ${fromField} = $1, ${toField} = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $3`,
      [newFromBalance, newToBalance, userId]
    );

    // Record debit transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, balance_after, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, wallet.id, 'debit', amount, newFromBalance, description || ` (Transfer from ${fromType} to ${toType})`]
    );

    // Record credit transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, balance_after, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, wallet.id, 'credit', amount, newToBalance, description || ` (Transfer from ${fromType} to ${toType})`]
    );

    await client.query('COMMIT');

    // Return updated wallet
    const updatedWallet = await getWalletByUserId(userId);
    return updatedWallet;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Wallet Service] Error transferring balance:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get wallet transactions
const getWalletTransactions = async (userId, limit = 50, offset = 0) => {
  try {
    const result = await pool.query(
      `SELECT * FROM wallet_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('[Wallet Service] Error getting transactions:', error);
    throw error;
  }
};

// Get all wallets (admin)
const getAllWallets = async (limit = 100, offset = 0) => {
  try {
    const result = await pool.query(
      `SELECT w.*, u.email, u.full_name, u.username 
       FROM wallets w 
       JOIN users u ON w.user_id = u.id 
       ORDER BY w.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('[Wallet Service] Error getting all wallets:', error);
    throw error;
  }
};

// Get wallet balance
const getWalletBalance = async (userId, walletType = 'main') => {
  try {
    const wallet = await getWalletByUserId(userId);
    if (!wallet) {
      return 0;
    }

    const balanceField = `${walletType}_balance`;
    return parseFloat(wallet[balanceField] || 0);
  } catch (error) {
    console.error('[Wallet Service] Error getting balance:', error);
    throw error;
  }
};

// Get total system wallet balance (admin)
const getTotalSystemBalance = async () => {
  try {
    const result = await pool.query(
      `SELECT 
         SUM(main_balance) as total_main,
         SUM(cashback_balance) as total_cashback,
         SUM(referral_balance) as total_referral,
         COUNT(*) as total_wallets
       FROM wallets`
    );

    return result.rows[0];
  } catch (error) {
    console.error('[Wallet Service] Error getting system balance:', error);
    throw error;
  }
};

module.exports = {
  createWallet,
  getWalletByUserId,
  creditWallet,
  debitWallet,
  transferWalletBalance,
  getWalletTransactions,
  getAllWallets,
  getWalletBalance,
  getTotalSystemBalance
};
