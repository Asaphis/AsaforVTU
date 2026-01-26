const { db, auth } = require('../config/firebase');

const SETTINGS_DOC = 'settings/global';

const updateSettings = async (req, res) => {
  try {
    const body = req.body || {};
    const clean = (v) => {
      if (Array.isArray(v)) {
        const arr = v.map((x) => clean(x)).filter((x) => x !== undefined);
        return arr;
      }
      if (v && typeof v === 'object') {
        const out = {};
        for (const [k, val] of Object.entries(v)) {
          const c = clean(val);
          if (c !== undefined) {
            out[k] = c;
          }
        }
        return out;
      }
      if (v === undefined) return undefined;
      return v;
    };
    const data = clean(body);
    data.updatedAt = new Date();
    await db.doc(SETTINGS_DOC).set(data, { merge: true });
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const doc = await db.doc(SETTINGS_DOC).get();
    res.json(doc.exists ? doc.data() : {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const snapshot = await db.collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const transactions = snapshot.docs.map(doc => doc.data());
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const walletService = require('../services/walletService');
const flutterwaveService = require('../services/flutterwaveService');

const creditWallet = async (req, res) => {
  try {
    const { userId, amount, walletType, description } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    const wtype = ['main', 'cashback', 'referral'].includes(walletType) ? walletType : 'main';
    const raw = String(userId || '').trim();
    let targetUid = '';
    
    // 1. Resolve to UID
    try {
      if (raw.includes('@')) {
        // It's an email
        try {
            const u = await auth.getUserByEmail(raw);
            targetUid = u.uid;
        } catch (e) {
            // Fallback: Check if we have a user doc with this email
            const q = await db.collection('users').where('email', '==', raw.toLowerCase()).limit(1).get();
            if (!q.empty) targetUid = q.docs[0].id;
        }
      } else {
        // It's likely a UID
        targetUid = raw;
        // Verify it exists if possible, but not strictly required if we trust admin input
        try {
            await auth.getUser(targetUid);
        } catch (e) {
            // If not in Auth, maybe in Users collection?
            const d = await db.collection('users').doc(targetUid).get();
            if (!d.exists) {
                 // Warning: Crediting a non-existent user ID?
                 // We'll proceed but log it.
                 console.warn(`[Admin] Crediting potential non-existent UID: ${targetUid}`);
            }
        }
      }
    } catch (e) {}

    const finalId = targetUid || raw; // Fallback to raw if resolution fails

    await walletService.createWallet(finalId);
    const newBalance = await walletService.creditWallet(finalId, amt, wtype, description || 'Admin Credit');
    
    // Return extra info for Admin
    // Log to admin_transactions
    try {
      await db.collection('admin_transactions').add({
        type: 'credit',
        adminUid: req.user.uid,
        adminEmail: req.user.email,
        targetUserId: finalId,
        amount: amt,
        walletType: wtype,
        description: description || 'Admin Credit',
        createdAt: new Date()
      });
    } catch (e) {
      console.error('Failed to log admin transaction:', e);
    }

    res.json({ 
        success: true, 
        userId: finalId, 
        newBalance, 
        walletType: wtype,
        note: (finalId !== raw) ? `Resolved '${raw}' to UID '${finalId}'` : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reverifyPayment = async (req, res) => {
  try {
    const { tx_ref, force } = req.body;
    if (!tx_ref) return res.status(400).json({ error: 'tx_ref is required' });
    
    const result = await flutterwaveService.reconcilePayment(tx_ref, force === true || force === 'true');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  updateSettings,
  getSettings,
  getAllTransactions,
  creditWallet,
  reverifyPayment
};

const listUsers = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    let baseUsers = [];
    try {
      const authList = await auth.listUsers(limit);
      baseUsers = authList.users.map(u => ({
        id: u.uid,
        uid: u.uid,
        displayName: u.displayName || '',
        email: u.email || '',
        phone: u.phoneNumber || '',
        joinedAt: u.metadata?.creationTime || '',
        status: u.disabled ? 'inactive' : 'active',
      }));
    } catch {
      const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(limit).get();
      baseUsers = snap.docs.map((d) => {
        const x = d.data() || {};
        return {
          id: d.id,
          uid: d.id,
          displayName: x.displayName || x.name || '',
          email: x.email || '',
          phone: x.phone || x.phoneNumber || '',
          joinedAt: x.createdAt || '',
          status: x.disabled ? 'inactive' : 'active',
        };
      });
    }
    const profiles = {};
    try {
      const snap = await db.collection('users').limit(1000).get();
      for (const d of snap.docs) {
        const x = d.data() || {};
        const uidKey = String(x.uid || d.id || '').toLowerCase();
        const emailKey = String(x.email || '').toLowerCase();
        const phone = String(x.phone || x.phoneNumber || '');
        const displayName = String(x.displayName || x.name || '');
        if (uidKey) {
          profiles[uidKey] = { phone, displayName };
        }
        if (emailKey && !profiles[emailKey]) {
          profiles[emailKey] = { phone, displayName };
        }
      }
    } catch {}
    const balances = {};
    try {
      const names = ['user_wallets', 'wallets'];
      for (const n of names) {
        const snap = await db.collection(n).limit(1000).get();
        for (const d of snap.docs) {
          const x = d.data() || {};
          const uidKey = String(x.userId || d.id || '').toLowerCase();
          const emailKey = String(x.user_email || x.userEmail || '').toLowerCase();
          const mb = Number(x.mainBalance || x.main_balance || x.balance || 0);
          const cb = Number(x.cashbackBalance || x.cashback_balance || 0);
          const rb = Number(x.referralBalance || x.referral_balance || 0);
          const value = { main_balance: mb, cashback_balance: cb, referral_balance: rb };
          if (uidKey) {
            balances[uidKey] = value;
          }
          if (emailKey) {
            balances[emailKey] = value;
          }
        }
      }
    } catch {}
    const users = baseUsers.map(u => {
      const uidKey = String(u.uid || u.id || '').toLowerCase();
      const emailKey = String(u.email || '').toLowerCase();
      const profile = profiles[uidKey] || profiles[emailKey];
      const bal = balances[uidKey] || balances[emailKey];
      const phone = u.phone || (profile ? profile.phone : '');
      const displayName = u.displayName || (profile ? profile.displayName : '');
      return {
        ...u,
        displayName,
        phone,
        walletBalance: bal ? Number(bal.main_balance || 0) : 0,
        cashbackBalance: bal ? Number(bal.cashback_balance || 0) : 0,
        referralBalance: bal ? Number(bal.referral_balance || 0) : 0,
      };
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const promoteToAdmin = async (req, res) => {
  try {
    const { uid, email } = req.body || {};
    let userRecord;
    if (uid) {
      userRecord = await auth.getUser(uid);
    } else if (email) {
      userRecord = await auth.getUserByEmail(email);
    } else {
      return res.status(400).json({ error: 'uid or email is required' });
    }

    const targetUid = userRecord.uid;

    const existingClaims = userRecord.customClaims || {};
    const newClaims = { ...existingClaims, admin: true };
    await auth.setCustomUserClaims(targetUid, newClaims);

    const userRef = db.collection('users').doc(targetUid);
    await userRef.set(
      {
        role: 'admin',
        updatedAt: new Date(),
      },
      { merge: true }
    );

    res.json({ success: true, uid: targetUid, email: userRecord.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.listUsers = listUsers;
module.exports.promoteToAdmin = promoteToAdmin;

const debitWallet = async (req, res) => {
  try {
    const { userId, amount, walletType, description } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    const wtype = ['main', 'cashback', 'referral'].includes(walletType) ? walletType : 'main';
    const raw = String(userId || '').trim();
    let targetUid = '';
    
    try {
      if (raw.includes('@')) {
        try {
            const u = await auth.getUserByEmail(raw);
            targetUid = u.uid;
        } catch (e) {
            const q = await db.collection('users').where('email', '==', raw.toLowerCase()).limit(1).get();
            if (!q.empty) targetUid = q.docs[0].id;
        }
      } else {
        targetUid = raw;
        try { await auth.getUser(targetUid); } catch (e) {}
      }
    } catch (e) {}

    const finalId = targetUid || raw;

    await walletService.createWallet(finalId);
    const newBalance = await walletService.debitWallet(finalId, amt, wtype, description || 'Admin Debit');
    res.json({ success: true, userId: finalId, newBalance, walletType: wtype });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber, requireVerification, redirectUrl } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await auth.createUser({
      email,
      password,
      displayName: displayName || undefined,
      phoneNumber: phoneNumber || undefined,
      emailVerified: !requireVerification
    });
    const profileRef = db.collection('users').doc(user.uid);
    await profileRef.set(
      {
        email: user.email,
        displayName: user.displayName || displayName || '',
        phone: phoneNumber || '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { merge: true }
    );
    await walletService.createWallet(user.uid);
    let verificationLink;
    if (requireVerification) {
      try {
        const url = redirectUrl || 'https://asaforvtu.onrender.com/login';
        verificationLink = await auth.generateEmailVerificationLink(email, { url });
      } catch (e) {}
    }
    res.json({ success: true, uid: user.uid, email: user.email, verificationLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await auth.createUser({
      email,
      password,
      displayName: displayName || undefined
    });
    await auth.setCustomUserClaims(user.uid, { admin: true });
    await db.collection('admin_accounts').doc(email.toLowerCase()).set({
      email: email.toLowerCase(),
      uid: user.uid,
      createdAt: new Date()
    }, { merge: true });
    await walletService.createWallet(user.uid);
    res.json({ success: true, uid: user.uid, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listAdmins = async (req, res) => {
  try {
    const snap = await db.collection('admin_accounts').get();
    const admins = snap.docs.map(d => d.data());
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await auth.getUser(uid);
    const profileSnap = await db.collection('users').doc(uid).get();
    const profile = profileSnap.exists ? profileSnap.data() : {};
    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || profile.displayName || '',
      phoneNumber: user.phoneNumber || profile.phone || '',
      role: 'admin',
      status: user.disabled ? 'inactive' : 'active'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { displayName, phoneNumber } = req.body;
    await auth.updateUser(uid, {
      displayName: displayName || undefined,
      phoneNumber: phoneNumber || undefined
    });
    await db.collection('users').doc(uid).set({
      displayName,
      phone: phoneNumber,
      updatedAt: new Date()
    }, { merge: true });
    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { newPassword } = req.body;
    await auth.updateUser(uid, { password: newPassword });
    res.json({ success: true, message: 'Password changed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const snap = await db.collection('tickets').orderBy('lastMessageAt', 'desc').get();
    const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const { subject, message, email } = req.body;
    const ticketRef = await db.collection('tickets').add({
      subject,
      email: email || req.user?.email || 'unknown',
      userId: req.user?.uid || 'unknown',
      status: 'open',
      lastMessage: message,
      lastMessageAt: new Date(),
      createdAt: new Date()
    });
    await ticketRef.collection('messages').add({
      text: message,
      sender: 'user',
      senderId: req.user?.uid || 'unknown',
      createdAt: new Date(),
      read: false
    });
    res.json({ success: true, id: ticketRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const replyTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const ticketRef = db.collection('tickets').doc(id);
    await ticketRef.collection('messages').add({
      text: message,
      sender: 'admin',
      senderId: req.user?.uid || 'admin',
      createdAt: new Date(),
      read: false
    });
    await ticketRef.update({
      status: 'replied',
      lastMessage: message,
      lastMessageAt: new Date()
    });
    res.json({ success: true, message: 'Reply sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const snap = await db.collection('announcements').orderBy('createdAt', 'desc').get();
    const announcements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const docRef = await db.collection('announcements').add({
      title,
      content,
      type: type || 'info',
      active: true,
      createdAt: new Date()
    });
    res.json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('announcements').doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.debitWallet = debitWallet;
module.exports.createUser = createUser;
module.exports.createAdmin = createAdmin;
module.exports.listAdmins = listAdmins;
module.exports.getAdminProfile = getAdminProfile;
module.exports.updateAdminProfile = updateAdminProfile;
module.exports.changeAdminPassword = changeAdminPassword;
module.exports.getTickets = getTickets;
module.exports.replyTicket = replyTicket;
module.exports.getAnnouncements = getAnnouncements;
module.exports.createAnnouncement = createAnnouncement;
module.exports.deleteAnnouncement = deleteAnnouncement;

const fixGhostWallets = async (req, res) => {
  try {
    const dryRun = req.body.dryRun === true;
    const snapshot = await db.collection('wallets').get();
    let migrated = 0;
    let report = [];

    for (const doc of snapshot.docs) {
      if (doc.id.includes('@')) {
         const ghostBalance = Number(doc.data().mainBalance || 0);
         if (ghostBalance > 0) {
             let targetUid = null;
             try {
                const u = await auth.getUserByEmail(doc.id);
                targetUid = u.uid;
             } catch (e) {
                 const q = await db.collection('users').where('email', '==', doc.id.toLowerCase()).limit(1).get();
                 if (!q.empty) targetUid = q.docs[0].id;
             }

             if (targetUid) {
                 if (!dryRun) {
                     await walletService.createWallet(targetUid);
                     await walletService.creditWallet(targetUid, ghostBalance, 'main', `Migrated from ${doc.id}`);
                     // Zero out ghost wallet
                     await db.collection('wallets').doc(doc.id).update({ 
                         mainBalance: 0, 
                         migrated: true,
                         migratedTo: targetUid,
                         migratedAt: new Date()
                     });
                 }
                 report.push({ email: doc.id, targetUid, amount: ghostBalance, status: dryRun ? 'Pending' : 'Migrated' });
                 migrated++;
             }
         }
      }
    }
    res.json({ success: true, count: migrated, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getServices = async (req, res) => {
  try {
    const snap = await db.collection('services').get();
    const services = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const { id, name, icon, category } = req.body;
    const docId = id || name.toLowerCase().replace(/\s+/g, '-');
    await db.collection('services').doc(docId).set({
      name,
      icon: icon || '',
      category: category || 'Other',
      active: true,
      createdAt: new Date()
    });
    res.json({ success: true, id: docId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('services').doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, category, active } = req.body;
    await db.collection('services').doc(id).update({
      ...(name && { name }),
      ...(icon !== undefined && { icon }),
      ...(category && { category }),
      ...(active !== undefined && { active }),
      updatedAt: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.fixGhostWallets = fixGhostWallets;
module.exports.getServices = getServices;
module.exports.createService = createService;
module.exports.updateService = updateService;
module.exports.deleteService = deleteService;

const generateVerificationLink = async (req, res) => {
  try {
    const { email, uid, redirectUrl } = req.body || {};
    let targetEmail = email;
    if (!targetEmail && uid) {
      const u = await auth.getUser(uid);
      targetEmail = u.email;
    }
    if (!targetEmail) return res.status(400).json({ error: 'email or uid required' });
    const url = redirectUrl || 'https://asaforvtu.onrender.com/login';
    const link = await auth.generateEmailVerificationLink(targetEmail, { url });
    res.json({ success: true, email: targetEmail, verificationLink: link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.generateVerificationLink = generateVerificationLink;

