const axios = require('axios');
const pool = require('../config/database');
const paymentService = require('./paymentService');

const FLW_API = 'https://api.flutterwave.com/v3';

class FlutterwaveService {
  constructor() {
    if (!process.env.FLW_SECRET_KEY) console.warn('Warning: FLW_SECRET_KEY is not set. Payments will fail.');
  }

  _headers() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FLW_SECRET_KEY || ''}` };
  }

  _genRef(prefix = 'FLW') {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  generateReference() { return this._genRef('DEP'); }

  async initiatePayment(userId, amount, customer = {}, redirectUrl, suppliedTxRef = null) {
    const tx_ref = suppliedTxRef || this.generateReference();
    const response = await axios.post(`${FLW_API}/payments`, {
      tx_ref,
      amount,
      currency: 'NGN',
      redirect_url: redirectUrl || process.env.FLW_REDIRECT_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-complete`,
      customer: { email: customer.email || 'user@asaforvtu.com', name: customer.name || 'Asafor User', phonenumber: customer.phone || undefined },
      meta: { userId, purpose: 'wallet_funding' },
      payment_options: 'card,banktransfer,ussd'
    }, { headers: this._headers(), timeout: 15000 });
    const data = response.data || {};
    return { tx_ref, link: data?.data?.link, flw_ref: data?.data?.flw_ref, data };
  }

  async verifyById(id) {
    const response = await axios.get(`${FLW_API}/transactions/${id}/verify`, { headers: this._headers(), timeout: 15000 });
    return response.data || {};
  }

  async verifyByReference(tx_ref) {
    const response = await axios.get(`${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`, { headers: this._headers(), timeout: 15000 });
    return response.data || {};
  }

  async creditIfValid(referenceOrId, expectedAmount, userId) {
    let verify;
    try {
      verify = /^\d+$/.test(String(referenceOrId))
        ? await this.verifyById(referenceOrId)
        : await this.verifyByReference(String(referenceOrId));
    } catch (error) {
      console.warn(`[Flutterwave Verify Error] Ref: ${referenceOrId} - ${error.message}`);
      return { success: false, error: 'Payment not found or provider verification failed' };
    }

    const status = verify?.status;
    const data = verify?.data || {};
    const resolvedRef = String(data.tx_ref || referenceOrId);
    const expected = Number(expectedAmount);
    const amountPaid = Number(data.amount);
    const successful = status === 'success' && ['successful', 'success'].includes(String(data.status).toLowerCase()) && Number.isFinite(amountPaid) && amountPaid >= expected;
    if (!successful) return { success: false, error: 'Payment verification failed', data };

    const result = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1 AND (tx_ref = $2 OR provider_reference = $2) LIMIT 1`,
      [userId, resolvedRef]
    );
    const payment = result.rows[0];
    if (!payment) return { success: false, error: 'Payment record not found' };
    if (payment.status === 'success') return { success: true, message: 'Payment already processed', alreadyProcessed: true };
    if (Number(payment.amount) > amountPaid) return { success: false, error: 'Paid amount is less than the required amount' };

    try {
      await paymentService.processSuccessfulPayment(payment.id, {
        provider_reference: resolvedRef,
        flw_ref: data.flw_ref,
        amount_paid: amountPaid,
        metadata: { flutterwave_status: data.status }
      });
      return { success: true };
    } catch (error) {
      const latest = await paymentService.getPaymentById(payment.id);
      if (latest?.status === 'success') return { success: true, alreadyProcessed: true };
      throw error;
    }
  }

  async reconcilePayment(refOrId, force = false) {
    const input = String(refOrId);
    let result;
    try {
      result = /^\d+$/.test(input) ? await this.verifyById(input) : await this.verifyByReference(input);
    } catch (error) {
      return { success: false, message: error.response?.status === 404 ? 'Transaction not found on Flutterwave' : `Flutterwave check failed: ${error.message}` };
    }
    const data = result?.data || {};
    if (!data || !['successful', 'success'].includes(String(data.status).toLowerCase())) {
      return { success: false, message: `Payment not successful on Flutterwave (Status: ${data?.status})` };
    }
    const ref = String(data.tx_ref || input);
    const paymentResult = await pool.query('SELECT * FROM payments WHERE tx_ref = $1 OR provider_reference = $1 LIMIT 1', [ref]);
    const payment = paymentResult.rows[0];
    if (!payment) return { success: false, message: 'Payment record not found' };
    if (payment.status === 'success' && !force) return { success: true, message: 'Payment already processed' };
    return this.creditIfValid(ref, Number(payment.amount), payment.user_id);
  }
}

module.exports = new FlutterwaveService();
