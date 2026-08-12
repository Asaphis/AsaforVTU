const express = require('express');
const { authenticate } = require('../middleware/auth');
const providerService = require('../services/providerService');
const transactionService = require('../services/transactionService');
const pool = require('../config/database');
const { getServicePlans } = require('../services/serviceService');

const router = express.Router();

// Network mapping for IA Café
const NETWORK_ID_MAP = {
  mtn: 1,
  glo: 2,
  '9mobile': 3,
  airtel: 4
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
    
    let networkId = NETWORK_ID_MAP[network?.toLowerCase()] || network;
    
    // Get from provider
    let result;
    if (type === 'budget' || !network) {
      result = await providerService.getBudgetDataPlans(networkId);
    } else {
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
    const { service } = req.query;
    const result = await providerService.getVariations('cable', service || 'dstv');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get electricity plans (variations)
router.get('/electricity/plans', async (req, res) => {
  try {
    const { service } = req.query;
    const result = await providerService.getVariations('electricity', service || 'ikeja-electric');
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
router.post('/purchase', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
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
    
    // Get pricing from service_plans if available
    if (type === 'data' && details.planId) {
      try {
        const plans = await getServicePlans({ 
          active_only: true 
        });
        const plan = plans.find(p => p.metadata?.variation_id === String(details.planId));
        
        if (plan) {
          userPrice = Number(plan.price_user || userPrice);
          providerCost = Number(plan.price_api || providerCost);
        }
      } catch (e) {
        console.error('[VTU] Error fetching plan:', e);
      }
    } else if (type === 'airtime' && details.network) {
      // Get airtime discount from settings
      try {
        const settingsResult = await pool.query(
          "SELECT value FROM settings WHERE key = 'airtime_networks'"
        );
        
        if (settingsResult.rows.length > 0) {
          const airtimeNetworks = settingsResult.rows[0].value;
          const networkKey = String(details.network).toUpperCase();
          const networkSettings = airtimeNetworks[networkKey] || {};
          const discount = Number(networkSettings.discount || 0);
          const rate = (100 - discount) / 100;
          userPrice = Math.round(Number(amount || 0) * rate);
          providerCost = userPrice;
        }
      } catch (e) {
        console.error('[VTU] Error fetching airtime settings:', e);
      }
    } else if (type === 'cable' && details.planId) {
      // Get cable plan price
      try {
        const plans = await getServicePlans({ 
          type: 'cable',
          active_only: true 
        });
        const plan = plans.find(p => p.metadata?.variation_id === String(details.planId));
        
        if (plan) {
          userPrice = Number(plan.price_user || userPrice);
          providerCost = Number(plan.price_api || providerCost);
        }
      } catch (e) {
        console.error('[VTU] Error fetching cable plan:', e);
      }
    } else if (type === 'electricity') {
      // Get electricity settings/margin
      try {
        const settingsResult = await pool.query(
          "SELECT value FROM settings WHERE key = 'electricity_discount'"
        );
        
        if (settingsResult.rows.length > 0) {
          const discount = Number(settingsResult.rows[0].value || 0);
          const rate = (100 - discount) / 100;
          userPrice = Math.round(Number(amount || 0) * rate);
          providerCost = userPrice;
        }
      } catch (e) {
        console.error('[VTU] Error fetching electricity settings:', e);
      }
    }

    // Get service ID based on type
    let serviceId = null;
    try {
      const services = await getServicePlans({ active_only: true });
      const service = services.find(s => s.category?.toLowerCase().includes(type));
      if (service) {
        serviceId = service.id;
      }
    } catch (e) {
      console.error('[VTU] Error getting service:', e);
    }

    // Check user wallet balance FIRST - INSTANT DEBIT
    const walletResult = await client.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [req.user.id]
    );
    
    if (walletResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Wallet not found' });
    }
    
    const wallet = walletResult.rows[0];
    if (wallet.main_balance < userPrice) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // DEBIT WALLET INSTANTLY
    const newBalance = wallet.main_balance - userPrice;
    await client.query(
      'UPDATE wallets SET main_balance = $1, total_spent = total_spent + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
      [newBalance, userPrice, req.user.id]
    );

    // Record wallet transaction
    const reference = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, balance_after, description, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, wallet.id, 'debit', userPrice, newBalance, `Payment for ${type} transaction`, reference]
    );

    // Create transaction record
    const transactionResult = await client.query(
      `INSERT INTO transactions (user_id, service_id, plan_id, type, amount, reference, phone, meter_number, smartcard_number, customer_name, customer_address, metadata, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'processing')
       RETURNING *`,
      [req.user.id, serviceId, details.planId || null, type, userPrice, reference, details.phone, details.meterNumber, details.smartcardNumber, details.customerName, details.customerAddress, JSON.stringify({ ...details, provider_cost: providerCost })]
    );

    const transaction = transactionResult.rows[0];

    // Call provider service to complete the purchase
    let providerResult;
    if (type === 'airtime') {
      providerResult = await providerService.purchaseAirtime(
        details.requestId || reference,
        details.phone,
        providerCost,
        details.network
      );
    } else if (type === 'data') {
      providerResult = await providerService.purchaseData(
        details.requestId || reference,
        details.phone,
        providerCost,
        details.network,
        details.planId
      );
    } else if (type === 'cable') {
      providerResult = await providerService.purchaseCable(
        details.requestId || reference,
        details.customerId,
        providerCost,
        details.serviceId,
        details.planId
      );
    } else if (type === 'electricity') {
      providerResult = await providerService.purchaseElectricity(
        details.requestId || reference,
        details.customerId,
        providerCost,
        details.serviceId,
        details.variationId,
        amount
      );
    }

    // Update transaction based on provider result
    if (providerResult.success) {
      await client.query(
        'UPDATE transactions SET status = $1, provider_reference = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['success', providerResult.transactionId, transaction.id]
      );
    } else {
      // FAILED - REFUND WALLET INSTANTLY
      await client.query(
        'UPDATE wallets SET main_balance = main_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [userPrice, req.user.id]
      );
      
      await client.query(
        'UPDATE transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['failed', transaction.id]
      );
      
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        status: 'failed',
        transactionId: transaction.id,
        message: providerResult.message || 'Transaction failed. Wallet refunded.',
        data: providerResult
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      status: 'success',
      transactionId: transaction.id,
      message: 'Transaction successful',
      data: providerResult
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[VTU] Purchase error:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Get transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const history = await transactionService.getTransactionsByUserId(req.user.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Requery transaction status
router.post('/requery', authenticate, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required' });
    }
    
    // Find the transaction in our DB
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE reference = $1 OR metadata->>'requestId' = $2 
       AND user_id = $3 
       LIMIT 1`,
      [requestId, requestId, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const transaction = result.rows[0];
    res.json({
      success: true,
      status: transaction.status,
      transaction: transaction
    });
  } catch (error) {
    console.error('[VTU] Requery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
