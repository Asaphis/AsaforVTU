const axios = require('axios');
const pool = require('../config/database');
const paymentService = require('./paymentService');

const FLW_API = 'https://api.flutterwave.com/v3';

class FlutterwaveService {
  constructor() {
    if (!process.env.FLW_SECRET_KEY) {
      console.warn('Warning: FLW_SECRET_KEY is not set. Payments will fail.');
    }
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FLW_SECRET_KEY || ''}`,
    };
  }

  _genRef(prefix = 'FLW') {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${ts}-${rnd}`;
  }

  async initiatePayment(userId, amount, customer = {}, redirectUrl) {
    const tx_ref = this._genRef('DEP');
    const body = {
      tx_ref,
      amount,
      currency: 'NGN',
      redirect_url: redirectUrl || process.env.FLW_REDIRECT_URL || 'https://vtu.ferixas.com/payment-complete',
      customer: {
        email: customer.email || 'user@Asafor.com',
        name: customer.name || 'Asafor User',
        phonenumber: customer.phone || undefined,
      },
      meta: {
        userId,
        purpose: 'wallet_funding',
      },
      payment_options: 'card,banktransfer,ussd',
    };
    const res = await axios.post(`${FLW_API}/payments`, body, { headers: this._headers(), timeout: 15000 });
    const data = res.data || {};

    // Create payment record in PostgreSQL
    await paymentService.createPayment({
      user_id: userId,
      amount,
      payment_method: 'flutterwave',
      provider: 'flutterwave',
      tx_ref,
      metadata: {
        link: data?.data?.link,
        flutterwave_data: data
      }
    });

    return { tx_ref, link: data?.data?.link, flw_ref: data?.data?.flw_ref, data };
  }

  async verifyById(id) {
    const res = await axios.get(`${FLW_API}/transactions/${id}/verify`, { headers: this._headers(), timeout: 15000 });
    return res.data || {};
  }

  async verifyByReference(tx_ref) {
    const res = await axios.get(`${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`, { headers: this._headers(), timeout: 15000 });
    return res.data || {};
  }

  async creditIfValid(referenceOrId, expectedAmount, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let verify;
      try {
        if (String(referenceOrId).match(/^\d+$/)) {
          verify = await this.verifyById(referenceOrId);
        } else {
          verify = await this.verifyByReference(referenceOrId);
        }
      } catch (error) {
        console.warn(`[Flutterwave Verify Error] Ref: ${referenceOrId} - ${error.message}`);
        if (error.response && (error.response.status === 400 || error.response.status === 404)) {
          // Mark as failed
          await client.query(
            `UPDATE payments 
             SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
             WHERE tx_ref = $1 OR provider_reference = $2`,
            [String(referenceOrId), String(referenceOrId)]
          );
          await client.query('ROLLBACK');
          return { success: false, error: 'Payment not found or invalid reference' };
        }
        throw error;
      }

      const status = verify?.status;
      const vdata = verify?.data || {};
      const resolvedRef = String(vdata.tx_ref || referenceOrId);
      const successful = status === 'success' && (vdata.status === 'successful' || vdata.processor_response === 'Approved');
      const expected = Number(expectedAmount || vdata.amount || 0);
      const amountOk = Number(vdata.amount) >= expected;

      if (successful && amountOk) {
        // Check if payment already exists
        const paymentResult = await client.query(
          `SELECT * FROM payments 
           WHERE tx_ref = $1 OR provider_reference = $2 
           LIMIT 1`,
          [resolvedRef, resolvedRef]
        );
        
        if (paymentResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return { success: false, error: 'Payment record not found' };
        }

        const payment = paymentResult.rows[0];

        // Check if already processed
        if (payment.status === 'success' || payment.status === 'completed') {
          await client.query('ROLLBACK');
          return { success: true, message: 'Payment already processed', alreadyProcessed: true };
        }

        // Process payment - INSTANT CREDIT
        await paymentService.processSuccessfulPayment(payment.id, {
          flw_ref: vdata.flw_ref,
          amount_paid: Number(vdata.amount)
        });

        await client.query('COMMIT');
        return { success: true };
      } else {
        console.warn(`[Payment Verification Failed] Ref: ${referenceOrId}, User: ${userId}, Status: ${status}, AmountOk: ${amountOk}`);
        await client.query(
          `UPDATE payments 
           SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
           WHERE tx_ref = $1 OR provider_reference = $2`,
          [resolvedRef, resolvedRef]
        );
        await client.query('ROLLBACK');
        return { success: false, data: vdata };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Flutterwave Service] Credit error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async reconcilePayment(refOrId, force = false) {
    const input = String(refOrId);
    let resolvedRef = input;
    
    // 1. Verify with Flutterwave
    let fwData;
    try {
      if (input.match(/^\d+$/)) {
        const res = await this.verifyById(input);
        fwData = res.data;
      } else {
        const res = await this.verifyByReference(input);
        fwData = res.data;
      }
    } catch (e) {
      if (e.response && e.response.status === 404) {
        return { success: false, message: 'Transaction not found on Flutterwave' };
      }
      return { success: false, message: 'Flutterwave check failed: ' + e.message };
    }

    if (!fwData || (fwData.status !== 'successful' && fwData.status !== 'success')) {
      return { success: false, message: `Payment not successful on Flutterwave (Status: ${fwData?.status})` };
    }

    resolvedRef = String(fwData.tx_ref || input);

    // 2. Check if already credited
    const existingPayment = await pool.query(
      `SELECT * FROM payments 
       WHERE tx_ref = $1 OR provider_reference = $1 
       LIMIT 1`,
      [resolvedRef]
    );
    
    if (existingPayment.rows.length > 0) {
      const payment = existingPayment.rows[0];
      if ((payment.status === 'success' || payment.status === 'completed') && !force) {
        return { success: false, message: 'Payment already processed' };
      }
    }

    // 3. Process payment
    if (existingPayment.rows.length > 0) {
      await paymentService.processSuccessfulPayment(existingPayment.rows[0].id, {
        flw_ref: fwData.flw_ref,
        amount_paid: Number(fwData.amount)
      });
      return { success: true, message: 'Payment reconciled successfully' };
    }

    return { success: false, message: 'Payment record not found' };
  }
}

module.exports = new FlutterwaveService();
