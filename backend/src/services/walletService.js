const pool = require('../config/database');

const BALANCE_FIELDS = new Set(['main', 'cashback', 'referral']);
const fieldFor = (walletType) => {
  if (!BALANCE_FIELDS.has(walletType)) throw new Error('Invalid wallet type');
  return `${walletType}_balance`;
};

const normalizeWallet = (wallet) => wallet ? {
  ...wallet,
  main_balance: Number(wallet.main_balance || 0),
  cashback_balance: Number(wallet.cashback_balance || 0),
  referral_balance: Number(wallet.referral_balance || 0),
  total_earned: Number(wallet.total_earned || 0),
  total_spent: Number(wallet.total_spent || 0)
} : null;

const getLockedWallet = async (client, userId) => {
  let result = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
  if (result.rows.length === 0) {
    await client.query('INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
    result = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
  }
  if (result.rows.length === 0) throw new Error('Wallet not found');
  return result.rows[0];
};

const createWallet = async (userId) => {
  const result = await pool.query(
    'INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING *',
    [userId]
  );
  if (result.rows[0]) return normalizeWallet(result.rows[0]);
  return getWalletByUserId(userId);
};

const getWalletByUserId = async (userId) => {
  const result = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  return normalizeWallet(result.rows[0] || null);
};

const assertAmount = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Amount must be greater than zero');
  return value;
};

const writeLedger = async (client, wallet, userId, type, amount, balanceAfter, description, reference, metadata = null) => {
  await client.query(
    `INSERT INTO wallet_transactions
      (user_id, wallet_id, type, amount, balance_after, description, reference, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, wallet.id, type, amount, balanceAfter, description, reference, metadata]
  );
};

const creditWallet = async (userId, amount, walletType = 'main', description = null, reference = null, metadata = null) => {
  const value = assertAmount(amount);
  const balanceField = fieldFor(walletType);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wallet = await getLockedWallet(client, userId);
    if (reference) {
      const existing = await client.query('SELECT id FROM wallet_transactions WHERE user_id = $1 AND reference = $2 LIMIT 1', [userId, reference]);
      if (existing.rows.length) { await client.query('COMMIT'); return getWalletByUserId(userId); }
    }
    const newBalance = Number(wallet[balanceField] || 0) + value;
    await client.query(
      `UPDATE wallets
       SET ${balanceField} = ${balanceField} + $1,
           total_earned = total_earned + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [value, userId]
    );
    await writeLedger(client, wallet, userId, 'credit', value, newBalance, description, reference, metadata);
    await client.query('COMMIT');
    return getWalletByUserId(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const debitWallet = async (userId, amount, walletType = 'main', description = null, reference = null, metadata = null) => {
  const value = assertAmount(amount);
  const balanceField = fieldFor(walletType);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wallet = await getLockedWallet(client, userId);
    if (reference) {
      const existing = await client.query('SELECT id FROM wallet_transactions WHERE user_id = $1 AND reference = $2 LIMIT 1', [userId, reference]);
      if (existing.rows.length) { await client.query('COMMIT'); return getWalletByUserId(userId); }
    }
    const currentBalance = Number(wallet[balanceField] || 0);
    if (currentBalance < value) throw new Error(`Insufficient ${walletType} balance`);
    const newBalance = currentBalance - value;
    await client.query(
      `UPDATE wallets
       SET ${balanceField} = ${balanceField} - $1,
           total_spent = total_spent + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [value, userId]
    );
    await writeLedger(client, wallet, userId, 'debit', value, newBalance, description, reference, metadata);
    await client.query('COMMIT');
    return getWalletByUserId(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const transferWalletBalance = async (userId, fromType, toType, amount, description = null) => {
  const value = assertAmount(amount);
  if (fromType === toType) throw new Error('Source and destination wallets must differ');
  const fromField = fieldFor(fromType);
  const toField = fieldFor(toType);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wallet = await getLockedWallet(client, userId);
    const fromBalance = Number(wallet[fromField] || 0);
    const toBalance = Number(wallet[toField] || 0);
    if (fromBalance < value) throw new Error(`Insufficient ${fromType} balance`);
    const fromAfter = fromBalance - value;
    const toAfter = toBalance + value;
    await client.query(
      `UPDATE wallets
       SET ${fromField} = ${fromField} - $1,
           ${toField} = ${toField} + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [value, userId]
    );
    const note = description || `Transfer from ${fromType} to ${toType}`;
    await writeLedger(client, wallet, userId, 'debit', value, fromAfter, note, null, { fromType, toType });
    await writeLedger(client, wallet, userId, 'credit', value, toAfter, note, null, { fromType, toType });
    await client.query('COMMIT');
    return getWalletByUserId(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getWalletTransactions = async (userId, limit = 50, offset = 0) => {
  const result = await pool.query(
    `SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, Math.min(Number(limit) || 50, 500), Math.max(Number(offset) || 0, 0)]
  );
  return result.rows;
};

const getAllWallets = async (limit = 100, offset = 0) => {
  const result = await pool.query(
    `SELECT w.*, u.email, u.full_name, u.username
     FROM wallets w JOIN users u ON w.user_id = u.id
     ORDER BY w.created_at DESC LIMIT $1 OFFSET $2`,
    [Math.min(Number(limit) || 100, 500), Math.max(Number(offset) || 0, 0)]
  );
  return result.rows.map(normalizeWallet);
};

const getWalletBalance = async (userId, walletType = 'main') => {
  const wallet = await getWalletByUserId(userId);
  if (!wallet) return 0;
  return Number(wallet[`${walletType}_balance`] || 0);
};

const getTotalSystemBalance = async () => {
  const result = await pool.query(
    `SELECT SUM(main_balance) AS total_main, SUM(cashback_balance) AS total_cashback,
            SUM(referral_balance) AS total_referral, COUNT(*) AS total_wallets FROM wallets`
  );
  return result.rows[0];
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
