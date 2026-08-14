const express = require('express');
const { authenticate } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const flutterwaveService = require('../services/flutterwaveService');

const router = express.Router();
router.use(authenticate);

router.post('/initiate', async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount < 100) return res.status(400).json({ error: 'Invalid amount. Minimum is ₦100.' });

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
