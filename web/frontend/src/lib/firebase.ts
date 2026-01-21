// lib/firebase.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Enhanced diagnostics
function validateFirebaseConfig() {
  const diagnostics = {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    storageBucket: !!firebaseConfig.storageBucket,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId,
  };

  const missingKeys = Object.entries(diagnostics)
    .filter(([_, present]) => !present)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error('[Firebase Config] ❌ Missing environment variables:', missingKeys);
    console.error('[Firebase Config] Expected variables in .env.local:');
    console.error('[Firebase Config]   - NEXT_PUBLIC_FIREBASE_API_KEY');
    console.error('[Firebase Config]   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    console.error('[Firebase Config]   - NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    console.error('[Firebase Config]   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    console.error('[Firebase Config]   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
    console.error('[Firebase Config]   - NEXT_PUBLIC_FIREBASE_APP_ID');
    return false;
  }

  console.log('[Firebase Config] ✅ All required environment variables present');
  return true;
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let initializationError: Error | null = null;

try {
  if (!validateFirebaseConfig()) {
    throw new Error('Firebase configuration incomplete. Check console for missing environment variables.');
  }

  app = initializeApp(firebaseConfig);
  console.log('[Firebase] ✅ App initialized');

  // Initialize auth with persistence
  try {
    auth = initializeAuth(app, {
      persistence: [browserLocalPersistence],
    });
    console.log('[Firebase] ✅ Auth initialized');
  } catch (authError) {
    console.error('[Firebase] ❌ Auth initialization error:', authError);
    // Fallback to getAuth if initializeAuth fails
    auth = getAuth(app);
  }

  db = getFirestore(app);
  console.log('[Firebase] ✅ Firestore initialized');

  storage = getStorage(app);
  console.log('[Firebase] ✅ Storage initialized');

} catch (error) {
  console.error('[Firebase] ❌ Initialization failed:', error);
  initializationError = error instanceof Error ? error : new Error(String(error));
  
  // Create dummy implementations to prevent crashes
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

/**
 * Check if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  return !initializationError && !!auth && !!db;
}

/**
 * Get initialization error if any
 */
export function getFirebaseError(): Error | null {
  return initializationError;
}

/**
 * Get user-friendly error message for Firebase errors
 */
export function getFirebaseErrorMessage(error: any): string {
  if (!error) return 'Unknown error';

  const code = error.code || error.message;

  // Handle common Firebase errors
  if (code?.includes('invalid-api-key')) {
    return 'Invalid Firebase API Key. Please check your environment configuration.';
  }
  if (code?.includes('auth/invalid-email')) {
    return 'Invalid email address.';
  }
  if (code?.includes('auth/weak-password')) {
    return 'Password is too weak. Use at least 6 characters.';
  }
  if (code?.includes('auth/email-already-in-use')) {
    return 'Email already registered.';
  }
  if (code?.includes('auth/user-not-found')) {
    return 'User not found.';
  }
  if (code?.includes('auth/wrong-password')) {
    return 'Incorrect password.';
  }
  if (code?.includes('permission-denied')) {
    return 'Permission denied. Check Firestore rules.';
  }
  if (code?.includes('network-request-failed')) {
    return 'Network error. Check your connection.';
  }

  return error.message || String(error);
}

export { app, auth, db, storage };
export default app;