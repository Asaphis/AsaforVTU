const express = require('express');
const { authenticate } = require('../middleware/auth');
const transactionService = require('../services/transactionService');

const router = express.Router();

router.use(authenticate);

router.post('/purchase', async (req, res) => {
  try {
    const { type, amount, details } = req.body;
    
    if (!type || !details) {
      return res.status(400).json({ error: 'type and details are required' });
    }

    // Validate based on type
    if (type === 'airtime' && (!details.phone || !details.network)) {
      return res.status(400).json({ error: 'phone and network are required for airtime' });
    }
    
    if (type === 'data' && (!details.phone || !details.planId || !details.network)) {
      return res.status(400).json({ error: 'phone, network, and planId are required for data' });
    }
    
    if (type === 'cable' && (!details.customerId || !details.serviceId || !details.planId)) {
      return res.status(400).json({ error: 'customerId, serviceId, and planId are required for cable' });
    }
    
    if (type === 'electricity' && (!details.customerId || !details.serviceId || !details.variationId || !amount)) {
      return res.status(400).json({ error: 'customerId, serviceId, variationId, and amount are required for electricity' });
    }

    const result = await transactionService.createTransaction({
      user_id: req.user.id,
      type,
      amount: Number(amount),
      phone: details.phone,
      meter_number: details.meterNumber,
      smartcard_number: details.smartcardNumber,
      customer_name: details.customerName,
      customer_address: details.customerAddress,
      metadata: details
    });
    
    res.json({ success: true, transaction: result });
  } catch (error) {
    console.error('[Transaction Routes] Purchase error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const transactions = await transactionService.getTransactionsByUserId(req.user.id);
    res.json(transactions);
  } catch (error) {
    console.error('[Transaction Routes] Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('[Transaction Routes] Get transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
