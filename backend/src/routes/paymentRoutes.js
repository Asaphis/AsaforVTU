const express = require('express');
const { authenticate } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

const router = express.Router();

router.use(authenticate);

router.post('/initiate', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum is ₦100.' });
    }

    const payment = await paymentService.createPayment({
      user_id: req.user.id,
      amount: Number(amount),
      payment_method: 'flutterwave',
      provider: 'flutterwave',
      metadata: {
        email: req.user.email,
        name: req.user.full_name,
        phone: req.user.phone
      }
    });

    // Generate Flutterwave payment link
    const flutterwaveService = require('../services/flutterwaveService');
    const redirectUrl = process.env.FLW_REDIRECT_URL || 'https://vtu.ferixas.com/payment-complete';
    
    const flutterwaveResult = await flutterwaveService.initiatePayment(
      req.user.id,
      Number(amount),
      {
        email: req.user.email,
        name: req.user.full_name,
        phone: req.user.phone
      },
      redirectUrl
    );

    // Update payment with Flutterwave reference
    await paymentService.updatePaymentStatus(payment.id, 'pending', {
      provider_reference: flutterwaveResult.tx_ref,
      flw_ref: flutterwaveResult.flw_ref
    });

    res.json({ 
      tx_ref: payment.tx_ref, 
      link: flutterwaveResult.link,
      payment_id: payment.id 
    });
  } catch (error) {
    console.error('[Payment Routes] Initiate error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { tx_ref } = req.body;
    if (!tx_ref) {
      return res.status(400).json({ error: 'tx_ref is required' });
    }

    const payment = await paymentService.getPaymentByTxRef(tx_ref);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status === 'success') {
      return res.json({ success: true, message: 'Payment already processed' });
    }

    // Verify with Flutterwave
    const flutterwaveService = require('../services/flutterwaveService');
    const verifyResult = await flutterwaveService.verifyPayment(tx_ref);

    if (verifyResult.status === 'successful') {
      await paymentService.processSuccessfulPayment(payment.id, {
        flw_ref: verifyResult.flw_ref
      });
      res.json({ success: true, message: 'Payment verified and processed' });
    } else {
      await paymentService.processFailedPayment(payment.id, 'Payment verification failed');
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('[Payment Routes] Verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
