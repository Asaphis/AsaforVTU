const express = require('express');
const flutterwaveService = require('../services/flutterwaveService');
const paymentService = require('../services/paymentService');
const pool = require('../config/database');

const router = express.Router();

router.post('/flutterwave', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    const secret = process.env.FLW_SECRET_HASH || '';
    if (secret && signature !== secret) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const id = event?.data?.id;
    const tx_ref = event?.data?.tx_ref;
    const amount = event?.data?.amount;
    const meta = event?.data?.meta || {};
    let userId = meta.userId;

    if (!amount) {
      return res.status(400).json({ error: 'Missing amount' });
    }

    // If userId is missing from webhook metadata, try to find it in our records using tx_ref
    if (!userId && tx_ref) {
      try {
        const paymentResult = await pool.query(
          'SELECT user_id FROM payments WHERE tx_ref = $1 LIMIT 1',
          [tx_ref]
        );
        if (paymentResult.rows.length > 0) {
          userId = paymentResult.rows[0].user_id;
        }
      } catch (err) {
        console.error('Error fetching payment for webhook recovery:', err);
      }
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Check if payment already exists
    const existingPayment = await pool.query(
      'SELECT * FROM payments WHERE tx_ref = $1 LIMIT 1',
      [tx_ref]
    );

    if (existingPayment.rows.length > 0) {
      const payment = existingPayment.rows[0];
      
      // Only process if payment is still pending
      if (payment.status === 'pending') {
        const result = await flutterwaveService.creditIfValid(id || tx_ref, amount, userId);
        return res.json(result);
      }
      
      return res.json({ success: true, message: 'Payment already processed', status: payment.status });
    }

    // Create new payment record
    const newPayment = await paymentService.createPayment({
      user_id: userId,
      amount: Number(amount),
      payment_method: 'flutterwave',
      provider: 'flutterwave',
      metadata: {
        flutterwave_event: event
      }
    });

    // Update with Flutterwave reference
    await paymentService.updatePaymentStatus(newPayment.id, 'pending', {
      provider_reference: tx_ref,
      flw_ref: event?.data?.flw_ref
    });

    // Process payment
    if (!process.env.FLW_SECRET_KEY) {
      // Development mode - auto-credit
      await paymentService.processSuccessfulPayment(newPayment.id, {
        flw_ref: event?.data?.flw_ref
      });
      return res.json({ success: true, data: event?.data || {} });
    } else {
      // Production mode - verify with Flutterwave
      const result = await flutterwaveService.creditIfValid(id || tx_ref, amount, userId);
      return res.json(result);
    }
  } catch (e) {
    console.error('[Webhook] Flutterwave webhook error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
