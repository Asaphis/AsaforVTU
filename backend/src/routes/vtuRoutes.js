const express = require('express');
const { verifyToken } = require('../middleware/auth');
const providerService = require('../services/providerService');
const transactionService = require('../services/transactionService');
const { db } = require('../config/firebase');

const router = express.Router();

// Network mapping for IA Café
const NETWORK_ID_MAP = {
  mtn: 1,
  glo: 2,
  '9mobile': 3,
  airtel: 4,
  smile: 5
};

const SERVICE_ID_MAP = {
  mtn: 'mtn',
  glo: 'glo',
  '9mobile': '9mobile',
  airtel: 'airtel',
  smile: 'smile',
  'ikeja-electric': 'ikeja-electric',
  'eko-electric': 'eko-electric',
  'abuja-electric': 'abuja-electric',
  'portharcourt-electric': 'portharcourt-electric',
  dstv: 'dstv',
  gotv: 'gotv',
  startimes: 'startimes',
  showmax: 'showmax'
};

// Get available providers
router.get('/providers', async (req, res) => {
  try {
    const result = await providerService.getProviders();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get data plans - supports both standard data and budget data
router.get('/data/plans', async (req, res) => {
  try {
    const { network, type } = req.query;
    
    // If specific network requested
    let networkId = NETWORK_ID_MAP[network?.toLowerCase()] || network;
    
    // Get from provider
    let result;
    if (type === 'budget' || !network) {
      // Get budget data plans
      result = await providerService.getBudgetDataPlans(networkId);
    } else {
      // Get standard data plans
      result = await providerService.getVariations('data', network);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get cable TV plans
router.get('/cable/plans', async (req, res) => {
  try {
    const { service } = req.query; // dstv, gotv, startimes, showmax
    const result = await providerService.getVariations('cable', service || 'dstv');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify customer (electricity or cable)
router.post('/verify', async (req, res) => {
  try {
    const { customerId, serviceId, variationId } = req.body;
    
    if (!customerId || !serviceId) {
      return res.status(400).json({ success: false, message: 'customerId and serviceId are required' });
    }
    
    const result = await providerService.verifyCustomer(customerId, serviceId, variationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Purchase VTU service (airtime, data, cable, electricity)
router.post('/purchase', verifyToken, async (req, res) => {
  try {
    const { type, amount, details } = req.body;
    
    if (!type || !details) {
      return res.status(400).json({ success: false, message: 'type and details are required' });
    }

    // Validate based on type
    if (type === 'airtime' && (!details.phone || !details.network)) {
      return res.status(400).json({ success: false, message: 'phone and network are required for airtime' });
    }
    
    if (type === 'data' && (!details.phone || !details.planId || !details.network)) {
      return res.status(400).json({ success: false, message: 'phone, network, and planId are required for data' });
    }
    
    if (type === 'cable' && (!details.customerId || !details.serviceId || !details.planId)) {
      return res.status(400).json({ success: false, message: 'customerId, serviceId, and planId are required for cable' });
    }
    
    if (type === 'electricity' && (!details.customerId || !details.serviceId || !details.variationId || !amount)) {
      return res.status(400).json({ success: false, message: 'customerId, serviceId, variationId, and amount are required for electricity' });
    }

    // Calculate user price with profit margin
    let userPrice = Number(amount || 0);
    let providerCost = Number(amount || 0);
    
    // Get pricing from service_plans collection if available
    if (type === 'data' && details.planId) {
      try {
        const planSnap = await db.collection('service_plans')
          .where('metadata.variation_id', '==', String(details.planId))
          .limit(1)
          .get();
        
        if (!planSnap.empty) {
          const plan = planSnap.docs[0].data();
          userPrice = Number(plan.priceUser || userPrice);
          providerCost = Number(plan.priceApi || providerCost);
        }
      } catch (e) {
        console.error('[VTU] Error fetching plan:', e);
      }
    } else if (type === 'airtime' && details.network) {
      // Get airtime discount from settings
      try {
        const settingsDoc = await db.collection('settings').doc('global').get();
        const settings = settingsDoc.exists ? settingsDoc.data() : {};
        const networkKey = String(details.network).toUpperCase();
        const networkSettings = settings.airtimeNetworks?.[networkKey] || {};
        const discount = Number(networkSettings.discount || 0);
        const rate = (100 - discount) / 100;
        userPrice = Math.round(Number(amount || 0) * rate);
        providerCost = userPrice;
      } catch (e) {
        console.error('[VTU] Error fetching airtime settings:', e);
      }
    } else if (type === 'cable' && details.planId) {
      // Get cable plan price
      try {
        const planSnap = await db.collection('service_plans')
          .where('metadata.variation_id', '==', String(details.planId))
          .where('type', '==', 'cable')
          .limit(1)
          .get();
        
        if (!planSnap.empty) {
          const plan = planSnap.docs[0].data();
          userPrice = Number(plan.priceUser || userPrice);
          providerCost = Number(plan.priceApi || providerCost);
        }
      } catch (e) {
        console.error('[VTU] Error fetching cable plan:', e);
      }
    } else if (type === 'electricity') {
      // Get electricity settings/margin
      try {
        const settingsDoc = await db.collection('settings').doc('global').get();
        const settings = settingsDoc.exists ? settingsDoc.data() : {};
        const discount = Number(settings.electricityDiscount || settings.powerConfig?.discount || 0);
        const rate = (100 - discount) / 100;
        userPrice = Math.round(Number(amount || 0) * rate);
        providerCost = userPrice;
      } catch (e) {
        console.error('[VTU] Error fetching electricity settings:', e);
      }
    }

    // Use transaction service to process the purchase
    const result = await transactionService.initiateTransaction(
      req.user.uid,
      type,
      userPrice, // This is what user pays
      details,
      details.requestId
    );
    
    res.json({
      success: result.status === 'success',
      status: result.status,
      transactionId: result.id,
      message: result.status === 'success' ? 'Transaction successful' : result.failureReason,
      data: result
    });
  } catch (error) {
    console.error('[VTU] Purchase error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get transaction history
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const history = await transactionService.getTransactions(req.user.uid);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Requery transaction status
router.post('/requery', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required' });
    }
    
    // Find the transaction in our DB
    const txSnap = await db.collection('transactions')
      .where('requestId', '==', requestId)
      .where('userId', '==', req.user.uid)
      .limit(1)
      .get();
    
    if (txSnap.empty) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const tx = txSnap.docs[0].data();
    res.json({
      success: true,
      status: tx.status,
      transaction: tx
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
