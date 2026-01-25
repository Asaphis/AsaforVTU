const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let db, auth, messaging;
let firebaseInitialized = false;

try {
  // Check if firebase is already initialized to avoid errors
  if (!admin.apps.length) {
    // Sanitize env variables that may be pasted with quotes/commas from UIs
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey && storageBucket) {
      try {
        // Fix for private key newlines in production environments
        privateKey = privateKey.replace(/\\n/g, '\n');
        
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
      } catch (initError) {
        console.error('[Firebase] ❌ Initialization error:', initError);
      }
    } else {
      console.error('[Firebase] ❌ Missing required credentials');
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
