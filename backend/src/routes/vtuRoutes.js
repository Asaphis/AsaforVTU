const express = require('express');
const { authenticate } = require('../middleware/auth');
const providerService = require('../services/providerService');
const transactionService = require('../services/transactionService');
const notificationService = require('../services/notificationService');
const walletService = require('../services/walletService');
const pool = require('../config/database');
const { getServicePlans, getServiceBySlug } = require('../services/serviceService');
const { verifyPin } = require('../services/authService');

const router = express.Router();
const NETWORK_ID_MAP = { mtn: 1, glo: 2, '9mobile': 3, airtel: 4 };
const slugByType = { airtime: 'airtime', data: 'data', cable: 'cable', electricity: 'electricity', exam: 'exam-pins', 'exam-pins': 'exam-pins' };

const notify = async (userId, type, title, message, metadata = {}) => {
  try { await notificationService.sendNotification(userId, title, message, type, metadata); } catch (error) {
    console.error('[VTU] Notification failed:', error.message);
  }
};

router.get('/providers', async (_req, res) => {
  try { res.json(await providerService.getProviders()); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/data/plans', async (req, res) => {
  try {
    const network = req.query.network;
    const networkId = NETWORK_ID_MAP[String(network || '').toLowerCase()] || network;
    const result = req.query.type === 'budget' || !network
      ? await providerService.getBudgetDataPlans(networkId)
      : await providerService.getVariations('data', network);
    res.json(result);
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/cable/plans', async (req, res) => {
  try { res.json(await providerService.getVariations('cable', req.query.service || 'dstv')); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/electricity/plans', async (req, res) => {
  try { res.json(await providerService.getVariations('electricity', req.query.service || 'ikeja-electric')); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/verify', async (req, res) => {
  try {
    const { customerId, serviceId, variationId } = req.body || {};
    if (!customerId || !serviceId) return res.status(400).json({ success: false, message: 'customerId and serviceId are required' });
    res.json(await providerService.verifyCustomer(customerId, serviceId, variationId));
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/purchase', authenticate, async (req, res) => {
  const { type, amount, details = {} } = req.body || {};
  const normalizedType = String(type || '').toLowerCase();
  const requestId = String(details.requestId || '').trim() || `REQ_${req.user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const numericAmount = Number(amount);

  try {
    if (!['airtime', 'data', 'cable', 'electricity', 'exam', 'exam-pins'].includes(normalizedType)) {
      return res.status(400).json({ success: false, message: 'Unsupported transaction type' });
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid amount is required' });
    }
    if (!details.transactionPin) {
      return res.status(400).json({ success: false, message: 'Transaction PIN is required' });
    }
    if (!await verifyPin(req.user.id, details.transactionPin)) {
      return res.status(401).json({ success: false, message: 'Invalid transaction PIN' });
    }
    if (normalizedType === 'airtime' && (!details.phone || !details.network)) {
      return res.status(400).json({ success: false, message: 'phone and network are required for airtime' });
    }
    if (normalizedType === 'data' && (!details.phone || !details.network || !details.planId)) {
      return res.status(400).json({ success: false, message: 'phone, network, and planId are required for data' });
    }
    if (normalizedType === 'cable' && (!details.customerId || !details.serviceId || !details.planId)) {
      return res.status(400).json({ success: false, message: 'customerId, serviceId, and planId are required for cable' });
    }
    if (normalizedType === 'electricity' && (!details.customerId || !details.serviceId || !details.variationId)) {
      return res.status(400).json({ success: false, message: 'customerId, serviceId, and variationId are required for electricity' });
    }
    if (['exam', 'exam-pins'].includes(normalizedType) && (!details.examType || !details.quantity)) {
      return res.status(400).json({ success: false, message: 'examType and quantity are required for exam PINs' });
    }

    const duplicate = await pool.query(
      `SELECT * FROM transactions WHERE user_id = $1 AND metadata->>'requestId' = $2 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id, requestId]
    );
    if (duplicate.rows[0]) {
      const existing = duplicate.rows[0];
      return res.status(existing.status === 'success' ? 200 : 202).json({
        success: existing.status === 'success', status: existing.status, transactionId: existing.id,
        message: 'Request already processed', data: existing
      });
    }

    const service = await getServiceBySlug(slugByType[normalizedType]);
    if (!service || !service.is_active) return res.status(400).json({ success: false, message: 'Service is unavailable' });

    let plan = null;
    if (details.planId) {
      const plans = await getServicePlans({ service_id: service.id, active_only: true });
      plan = plans.find(item => String(item.id) === String(details.planId) || String(item.metadata?.variation_id || '') === String(details.planId));
    }
    const userPrice = plan ? Number(plan.price_user) : numericAmount;
    const providerCost = plan ? Number(plan.price_api) : numericAmount;
    const providerPlanId = details.providerPlanId || details.variationId || details.planId;
    const reference = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    await walletService.debitWallet(req.user.id, userPrice, 'main', `Payment for ${normalizedType} transaction`, reference, { requestId, type: normalizedType });
    let transaction;
    try {
      transaction = await transactionService.createTransaction({
        user_id: req.user.id, service_id: service.id, plan_id: plan?.id || null,
        type: normalizedType, amount: userPrice, phone: details.phone,
        meter_number: details.meterNumber, smartcard_number: details.smartcardNumber,
        customer_name: details.customerName, customer_address: details.customerAddress,
        metadata: { ...details, transactionPin: undefined, requestId, provider_cost: providerCost, reference }
      });
      await transactionService.updateTransactionStatus(transaction.id, 'processing');
    } catch (error) {
      await walletService.creditWallet(req.user.id, userPrice, 'main', `Refund for failed ${normalizedType} transaction`, `REFUND_${reference}`, { requestId, reason: error.message });
      throw error;
    }

    let providerResult;
    if (normalizedType === 'airtime') {
      providerResult = await providerService.purchaseAirtime(requestId, details.phone, providerCost, details.network);
    } else if (normalizedType === 'data') {
      providerResult = await providerService.purchaseData(requestId, details.phone, providerPlanId, details.network);
    } else if (normalizedType === 'cable') {
      providerResult = await providerService.purchaseCableTV(requestId, details.customerId, details.serviceId, providerPlanId, providerCost);
    } else if (normalizedType === 'electricity') {
      providerResult = await providerService.purchaseElectricity(requestId, details.customerId, details.serviceId, details.variationId, numericAmount);
    } else {
      providerResult = await providerService.purchaseExamPins(requestId, details.examType, details.quantity, providerCost);
    }

    if (providerResult.success) {
      const completed = await transactionService.completeTransaction(transaction.id, providerResult.transactionId, {
        provider_response: providerResult.apiResponse,
        provider_status: providerResult.status || 'success',
        provider_cost: providerCost
      });
      await notify(req.user.id, 'transaction', 'Transaction successful', `${normalizedType} purchase completed successfully.`, { transactionId: transaction.id });
      return res.json({ success: true, status: 'success', transactionId: transaction.id, message: providerResult.message || 'Transaction successful', data: providerResult, transaction: completed });
    }

    await transactionService.failTransaction(transaction.id, providerResult.message || 'Provider transaction failed', false);
    await walletService.creditWallet(req.user.id, userPrice, 'main', `Refund for failed ${normalizedType} transaction`, `REFUND_${reference}`, { requestId, reason: providerResult.message });
    await notify(req.user.id, 'transaction', 'Transaction failed', `${normalizedType} purchase failed. Your wallet was refunded.`, { transactionId: transaction.id });
    return res.status(400).json({ success: false, status: 'failed', transactionId: transaction.id, message: providerResult.message || 'Transaction failed. Wallet refunded.', data: providerResult });
  } catch (error) {
    console.error('[VTU] Purchase error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/transactions', authenticate, async (req, res) => {
  try { res.json({ success: true, data: await transactionService.getTransactionsByUserId(req.user.id) }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/requery', authenticate, async (req, res) => {
  try {
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ success: false, message: 'requestId is required' });
    const result = await pool.query(
      `SELECT * FROM transactions WHERE user_id = $1 AND (reference = $2 OR metadata->>'requestId' = $2) LIMIT 1`,
      [req.user.id, requestId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, status: result.rows[0].status, transaction: result.rows[0] });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
