const pool = require('../config/database');
const walletService = require('../services/walletService');
const flutterwaveService = require('../services/flutterwaveService');
const transactionService = require('../services/transactionService');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');

const getStats = async (req, res) => {
  try {
    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get total wallet balance
    const walletResult = await pool.query('SELECT COALESCE(SUM(main_balance), 0) as total FROM wallets');
    const walletBalance = parseFloat(walletResult.rows[0].total);

    // Get total transactions
    const transactionsResult = await pool.query('SELECT COUNT(*) as count FROM transactions');
    const totalTransactions = parseInt(transactionsResult.rows[0].count);

    // Get today's sales
    const todaySalesResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE DATE(created_at) = CURRENT_DATE 
      AND status = 'success'
    `);
    const todaySales = parseFloat(todaySalesResult.rows[0].total);

    // Get daily totals for the last 7 days
    const dailyTotalsResult = await pool.query(`
      SELECT 
        DATE(created_at) as day,
        COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND status = 'success'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);

    // Get recent transactions
    const recentTransactionsResult = await pool.query(`
      SELECT t.*, u.email, u.full_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 6
    `);

    res.json({
      totalUsers,
      walletBalance,
      totalTransactions,
      todaySales,
      dailyTotals: dailyTotalsResult.rows,
      recentTransactions: recentTransactionsResult.rows
    });
  } catch (error) {
    console.error('[Admin Controller] Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

const financeSummary = async ({ userId = null, start = null, end = null } = {}) => {
  const params = [];
  const filters = ['t.status = \'success\''];
  if (userId) { params.push(userId); filters.push(`t.user_id = $${params.length}`); }
  if (start) { params.push(start); filters.push(`t.created_at >= $${params.length}`); }
  if (end) { params.push(end); filters.push(`t.created_at <= $${params.length}`); }
  const summary = await pool.query(
    `SELECT COALESCE(SUM(t.amount), 0) AS deposits,
            COALESCE(SUM(COALESCE(NULLIF(t.metadata->>'provider_cost', '')::numeric, 0)), 0) AS provider_cost,
            COUNT(*) AS transaction_count
     FROM transactions t WHERE ${filters.join(' AND ')}`,
    params
  );
  return summary.rows[0];
};

const resolveFinanceUser = async (req) => {
  const target = req.query.uid || req.query.email;
  if (!target) return null;
  const result = await pool.query('SELECT id FROM users WHERE id::text = $1 OR lower(email) = lower($1) LIMIT 1', [String(target)]);
  return result.rows[0]?.id || null;
};

const getFinanceAnalytics = async (req, res) => {
  try {
    const userId = await resolveFinanceUser(req);
    if ((req.query.uid || req.query.email) && !userId) return res.status(404).json({ error: 'User not found' });
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 6); startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [daily, weekly, monthly, total, wallet] = await Promise.all([
      financeSummary({ userId, start: startOfDay }),
      financeSummary({ userId, start: startOfWeek }),
      financeSummary({ userId, start: startOfMonth }),
      financeSummary({ userId }),
      userId ? pool.query('SELECT main_balance FROM wallets WHERE user_id = $1', [userId]) : pool.query('SELECT COALESCE(SUM(main_balance), 0) AS main_balance FROM wallets')
    ]);
    const recent = await pool.query(
      `SELECT t.id, t.user_id AS "userId", COALESCE(u.email, '') AS "user", t.amount AS "userPrice",
              COALESCE(NULLIF(t.metadata->>'provider_cost', '')::numeric, 0) AS "providerCost",
              t.type, t.type AS "serviceType", true AS "isService", t.status, t.created_at AS "createdAt",
              t.metadata->>'failure_source' AS "failureSource", t.metadata->>'failure_reason' AS "failureReason"
       FROM transactions t LEFT JOIN users u ON u.id = t.user_id
       ${userId ? 'WHERE t.user_id = $1' : ''} ORDER BY t.created_at DESC LIMIT 100`,
      userId ? [userId] : []
    );
    const shape = (row) => ({ deposits: Number(row.deposits || 0), providerCost: Number(row.provider_cost || 0), smsCost: 0, netProfit: Number(row.deposits || 0) - Number(row.provider_cost || 0) });
    res.json({
      scope: userId ? 'user' : 'system',
      providerBalanceRequired: Number(total.rows[0]?.provider_cost || 0),
      walletBalance: Number(wallet.rows[0]?.main_balance || 0),
      totalWalletBalance: Number(wallet.rows[0]?.main_balance || 0),
      daily: shape(daily.rows[0]), weekly: shape(weekly.rows[0]), monthly: shape(monthly.rows[0]),
      totals: { depositsTotal: Number(total.rows[0]?.deposits || 0), providerCostTotal: Number(total.rows[0]?.provider_cost || 0), smsCostTotal: 0, netProfitTotal: Number(total.rows[0]?.deposits || 0) - Number(total.rows[0]?.provider_cost || 0) },
      transactions: recent.rows
    });
  } catch (error) {
    console.error('[Admin Controller] Finance analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getFinanceSystem = async (req, res) => getFinanceAnalytics({ ...req, query: { ...(req.query || {}) } }, res);
const getFinanceUser = async (req, res) => getFinanceAnalytics(req, res);

const getWalletLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wt.*, u.email, u.full_name
       FROM wallet_transactions wt
       LEFT JOIN users u ON wt.user_id = u.id
       ORDER BY wt.created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Admin Controller] Wallet logs error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getWalletDeposits = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.email, u.full_name
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.payment_method = 'flutterwave'
       ORDER BY p.created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Admin Controller] Wallet deposits error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const incoming = req.body || {};
    const body = { ...incoming };
    if (incoming.airtimeNetworks !== undefined) body.airtime_networks = incoming.airtimeNetworks;
    if (incoming.cashbackEnabled !== undefined) body.cashback_settings = { enabled: Boolean(incoming.cashbackEnabled) };
    if (incoming.dailyReferralBudget !== undefined) body.referral_settings = { daily_budget: Number(incoming.dailyReferralBudget) };
    delete body.airtimeNetworks;
    delete body.cashbackEnabled;
    delete body.dailyReferralBudget;

    // Process each normalized setting key
    for (const [key, value] of Object.entries(body)) {
      const existing = await pool.query(
        'SELECT id FROM settings WHERE key = $1',
        [key]
      );
      
      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
          [JSON.stringify(value), key]
        );
      } else {
        await pool.query(
          'INSERT INTO settings (key, value, description, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
          [key, JSON.stringify(value), `Setting: ${key}`]
        );
      }
    }
    
    res.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('[Admin Controller] Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('[Admin Controller] Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const offset = Number(req.query.offset || 0);
    const status = req.query.status;
    const type = req.query.type;
    
    const transactions = await transactionService.getAllTransactions(limit, offset, status, type);
    res.json(transactions);
  } catch (error) {
    console.error('[Admin Controller] Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
};

const creditWallet = async (req, res) => {
  try {
    const { userId, amount, walletType, description } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    const wtype = ['main', 'cashback', 'referral'].includes(walletType) ? walletType : 'main';
    const raw = String(userId || '').trim();
    let targetUserId = '';
    
    // Resolve user - can be email or UUID
    try {
      if (raw.includes('@')) {
        // It's an email
        const userResult = await pool.query(
          'SELECT id FROM users WHERE email = $1 LIMIT 1',
          [raw.toLowerCase()]
        );
        if (userResult.rows.length > 0) {
          targetUserId = userResult.rows[0].id;
        } else {
          return res.status(400).json({ error: `User with email '${raw}' not found` });
        }
      } else {
        // It's likely a UUID
        const userResult = await pool.query(
          'SELECT id FROM users WHERE id = $1 LIMIT 1',
          [raw]
        );
        if (userResult.rows.length > 0) {
          targetUserId = userResult.rows[0].id;
        } else {
          return res.status(400).json({ error: `User ID '${raw}' not found` });
        }
      }
    } catch (e) {
      console.error('[Admin Controller] User resolution error:', e);
      return res.status(400).json({ error: 'Failed to resolve user' });
    }

    console.log(`[Admin Credit] Crediting user ${targetUserId} with amount ${amt}`);

    // Create wallet and credit
    await walletService.createWallet(targetUserId);
    const creditDescription = description || 'Admin Credit';
    const newBalance = await walletService.creditWallet(targetUserId, amt, wtype, creditDescription);
    if (wtype === 'main') {
      const reference = `ADMIN_CREDIT_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await paymentService.recordWalletCreditActivity({
        userId: targetUserId, amount: amt, reference, description: creditDescription,
        metadata: { source: 'admin', walletType: wtype, adminId: req.user.id },
        notificationTitle: 'Wallet credited by administrator',
        notificationMessage: `An administrator credited your wallet with ₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`
      });
    } else {
      await notificationService.sendNotification(targetUserId, 'Wallet balance updated', `Your ${wtype} balance was credited with ₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`, 'wallet', { source: 'admin', walletType: wtype, adminId: req.user.id });
    }
    
    // Log to admin_audit for tracking
    try {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, admin_email, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.user.id,
          req.user.email,
          'credit_wallet',
          'user',
          targetUserId,
          JSON.stringify({ amount: amt, walletType: wtype, description })
        ]
      );
    } catch (e) {
      console.error('[Admin Controller] Failed to log admin audit:', e);
    }

    res.json({ 
      success: true, 
      userId: targetUserId, 
      newBalance, 
      walletType: wtype
    });
  } catch (error) {
    console.error('[Admin Controller] Credit wallet error:', error);
    res.status(500).json({ error: error.message });
  }
};

const debitWallet = async (req, res) => {
  try {
    const { userId, amount, walletType, description } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    const wtype = ['main', 'cashback', 'referral'].includes(walletType) ? walletType : 'main';
    const raw = String(userId || '').trim();
    let targetUserId = '';
    
    // Resolve user
    try {
      if (raw.includes('@')) {
        const userResult = await pool.query(
          'SELECT id FROM users WHERE email = $1 LIMIT 1',
          [raw.toLowerCase()]
        );
        if (userResult.rows.length > 0) {
          targetUserId = userResult.rows[0].id;
        } else {
          return res.status(400).json({ error: `User with email '${raw}' not found` });
        }
      } else {
        const userResult = await pool.query(
          'SELECT id FROM users WHERE id = $1 LIMIT 1',
          [raw]
        );
        if (userResult.rows.length > 0) {
          targetUserId = userResult.rows[0].id;
        } else {
          return res.status(400).json({ error: `User ID '${raw}' not found` });
        }
      }
    } catch (e) {
      return res.status(400).json({ error: 'Failed to resolve user' });
    }

    // Debit wallet
    const newBalance = await walletService.debitWallet(targetUserId, amt, wtype, description || 'Admin Debit');
    
    // Log to admin_audit
    try {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, admin_email, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.user.id,
          req.user.email,
          'debit_wallet',
          'user',
          targetUserId,
          JSON.stringify({ amount: amt, walletType: wtype, description })
        ]
      );
    } catch (e) {
      console.error('[Admin Controller] Failed to log admin audit:', e);
    }

    res.json({ 
      success: true, 
      userId: targetUserId, 
      newBalance, 
      walletType: wtype
    });
  } catch (error) {
    console.error('[Admin Controller] Debit wallet error:', error);
    res.status(500).json({ error: error.message });
  }
};

const reverifyPayment = async (req, res) => {
  try {
    const { tx_ref, force } = req.body;
    if (!tx_ref) return res.status(400).json({ error: 'tx_ref is required' });
    
    const result = await flutterwaveService.reconcilePayment(tx_ref, force === true || force === 'true');
    res.json(result);
  } catch (error) {
    console.error('[Admin Controller] Reverify payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const offset = Number(req.query.offset || 0);
    const search = req.query.search;
    
    let query = `
      SELECT u.id, u.email, u.full_name, u.username, u.phone,
             u.is_active, u.is_admin, u.role, u.email_verified,
             u.created_at, u.last_login_at,
             COALESCE(w.main_balance, 0) AS main_balance,
             COALESCE(w.cashback_balance, 0) AS cashback_balance,
             COALESCE(w.referral_balance, 0) AS referral_balance
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` WHERE (u.email ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('[Admin Controller] List users error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, full_name, displayName, username, phone, phoneNumber, is_admin, requireVerification = true } = req.body;
    const normalizedFullName = full_name ?? displayName ?? '';
    const normalizedPhone = phone ?? phoneNumber ?? '';
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { registerUser } = require('../services/authService');
    const user = await registerUser({
      email,
      password,
      full_name: normalizedFullName,
      username: username || email.split('@')[0],
      phone: normalizedPhone
    });
    
    // Set admin if requested
    if (is_admin) {
      await pool.query(
        'UPDATE users SET is_admin = true, role = $1 WHERE id = $2',
        ['admin', user.id]
      );
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('[Admin Controller] Create user error:', error);
    res.status(500).json({ error: error.message });
  }
};

const promoteToAdmin = async (req, res) => {
  try {
    const { userId, uid, email } = req.body || {};
    const target = userId || uid || email;
    if (!target) return res.status(400).json({ error: 'userId, uid, or email is required' });
    const result = await pool.query(
      `UPDATE users SET is_admin = true, role = 'admin', email_verified = true
       WHERE id::text = $1 OR lower(email) = lower($1) RETURNING id, email`,
      [String(target)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    res.json({ success: true, message: 'User promoted to admin' });
  } catch (error) {
    console.error('[Admin Controller] Promote to admin error:', error);
    res.status(500).json({ error: error.message });
  }
};

const suspendUser = async (req, res) => {
  try {
    const { userId, uid, email, suspend } = req.body || {};
    const target = userId || uid || email;
    if (!target) return res.status(400).json({ error: 'userId, uid, or email is required' });
    const result = await pool.query(
      `UPDATE users SET is_active = $1 WHERE id::text = $2 OR lower(email) = lower($2) RETURNING id, email, is_active`,
      [!suspend, String(target)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    res.json({ success: true, message: suspend ? 'User suspended' : 'User activated' });
  } catch (error) {
    console.error('[Admin Controller] Suspend user error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.*, u.email, u.full_name
       FROM support_tickets st
       LEFT JOIN users u ON st.user_id = u.id
       ORDER BY st.created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Admin Controller] Get tickets error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const { subject, category, priority } = req.body;
    
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    
    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, category, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, subject, category || 'general', priority || 'normal']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Create ticket error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTicketMessages = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sm.*, u.email, u.full_name
       FROM support_messages sm
       LEFT JOIN users u ON sm.user_id = u.id
       WHERE sm.ticket_id = $1
       ORDER BY sm.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Admin Controller] Get ticket messages error:', error);
    res.status(500).json({ error: error.message });
  }
};

const replyTicket = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const ticketResult = await pool.query('SELECT id, user_id, subject FROM support_tickets WHERE id = $1', [req.params.id]);
    if (!ticketResult.rows[0]) return res.status(404).json({ error: 'Ticket not found' });
    const ticket = ticketResult.rows[0];
    const result = await pool.query(
      `INSERT INTO support_messages (ticket_id, user_id, is_admin, message)
       VALUES ($1, $2, true, $3)
       RETURNING *`,
      [req.params.id, req.user.id, message]
    );
    try { await notificationService.sendNotification(ticket.user_id, 'Support replied', `Support replied to your ticket: ${ticket.subject}`, 'support', { ticketId: ticket.id, messageId: result.rows[0].id }); } catch (notificationError) { console.error('[Admin Controller] Support reply notification failed:', notificationError.message); }
    
    // Update ticket status
    await pool.query(
      `UPDATE support_tickets 
       SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND status = 'open'`,
      [req.params.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Reply ticket error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const ticketResult = await pool.query('SELECT id, user_id, subject FROM support_tickets WHERE id = $1', [req.params.id]);
    if (!ticketResult.rows[0]) return res.status(404).json({ error: 'Ticket not found' });
    await pool.query(
      'UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, req.params.id]
    );
    try { await notificationService.sendNotification(ticketResult.rows[0].user_id, 'Support ticket updated', `Your support ticket is now ${status}.`, 'support', { ticketId: req.params.id, status }); } catch (notificationError) { console.error('[Admin Controller] Support status notification failed:', notificationError.message); }
    res.json({ success: true, message: 'Ticket status updated' });
  } catch (error) {
    console.error('[Admin Controller] Update ticket status error:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteTicketAdmin = async (req, res) => {
  try {
    await pool.query('DELETE FROM support_tickets WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    console.error('[Admin Controller] Delete ticket error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Admin Controller] Get announcements error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, target_audience, expires_at } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO announcements (title, content, priority, target_audience, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, content, priority || 'normal', target_audience || 'all', expires_at || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Create announcement error:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('[Admin Controller] Delete announcement error:', error);
    res.status(500).json({ error: error.message });
  }
};

const reconcilePaymentAdmin = async (req, res) => {
  try {
    const { tx_ref, force } = req.body;
    if (!tx_ref) return res.status(400).json({ error: 'tx_ref is required' });
    
    const result = await flutterwaveService.reconcilePayment(tx_ref, force === true || force === 'true');
    res.json(result);
  } catch (error) {
    console.error('[Admin Controller] Reconcile payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getServices = async (req, res) => {
  try {
    const { getAllServices } = require('../services/serviceService');
    const services = await getAllServices(false);
    res.json(services.map(service => ({ ...service, enabled: Boolean(service.is_active) })));
  } catch (error) {
    console.error('[Admin Controller] Get services error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const { name, slug, id, category, description = '', icon, is_active, enabled } = req.body || {};
    const normalizedSlug = String(slug || id || '').trim().toLowerCase();
    if (!name || !normalizedSlug || !category) return res.status(400).json({ error: 'Name, slug, and category are required' });
    const result = await pool.query(
      `INSERT INTO services (name, slug, icon, category, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name.trim(), normalizedSlug, icon || null, category, description, enabled !== undefined ? Boolean(enabled) : is_active !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Create service error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    const current = existing.rows[0];
    const { name, slug, id, category, description, icon, is_active, enabled } = req.body || {};
    const result = await pool.query(
      `UPDATE services SET name = $1, slug = $2, icon = $3, category = $4, description = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name ?? current.name, String(slug || id || current.slug).toLowerCase(), icon ?? current.icon, category ?? current.category, description ?? current.description, enabled !== undefined ? Boolean(enabled) : (is_active !== undefined ? Boolean(is_active) : current.is_active), req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Update service error:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('[Admin Controller] Delete service error:', error);
    res.status(500).json({ error: error.message });
  }
};

const listAdmins = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, username, created_at
       FROM users
       WHERE is_admin = true
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Admin Controller] List admins error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { registerUser } = require('../services/authService');
    const registration = await registerUser({
      email,
      password,
      full_name: full_name || '',
      username: email.split('@')[0]
    });
    const createdUser = registration.user;
    await pool.query(
      `UPDATE users SET is_admin = true, role = 'admin', email_verified = true WHERE id = $1`,
      [createdUser.id]
    );
    await pool.query('UPDATE email_verification_tokens SET verified_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND verified_at IS NULL', [createdUser.id]);
    res.json({ success: true, user: { ...createdUser, is_admin: true, role: 'admin', email_verified: true } });
  } catch (error) {
    console.error('[Admin Controller] Create admin error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, username, phone, is_admin, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Get admin profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { full_name, username, phone } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, username = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, full_name, username, phone`,
      [full_name, username, phone, req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Update admin profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    
    const { changePassword } = require('../services/authService');
    await changePassword(req.user.id, current_password, new_password);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[Admin Controller] Change admin password error:', error);
    res.status(500).json({ error: error.message });
  }
};

const generateVerificationLink = async (req, res) => {
  try {
    const { email, uid, redirectUrl } = req.body || {};
    if (!email && !uid) return res.status(400).json({ error: 'Email or uid is required' });
    const { resendVerificationEmail } = require('../services/authService');
    let targetEmail = email;
    if (!targetEmail && uid) {
      const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [uid]);
      targetEmail = userResult.rows[0]?.email;
    }
    const result = await resendVerificationEmail(targetEmail);
    res.json({ ...result, redirectUrl });
  } catch (error) {
    console.error('[Admin Controller] Generate verification link error:', error);
    res.status(500).json({ error: error.message });
  }
};

const fixGhostWallets = async (req, res) => {
  try {
    // Find wallets with user_id that looks like email instead of UUID
    const result = await pool.query(
      `SELECT w.id, w.user_id, u.email
       FROM wallets w
       LEFT JOIN users u ON w.user_id = u.id
       WHERE w.user_id LIKE '%@%'`
    );
    
    let fixed = 0;
    for (const wallet of result.rows) {
      if (wallet.email) {
        // Get the actual user UUID
        const userResult = await pool.query(
          'SELECT id FROM users WHERE email = $1 LIMIT 1',
          [wallet.email]
        );
        
        if (userResult.rows.length > 0) {
          // Update wallet with correct UUID
          await pool.query(
            'UPDATE wallets SET user_id = $1 WHERE id = $2',
            [userResult.rows[0].id, wallet.id]
          );
          fixed++;
        }
      }
    }
    
    res.json({ success: true, fixed, total: result.rows.length });
  } catch (error) {
    console.error('[Admin Controller] Fix ghost wallets error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAdminAudit = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, admin_email, action, target_type, target_id, details, created_at
       FROM admin_audit_log
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      action: row.action,
      actor: row.admin_email,
      detail: row.details?.description || row.details?.reference || JSON.stringify(row.details || {}),
      level: /delete|debit|suspend|failed|reject/i.test(row.action) ? 'warning' : 'success',
      createdAt: row.created_at
    })));
  } catch (error) {
    console.error('[Admin Controller] Get audit log error:', error);
    res.status(500).json({ error: error.message });
  }
};

const serializePlan = (plan) => ({
  ...plan,
  priceUser: Number(plan.price_user),
  priceApi: Number(plan.price_api),
  active: Boolean(plan.is_active),
  networkKey: plan.network_key,
  serviceId: plan.service_id
});

const getPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, s.name AS service_name, s.slug AS service_slug
       FROM service_plans sp JOIN services s ON s.id = sp.service_id
       ORDER BY sp.created_at DESC`
    );
    res.json(result.rows.map(serializePlan));
  } catch (error) {
    console.error('[Admin Controller] Get plans error:', error);
    res.status(500).json({ error: error.message });
  }
};

const resolveServiceId = async (body) => {
  if (body.service_id || body.serviceId) return body.service_id || body.serviceId;
  const type = String(body.type || body.metadata?.type || '').toLowerCase();
  const slug = type === 'exam' ? 'exam-pins' : type;
  if (!slug) return null;
  const result = await pool.query('SELECT id FROM services WHERE slug = $1 LIMIT 1', [slug]);
  return result.rows[0]?.id || null;
};

const createPlan = async (req, res) => {
  try {
    const body = req.body || {};
    const serviceId = await resolveServiceId(body);
    const metadata = body.metadata || {};
    const type = String(body.type || metadata.type || '').toLowerCase();
    const network = String(body.network || body.network_key || '').trim();
    const networkKey = String(body.network_key || body.networkKey || network).trim().toLowerCase();
    const name = String(body.name || '').trim();
    const priceUser = Number(body.price_user ?? body.priceUser);
    const priceApi = Number(body.price_api ?? body.priceApi);
    if (!serviceId || !type || !network || !networkKey || !name || !Number.isFinite(priceUser) || !Number.isFinite(priceApi)) {
      return res.status(400).json({ error: 'serviceId, type, network, name, priceUser, and priceApi are required' });
    }
    const result = await pool.query(
      `INSERT INTO service_plans (service_id, network, network_key, name, type, sub_type, price_user, price_api, is_active, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [serviceId, network, networkKey, name, type, body.sub_type || body.subType || null, priceUser, priceApi, body.is_active ?? body.active !== false, JSON.stringify(metadata)]
    );
    res.status(201).json(serializePlan(result.rows[0]));
  } catch (error) {
    console.error('[Admin Controller] Create plan error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const currentResult = await pool.query('SELECT * FROM service_plans WHERE id = $1', [req.params.id]);
    if (currentResult.rows.length === 0) return res.status(404).json({ error: 'Service plan not found' });
    const current = currentResult.rows[0];
    const body = req.body || {};
    const metadata = body.metadata ?? current.metadata ?? {};
    const result = await pool.query(
      `UPDATE service_plans SET network = $1, network_key = $2, name = $3, type = $4, sub_type = $5,
       price_user = $6, price_api = $7, is_active = $8, metadata = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [body.network ?? current.network, String(body.network_key ?? body.networkKey ?? current.network_key).toLowerCase(), body.name ?? current.name, body.type ?? current.type, body.sub_type ?? body.subType ?? current.sub_type, Number(body.price_user ?? body.priceUser ?? current.price_user), Number(body.price_api ?? body.priceApi ?? current.price_api), body.is_active ?? body.active ?? current.is_active, JSON.stringify(metadata), req.params.id]
    );
    res.json(serializePlan(result.rows[0]));
  } catch (error) {
    console.error('[Admin Controller] Update plan error:', error);
    res.status(500).json({ error: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM service_plans WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service plan not found' });
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('[Admin Controller] Delete plan error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStats,
  getFinanceAnalytics,
  getFinanceSystem,
  getFinanceUser,
  updateSettings,
  getSettings,
  getAllTransactions,
  creditWallet,
  debitWallet,
  reverifyPayment,
  listUsers,
  createUser,
  promoteToAdmin,
  suspendUser,
  getTickets,
  createTicket,
  getTicketMessages,
  replyTicket,
  updateTicketStatus,
  deleteTicketAdmin,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  reconcilePaymentAdmin,
  getServices,
  createService,
  updateService,
  deleteService,
  listAdmins,
  createAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  generateVerificationLink,
  fixGhostWallets,
  getWalletLogs,
  getWalletDeposits,
  getAdminAudit,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
};
