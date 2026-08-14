const express = require('express');
const flutterwaveService = require('../services/flutterwaveService');
const paymentService = require('../services/paymentService');
const pool = require('../config/database');

const router = express.Router();

router.post('/flutterwave', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    const secret = process.env.FLW_SECRET_HASH || '';
    if (process.env.NODE_ENV === 'production' && !secret) {
      return res.status(503).json({ error: 'Webhook verification is not configured' });
    }
    if (secret && signature !== secret) return res.status(403).json({ error: 'Invalid signature' });

    const event = req.body || {};
    const eventStatus = String(event?.data?.status || event?.event || '').toLowerCase();
    if (eventStatus && !['successful', 'success', 'charge.completed'].some(value => eventStatus.includes(value))) {
      return res.json({ success: true, ignored: true });
    }

    const txRef = String(event?.data?.tx_ref || '').trim();
    const amount = Number(event?.data?.amount);
    const userId = event?.data?.meta?.userId || event?.data?.meta?.user_id;
    if (!txRef || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Missing or invalid payment reference/amount' });

    let payment = await paymentService.getPaymentByTxRef(txRef);
    if (!payment) {
      if (!userId) return res.status(400).json({ error: 'Payment record and userId are missing' });
      payment = await paymentService.createPayment({
        user_id: userId,
        amount,
        payment_method: 'flutterwave',
        provider: 'flutterwave',
        tx_ref: txRef,
        metadata: { flutterwave_event: event }
      });
    }
    if (payment.status === 'success') return res.json({ success: true, alreadyProcessed: true });

    await paymentService.updatePaymentStatus(payment.id, 'pending', {
      provider_reference: txRef,
      flw_ref: event?.data?.flw_ref,
      metadata: { flutterwave_event: event }
    });
    const result = await flutterwaveService.creditIfValid(txRef, Number(payment.amount), payment.user_id);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('[Webhook] Flutterwave webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
