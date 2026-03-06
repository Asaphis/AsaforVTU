const axios = require('axios');
const { db } = require('../config/firebase');
const walletService = require('./walletService');

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
      redirect_url: redirectUrl || process.env.FLW_REDIRECT_URL || 'https://asaforvtu.onrender.com/payment-complete',
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

    await db.collection('payments').doc(tx_ref).set({
      tx_ref,
      userId,
      amount,
      status: 'pending',
      provider: 'flutterwave',
      createdAt: new Date(),
      link: data?.data?.link || null,
    });

    return { tx_ref, link: data?.data?.link, data };
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
        // Invalid reference or not found. Mark as failed so we don't retry forever.
         await db.collection('payments').doc(String(referenceOrId)).update({
          status: 'failed',
          verifiedAt: new Date(),
          providerResponse: { error: error.message, status: error.response.status }
        });
        return { success: false, error: 'Payment not found or invalid reference' };
      }
      throw error; // Rethrow other errors (500s, network) to be handled by caller
    }

    const status = verify?.status;
    const vdata = verify?.data || {};
    const resolvedRef = String(vdata.tx_ref || referenceOrId);
    const successful = status === 'success' && (vdata.status === 'successful' || vdata.processor_response === 'Approved');
    // If we don't have an expected amount (e.g., user returned with transaction_id),
    // fall back to Flutterwave's amount
    const expected = Number(expectedAmount || vdata.amount || 0);
    const amountOk = Number(vdata.amount) >= expected;

    if (successful && amountOk) {
      const paymentRef = db.collection('payments').doc(resolvedRef);
      
      // 1. Acquire Lock via Transaction
      try {
        await db.runTransaction(async (t) => {
           const doc = await t.get(paymentRef);
           if (!doc.exists) { 
               // If it doesn't exist, we create it in 'processing_credit' state
               t.set(paymentRef, { 
                   status: 'processing_credit', 
                   createdAt: new Date(),
                   userId: userId, 
                   tx_ref: resolvedRef 
               });
           } else {
               const pData = doc.data();
               // Check if already processed or currently processing
               if (pData.status === 'success' || pData.status === 'completed' || pData.status === 'processing_credit') {
                   throw new Error('Payment already processed or in progress');
               }
               t.update(paymentRef, { status: 'processing_credit', updatedAt: new Date() });
           }
        });
      } catch (e) {
          if (e.message.includes('already processed') || e.message.includes('in progress')) {
              console.log(`[Flutterwave] Payment ${referenceOrId} skipped: ${e.message}`);
              return { success: true, message: 'Payment already processed', alreadyProcessed: true };
          }
          throw e; // Propagate other errors for retry
      }

      // 2. Perform Wallet Credit (Lock is held)
      try {
          await walletService.createWallet(userId);
          await walletService.creditWallet(userId, Number(expected), 'main', 'Flutterwave Wallet Funding', resolvedRef);
          
          // 3. Mark as Success
          await paymentRef.set({
            status: 'success',
            verifiedAt: new Date(),
            amountPaid: Number(vdata.amount),
            providerResponse: vdata,
            userId: userId
          }, { merge: true });

          return { success: true };
      } catch (creditError) {
          console.error(`[Flutterwave] Credit failed for ${resolvedRef}:`, creditError);
          // Release lock on failure so it can be retried
          await paymentRef.update({ 
              status: 'pending', 
              notes: `Credit failed: ${creditError.message}. Retrying allowed.` 
          });
          throw creditError;
      }
    } else {
      console.warn(`[Payment Verification Failed] Ref: ${referenceOrId}, User: ${userId}, Status: ${status}, AmountOk: ${amountOk} (Exp: ${expectedAmount}, Act: ${vdata.amount})`);
      await db.collection('payments').doc(resolvedRef).set({
        status: 'failed',
        verifiedAt: new Date(),
        providerResponse: vdata,
      }, { merge: true });
      return { success: false, data: vdata };
    }
  }
  async reconcilePayment(refOrId, force = false) {
    const input = String(refOrId);
    let resolvedRef = input;
    let paymentRef = db.collection('payments').doc(resolvedRef);
    let paymentDoc = await paymentRef.get();
    
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
    paymentRef = db.collection('payments').doc(resolvedRef);
    paymentDoc = await paymentRef.get();

    // 2. Check if already credited in Wallet Transactions (via externalReference)
    // Note: Older transactions might not have externalReference set, so this check might miss them.
    // That's why we have 'force'.
    const existingTx = await db.collection('wallet_transactions')
        .where('externalReference', '==', String(resolvedRef))
        .limit(1)
        .get();
        
    if (!existingTx.empty && !force) {
        return { success: false, message: 'Wallet transaction already exists for this reference.' };
    }

    // 3. Check Payment Doc Status
    if (paymentDoc.exists) {
        const pData = paymentDoc.data();
        if ((pData.status === 'success' || pData.status === 'completed') && !force) {
             return { success: false, message: 'Payment record already marked as success. Use force=true to override.' };
        }
    }

    // 4. Determine User ID
    const userId = (paymentDoc.exists && paymentDoc.data().userId) || fwData.meta?.userId;
    if (!userId) {
        return { success: false, message: 'No User ID found in payment record or Flutterwave metadata.' };
    }

    // 5. Credit Wallet
    try {
        await walletService.createWallet(userId);
        // We pass tx_ref as externalReference so future checks catch it
        await walletService.creditWallet(userId, Number(fwData.amount), 'main', 'Flutterwave Funding (Reconciled)', String(resolvedRef));
        
        await paymentRef.set({
            status: 'success',
            verifiedAt: new Date(),
            amountPaid: Number(fwData.amount),
            providerResponse: fwData,
            userId: userId,
            reconciledAt: new Date(),
            notes: 'Manually Reconciled via Admin'
        }, { merge: true });

        return { success: true, message: `Successfully credited ₦${fwData.amount} to user ${userId}` };
    } catch (e) {
        if (e.message.includes('already exists')) {
             return { success: false, message: 'Wallet already credited (caught by duplicate check).' };
        }
        throw e;
    }
  }
}

module.exports = new FlutterwaveService();

