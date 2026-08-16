const express = require('express');
const { authenticate } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const flutterwaveService = require('../services/flutterwaveService');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticate);

const defaultFundingSettings = {
  automated_enabled: true,
  manual_bank_name: '',
  manual_account_name: '',
  manual_account_number: '',
  manual_whatsapp_number: '',
  manual_accounts: [],
  manual_instructions: 'Transfer the amount to the account shown and contact Support with your proof of payment.'
};
const getFundingSettings = async () => {
  const result = await pool.query("SELECT value FROM settings WHERE key = 'wallet_funding_settings'");
  return { ...defaultFundingSettings, ...(result.rows[0]?.value || {}) };
};
const manualAccounts = settings => {
  const configured = Array.isArray(settings.manual_accounts) ? settings.manual_accounts.filter(account => account && account.enabled !== false && account.bank_name && account.account_name && account.account_number) : [];
  if (configured.length) return configured;
  if (settings.manual_bank_name && settings.manual_account_name && settings.manual_account_number) return [{ id: 'legacy-primary', bank_name: settings.manual_bank_name, account_name: settings.manual_account_name, account_number: settings.manual_account_number, enabled: true }];
  return [];
};
const manualPayload = settings => ({ bank_name: settings.manual_bank_name, account_name: settings.manual_account_name, account_number: settings.manual_account_number, whatsapp_number: settings.manual_whatsapp_number, instructions: settings.manual_instructions, accounts: manualAccounts(settings) });

router.get('/funding-options', async (req, res) => {
  try {
    const settings = await getFundingSettings();
    res.json({ automated_enabled: settings.automated_enabled !== false, manual: manualPayload(settings) });
  } catch (error) {
    console.error('[Payment Routes] Funding options error:', error);
    res.status(500).json({ error: 'Unable to load wallet funding options.' });
  }
});

router.post('/initiate', async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount < 100) return res.status(400).json({ error: 'Invalid amount. Minimum is ₦100.' });
    const fundingSettings = await getFundingSettings();
    if (fundingSettings.automated_enabled === false) {
      return res.status(409).json({ code: 'AUTOMATED_FUNDING_DISABLED', error: 'Automated wallet funding is temporarily unavailable. Use the manual bank-transfer instructions instead.', funding_mode: 'manual', manual: manualPayload(fundingSettings) });
    }

    const txRef = flutterwaveService.generateReference();
    const payment = await paymentService.createPayment({
      user_id: req.user.id,
      amount,
      payment_method: 'flutterwave',
      provider: 'flutterwave',
      tx_ref: txRef,
      metadata: { email: req.user.email, name: req.user.full_name, phone: req.user.phone }
    });

    try {
      const redirectUrl = process.env.FLW_REDIRECT_URL || `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-complete`;
      const result = await flutterwaveService.initiatePayment(req.user.id, amount, {
        email: req.user.email, name: req.user.full_name, phone: req.user.phone
      }, redirectUrl, payment.tx_ref);
      await paymentService.updatePaymentStatus(payment.id, 'pending', {
        provider_reference: result.tx_ref,
        flw_ref: result.flw_ref,
        metadata: { checkout_link: result.link, flutterwave_data: result.data }
      });
      return res.json({ tx_ref: payment.tx_ref, link: result.link, payment_id: payment.id });
    } catch (providerError) {
      await paymentService.updatePaymentStatus(payment.id, 'failed', { metadata: { failure_reason: providerError.message } });
      throw providerError;
    }
  } catch (error) {
    console.error('[Payment Routes] Initiate error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cancel', async (req, res) => {
  try {
    const requestedRef = String(req.body?.tx_ref || '').trim();
    if (!requestedRef) return res.status(400).json({ error: 'tx_ref is required' });
    const payment = await paymentService.getPaymentByTxRef(requestedRef, req.user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'success') return res.status(409).json({ success: false, message: 'This payment was already verified successfully.' });
    if (['failed', 'cancelled', 'reversed'].includes(payment.status)) return res.json({ success: true, message: `Payment already marked ${payment.status}.` });
    await paymentService.updatePaymentStatus(payment.id, 'cancelled', { metadata: { cancellation_source: 'provider_redirect' } });
    const notificationService = require('../services/notificationService');
    await notificationService.sendNotification(req.user.id, 'Payment cancelled', 'Your wallet funding payment was cancelled. No wallet credit was applied.', 'wallet', { tx_ref: payment.tx_ref });
    return res.json({ success: true, message: 'Payment cancelled. No wallet credit was applied.' });
  } catch (error) {
    console.error('[Payment Routes] Cancel error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const requestedRef = String(req.body?.tx_ref || '').trim();
    if (!requestedRef) return res.status(400).json({ error: 'tx_ref is required' });
    const payment = await paymentService.getPaymentByTxRef(requestedRef, req.user.id);
    if (!payment || payment.user_id !== req.user.id) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'success') return res.json({ success: true, message: 'Payment already processed' });

    const verifyResult = await flutterwaveService.creditIfValid(payment.tx_ref, Number(payment.amount), req.user.id);
    if (!verifyResult.success) return res.status(400).json({ success: false, message: verifyResult.error || 'Payment verification failed' });
    res.json({ success: true, message: 'Payment verified and processed' });
  } catch (error) {
    console.error('[Payment Routes] Verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
