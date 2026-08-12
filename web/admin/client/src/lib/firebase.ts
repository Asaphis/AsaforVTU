import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged as firebaseOnAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY || 'MISSING',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID,
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase admin init failed:", error);
  app = { auth: () => ({}), firestore: () => ({}) } as any;
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

export const signInAdmin = async (email: string, password: string) => {
  // Check if Firebase is properly configured
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'MISSING') {
    throw new Error('Firebase not configured. Please set VITE_FIREBASE_* environment variables.');
  }

  const allowed = (import.meta.env.VITE_ADMIN_EMAILS || 'asaphis.org@gmail.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  
  console.log('[Auth] Attempting sign in for:', email);
  console.log('[Auth] Allowed admin emails:', allowed);
  
  let cred: any;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('[Auth] Sign in failed:', error.code, error.message);
    if (error.code === 'auth/invalid-api-key') {
      throw new Error('Firebase API key is invalid. Check VITE_FIREBASE_API_KEY environment variable.');
    }
    if (error.code === 'auth/user-not-found') {
      throw new Error('User not found. Please check the email address.');
    }
    if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    }
    throw new Error(`Authentication failed: ${error.message}`);
  }
  
  const token = await cred.user.getIdTokenResult();
  const userEmail = (cred.user.email || '').toLowerCase();
  const isAdmin = Boolean(token.claims && (token.claims.admin === true)) || (userEmail && allowed.includes(userEmail));
  
  console.log('[Auth] User email:', userEmail);
  console.log('[Auth] Is admin from claims:', Boolean(token.claims && (token.claims.admin === true)));
  console.log('[Auth] Is admin from allowed list:', userEmail && allowed.includes(userEmail));
  console.log('[Auth] Final admin status:', isAdmin);
  
  if (!isAdmin) {
    await firebaseSignOut(auth);
    throw new Error(`Access denied: admin only. Your email (${userEmail}) is not in the allowed admin list: ${allowed.join(', ')}`);
  }
  return cred.user;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};
