const pool = require('../config/database');
const walletService = require('../services/walletService');
const flutterwaveService = require('../services/flutterwaveService');
const transactionService = require('../services/transactionService');
const paymentService = require('../services/paymentService');

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
      AND status = 'completed'
    `);
    const todaySales = parseFloat(todaySalesResult.rows[0].total);

    // Get daily totals for the last 7 days
    const dailyTotalsResult = await pool.query(`
      SELECT 
        DATE(created_at) as day,
        COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND status = 'completed'
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
    const body = req.body || {};
    
    // Process each setting key
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
    const newBalance = await walletService.creditWallet(targetUserId, amt, wtype, description || 'Admin Credit');
    
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
      SELECT id, email, full_name, username, phone, 
             is_active, is_admin, role, email_verified,
             created_at, last_login_at
      FROM users
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` WHERE (email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
    const { email, password, full_name, username, phone, is_admin } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { registerUser } = require('../services/authService');
    const user = await registerUser({
      email,
      password,
      full_name: full_name || '',
      username: username || email.split('@')[0],
      phone: phone || ''
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
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    await pool.query(
      'UPDATE users SET is_admin = true, role = $1 WHERE id = $2',
      ['admin', userId]
    );
    
    res.json({ success: true, message: 'User promoted to admin' });
  } catch (error) {
    console.error('[Admin Controller] Promote to admin error:', error);
    res.status(500).json({ error: error.message });
  }
};

const suspendUser = async (req, res) => {
  try {
    const { userId, suspend } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2',
      [!suspend, userId]
    );
    
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
    
    const result = await pool.query(
      `INSERT INTO support_messages (ticket_id, user_id, is_admin, message)
       VALUES ($1, $2, true, $3)
       RETURNING *`,
      [req.params.id, req.user.id, message]
    );
    
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
    
    await pool.query(
      'UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, req.params.id]
    );
    
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
    const { getServicePlans } = require('../services/serviceService');
    const services = await getServicePlans();
    res.json(services);
  } catch (error) {
    console.error('[Admin Controller] Get services error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const { name, slug, category, description, icon, is_active } = req.body;
    
    if (!name || !slug || !category) {
      return res.status(400).json({ error: 'Name, slug, and category are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO services (name, slug, icon, category, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, slug, icon, category, description, is_active !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Create service error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { name, slug, category, description, icon, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE services 
       SET name = $1, slug = $2, icon = $3, category = $4, description = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, slug, icon, category, description, is_active !== false, req.params.id]
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
    const user = await registerUser({
      email,
      password,
      full_name: full_name || '',
      username: email.split('@')[0]
    });
    
    await pool.query(
      'UPDATE users SET is_admin = true, role = $1, email_verified = true WHERE id = $2',
      ['admin', user.id]
    );
    
    res.json({ success: true, user });
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
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const { requestPasswordReset } = require('../services/authService');
    const result = await requestPasswordReset(email);
    
    res.json(result);
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

const getPlans = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_plans ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('[Admin Controller] Get plans error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createPlan = async (req, res) => {
  try {
    const { network, name, price_user, price_api, active, metadata } = req.body;
    const result = await pool.query(
      `INSERT INTO service_plans (network, name, price_user, price_api, active, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [network, name, price_user, price_api, active, JSON.stringify(metadata)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Create plan error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { network, name, price_user, price_api, active, metadata } = req.body;
    const result = await pool.query(
      `UPDATE service_plans 
       SET network = $1, name = $2, price_user = $3, price_api = $4, active = $5, metadata = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [network, name, price_user, price_api, active, JSON.stringify(metadata), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admin Controller] Update plan error:', error);
    res.status(500).json({ error: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    await pool.query('DELETE FROM service_plans WHERE id = $1', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('[Admin Controller] Delete plan error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStats,
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
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
};
