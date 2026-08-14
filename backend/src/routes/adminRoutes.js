const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const pool = require('../config/database');
const walletService = require('../services/walletService');
const transactionService = require('../services/transactionService');
const paymentService = require('../services/paymentService');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Stats
router.get('/stats', adminController.getStats);

// Settings
router.post('/settings', adminController.updateSettings);
router.get('/settings', adminController.getSettings);

// Transactions
router.get('/transactions', adminController.getAllTransactions);

// Wallet Operations
router.post('/wallet/credit', adminController.creditWallet);
router.post('/wallet/debit', adminController.debitWallet);
router.post('/wallet/reverify', adminController.reverifyPayment);
router.post('/wallet/fix-ghosts', adminController.fixGhostWallets);

// User Management
router.get('/users', adminController.listUsers);
router.post('/users/create', adminController.createUser);
router.post('/users/promote', adminController.promoteToAdmin);
router.post('/users/suspend', adminController.suspendUser);

// Admin Management
router.get('/admins', adminController.listAdmins);
router.post('/admins', adminController.createAdmin);

// Profile
router.get('/profile', adminController.getAdminProfile);
router.post('/profile/update', adminController.updateAdminProfile);
router.post('/profile/password', adminController.changeAdminPassword);

// Support & Announcements
router.get('/support/tickets', adminController.getTickets);
router.get('/support/tickets/:id/messages', adminController.getTicketMessages);
router.post('/support/tickets/create', adminController.createTicket);
router.post('/support/tickets/:id/reply', adminController.replyTicket);
router.post('/support/tickets/:id/status', adminController.updateTicketStatus);
router.post('/support/tickets/:id/delete', adminController.deleteTicketAdmin);
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// Payments
router.post('/payments/reconcile', adminController.reconcilePaymentAdmin);

// Service Categories
router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Verification
router.post('/users/verification-link', adminController.generateVerificationLink);

// Financial Intelligence / Statistics
router.get('/stats', async (req, res) => {
  try {
    const result = {
      totalUsers: 0,
      walletBalance: 0,
      totalTransactions: 0,
      todaySales: 0,
      profit: 0,
      spending: 0,
      dailyTotals: [],
      recentTransactions: [],
      error: null
    };
    
    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    result.totalUsers = Number(usersResult.rows[0].count);
    
    // Get wallet balance
    const walletResult = await pool.query('SELECT SUM(main_balance) as total FROM wallets');
    result.walletBalance = Number(walletResult.rows[0].total || 0);
    
    // Get transactions
    const transactionsResult = await pool.query(
      `SELECT COUNT(*) as count, SUM(amount) as total 
       FROM transactions 
       WHERE status = 'success'`
    );
    result.totalTransactions = Number(transactionsResult.rows[0].count);
    result.todaySales = Number(transactionsResult.rows[0].total || 0);
    
    // Calculate profit (revenue - cost)
    const profitResult = await pool.query(
      `SELECT 
         SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as revenue,
         SUM(CASE WHEN status = 'success' THEN COALESCE(metadata->>'provider_cost', amount) ELSE 0 END) as cost
       FROM transactions`
    );
    const revenue = Number(profitResult.rows[0].revenue || 0);
    const cost = Number(profitResult.rows[0].cost || 0);
    result.profit = revenue - cost;
    result.spending = cost;
    
    // Daily totals for last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const key = d.toLocaleDateString(undefined, { weekday: 'short' });
      
      const dayResult = await pool.query(
        `SELECT COUNT(*) as count, SUM(amount) as total 
         FROM transactions 
         WHERE DATE(created_at) = $1 AND status = 'success'`,
        [dayStr]
      );
      
      days.push({ 
        day: key, 
        total: Number(dayResult.rows[0].total || 0),
        count: Number(dayResult.rows[0].count || 0)
      });
    }
    result.dailyTotals = days;
    
    // Recent transactions
    const recentResult = await pool.query(
      `SELECT t.*, u.email, u.full_name
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC
       LIMIT 10`
    );
    result.recentTransactions = recentResult.rows;
    
    res.json(result);
  } catch (error) {
    console.error('[Admin Routes] Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Wallet logs
router.get('/wallet/logs', async (req, res) => {
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
    console.error('[Admin Routes] Wallet logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Wallet deposits
router.get('/wallet/deposits', async (req, res) => {
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
    console.error('[Admin Routes] Wallet deposits error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
