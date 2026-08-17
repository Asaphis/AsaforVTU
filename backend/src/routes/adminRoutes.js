const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { randomUUID, createHash } = require('crypto');
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const pool = require('../config/database');
const walletService = require('../services/walletService');
const transactionService = require('../services/transactionService');
const paymentService = require('../services/paymentService');
const providerService = require('../services/providerService');
const communicationController = require('../controllers/communicationController');

const router = express.Router();
const notificationUploadDirectory = path.resolve(process.env.NOTIFICATION_UPLOAD_DIR || path.join(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), 'notifications'));
fs.mkdirSync(notificationUploadDirectory, { recursive: true });
const notificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_NOTIFICATION_IMAGE_MB || 5) * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, new Set(['image/jpeg', 'image/png', 'image/webp']).has(file.mimetype)),
});

function cloudinaryConfig() {
  const configuredUrl = process.env.CLOUDINARY_URL;
  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl);
      if (parsed.protocol === 'cloudinary:') return { cloudName: parsed.hostname, apiKey: decodeURIComponent(parsed.username), apiSecret: decodeURIComponent(parsed.password) };
    } catch (_error) { /* Fall through to explicit variables and return unavailable. */ }
  }
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return { cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY, apiSecret: process.env.CLOUDINARY_API_SECRET };
  }
  return null;
}

async function uploadNotificationBanner(file) {
  const config = cloudinaryConfig();
  if (!config) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_NOTIFICATION_FOLDER || 'asaforvtu/notifications';
  const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`).digest('hex');
  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, { method: 'POST', body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.secure_url) throw new Error(payload.error?.message || 'Cloudinary rejected the banner upload.');
  return payload.secure_url;
}
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
router.get('/communications/recipients', communicationController.listRecipients);
router.post('/communications/upload', notificationUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A JPG, PNG, or WebP banner image is required.' });
  try {
    const cloudUrl = await uploadNotificationBanner(req.file);
    if (cloudUrl) return res.status(201).json({ url: cloudUrl, storage: 'cloudinary' });
    const filename = `${randomUUID()}${path.extname(req.file.originalname).toLowerCase()}`;
    fs.writeFileSync(path.join(notificationUploadDirectory, filename), req.file.buffer);
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const baseUrl = process.env.PUBLIC_API_URL || process.env.API_URL || `${protocol}://${req.get('host')}`;
    res.status(201).json({ url: `${baseUrl.replace(/\/$/, '')}/uploads/notifications/${filename}`, storage: 'local-fallback' });
  } catch (error) {
    console.error('[Notifications] Banner upload failed:', error.message);
    res.status(502).json({ error: error.message || 'Banner upload failed.' });
  }
});
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
