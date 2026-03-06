const flutterwaveService = require('../services/flutterwaveService');
const walletService = require('../services/walletService');
const { db } = require('../config/firebase');

const initiate = async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum is ₦100.' });
    }
    const origin = (req.headers.origin || '').toLowerCase();
    const isLocal = origin.includes('localhost');
    const isRenderFrontend = origin.includes('asaforvtu.onrender.com');
    const isAsafor = origin.includes('Asafor.com');
    const base =
      (isLocal && 'http://localhost:3000') ||
      (isRenderFrontend && 'https://asaforvtu.onrender.com') ||
      (isAsafor && 'https://asaforvtu.onrender.com') ||
      (process.env.FLW_REDIRECT_URL ? process.env.FLW_REDIRECT_URL.replace(/\/+$/,'') : 'https://asaforvtu.onrender.com');
    const redirectUrl = `${base}/payment-complete`;
    const result = await flutterwaveService.initiatePayment(
      uid,
      Number(amount),
      { email, name: req.user.name, phone: req.user.phone },
      redirectUrl
    );
    res.json({ tx_ref: result.tx_ref, link: result.link });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const verify = async (req, res) => {
  try {
    const { uid } = req.user;
    const ref = String(req.body.tx_ref || req.body.transaction_id || '').trim();
    if (!ref) return res.status(400).json({ error: 'tx_ref or transaction_id required' });
    
    // Try direct doc by provided ref
    let doc = await db.collection('payments').doc(ref).get();
    let pay = doc.exists ? doc.data() : null;
    
    // If not found, try lookup by tx_ref field (in case ref is numeric transaction_id)
    if (!pay) {
      try {
        const q = await db.collection('payments').where('tx_ref', '==', ref).limit(1).get();
        if (!q.empty) {
          doc = q.docs[0];
          pay = doc.data();
        }
      } catch {}
    }
    
    // Already credited
    if (pay && (pay.status === 'success' || pay.status === 'completed')) {
      return res.json({ success: true, message: 'Already credited' });
    }
    
    // Proceed to verify and credit. Pass expected amount if we have it, else allow service to use provider amount.
    const expectedAmount = pay ? Number(pay.amount || 0) : 0;
    const result = await flutterwaveService.creditIfValid(ref, expectedAmount, uid);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { initiate, verify };

