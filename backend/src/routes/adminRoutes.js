const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const pool = require('../config/database');
const walletService = require('../services/walletService');
const transactionService = require('../services/transactionService');
const paymentService = require('../services/paymentService');
const providerService = require('../services/providerService');
const communicationController = require('../controllers/communicationController');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Provider information
router.get('/providers', async (_req, res) => {
  try { res.json(await providerService.getProviders()); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

// Stats
router.get('/stats', adminController.getStats);
router.get('/finance/analytics', adminController.getFinanceAnalytics);
router.get('/finance/system', adminController.getFinanceSystem);
router.get('/finance/user', adminController.getFinanceUser);

// Settings
router.post('/settings', adminController.updateSettings);
router.get('/settings', adminController.getSettings);

// Transactions
router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

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
router.get('/users/transactions', async (req, res) => {
  try {
    const target = req.query.uid || req.query.email;
    const userResult = await pool.query('SELECT id FROM users WHERE id::text = $1 OR lower(email) = lower($1) LIMIT 1', [String(target || '')]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(await transactionService.getTransactionsByUserId(userResult.rows[0].id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Admin Management
router.get('/admins', adminController.listAdmins);
router.post('/admins', adminController.createAdmin);

// Profile
router.get('/profile', adminController.getAdminProfile);
router.post('/profile/update', adminController.updateAdminProfile);
router.post('/profile/password', adminController.changeAdminPassword);

// Support & Announcements
router.get('/communications/status', communicationController.getStatus);
router.get('/communications/deliveries', communicationController.listDeliveries);
router.post('/communications/send', communicationController.sendCampaign);
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

// Wallet logs
router.get('/wallet/logs', adminController.getWalletLogs);

// Wallet deposits
router.get('/wallet/deposits', adminController.getWalletDeposits);

// Audit trail
router.get('/audit', adminController.getAdminAudit);

// Plans management
router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

module.exports = router;
