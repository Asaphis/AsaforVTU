const express = require('express');
const { authenticate } = require('../middleware/auth');
const walletService = require('../services/walletService');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.id);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    res.json({
      main_balance: wallet.main_balance,
      cashback_balance: wallet.cashback_balance,
      referral_balance: wallet.referral_balance,
      total_earned: wallet.total_earned,
      total_spent: wallet.total_spent
    });
  } catch (error) {
    console.error('[Wallet Routes] Get balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await walletService.getWalletTransactions(req.user.id);
    res.json(history);
  } catch (error) {
    console.error('[Wallet Routes] Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const { amount, fromWalletType } = req.body || {};
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!['cashback', 'referral'].includes(fromWalletType)) {
      return res.status(400).json({ error: 'Invalid source wallet type' });
    }
    const result = await walletService.transferWalletBalance(req.user.id, fromWalletType, 'main', amount, 'Transfer to main wallet');
    res.json({ success: true, result });
  } catch (error) {
    console.error('[Wallet Routes] Transfer error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

