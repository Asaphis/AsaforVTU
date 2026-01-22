const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let db, auth, messaging;
let firebaseInitialized = false;

try {
  // Check if firebase is already initialized to avoid errors
  if (!admin.apps.length) {
    // Sanitize env variables that may be pasted with quotes/commas from UIs
    const sanitize = (val) => {
      if (!val || typeof val !== 'string') return val;
      let s = val.trim();
      if (s.startsWith('"')) s = s.slice(1);
      if (s.endsWith('"')) s = s.slice(0, -1);
      // Remove trailing commas sometimes copied from JSON
      if (s.endsWith(',')) s = s.slice(0, -1);
      return s;
    };

    const projectId = sanitize(process.env.FIREBASE_PROJECT_ID);
    const clientEmail = sanitize(process.env.FIREBASE_CLIENT_EMAIL);
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const storageBucket = sanitize(process.env.FIREBASE_STORAGE_BUCKET);

    // Enhanced diagnostics
    const diagnostics = {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey,
      storageBucket: !!storageBucket,
      projectIdLength: projectId ? projectId.length : 0,
      clientEmailLength: clientEmail ? clientEmail.length : 0,
      privateKeyLength: privateKey ? privateKey.length : 0,
    };

    if (privateKey) {
      // Remove surrounding quotes if present (common issue with dotenv/env vars)
      if (privateKey.startsWith('"')) {
        privateKey = privateKey.slice(1);
      }
      if (privateKey.endsWith('"')) {
        privateKey = privateKey.slice(0, -1);
      }
      
      // Handle newlines - both escaped and literal
      privateKey = privateKey.replace(/\\n/g, '\n');
      diagnostics.privateKeyValid = /BEGIN PRIVATE KEY/.test(privateKey) && /END PRIVATE KEY/.test(privateKey);
    }

    const hasValidKey = Boolean(privateKey && /BEGIN PRIVATE KEY/.test(privateKey) && /END PRIVATE KEY/.test(privateKey));
    
    console.log('[Firebase Config] Initialization diagnostics:', {
      ...diagnostics,
      hasValidKey,
      timestamp: new Date().toISOString(),
    });

    if (projectId && clientEmail && hasValidKey && storageBucket) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket,
        });
        db = admin.firestore();
        auth = admin.auth();
        messaging = admin.messaging();
        firebaseInitialized = true;
        
        console.log('[Firebase] ✅ Successfully initialized');
        console.log(`[Firebase] Project: ${projectId}`);
        console.log(`[Firebase] Storage Bucket: ${storageBucket}`);
      } catch (initError) {
        console.error('[Firebase] ❌ Initialization error:', {
          code: initError.code,
          message: initError.message,
          details: initError,
        });
        // Do not throw, allow server to start without Firebase
      }
    } else {
      console.error('[Firebase] ❌ Missing or invalid credentials:');
      console.error('[Firebase] - ProjectId:', projectId ? '✓' : '✗');
      console.error('[Firebase] - ClientEmail:', clientEmail ? '✓' : '✗');
      console.error('[Firebase] - PrivateKey:', hasValidKey ? '✓' : '✗');
      console.error('[Firebase] - StorageBucket:', storageBucket ? '✓' : '✗');
      console.error('[Firebase]');
      console.error('[Firebase] Action Required:');
      console.error('[Firebase] 1. Get service account JSON from Firebase Console');
      console.error('[Firebase] 2. Set environment variables:');
      console.error('[Firebase]    - FIREBASE_PROJECT_ID');
      console.error('[Firebase]    - FIREBASE_CLIENT_EMAIL');
      console.error('[Firebase]    - FIREBASE_PRIVATE_KEY');
      console.error('[Firebase]    - FIREBASE_STORAGE_BUCKET');
      console.error('[Firebase] 3. Restart the server');
    }
  } else {
    console.log('[Firebase] Using existing Firebase app instance');
    db = admin.firestore();
    auth = admin.auth();
    messaging = admin.messaging();
    firebaseInitialized = true;
  }
} catch (error) {
  console.error('[Firebase] Unexpected initialization error:', error);
}

module.exports = { db, auth, messaging, firebaseInitialized };
