// lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if any of the required config values are missing
const isConfigValid = !!firebaseConfig.apiKey && 
                     !!firebaseConfig.projectId && 
                     firebaseConfig.apiKey !== 'MISSING_API_KEY';

let app: any;

try {
  if (!isConfigValid) {
    console.warn('Firebase configuration is missing or invalid. Check your environment variables.');
  }
  
  // Initialize Firebase
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback to avoid crashing
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // If it still fails, initialize with config anyway, 
    // it will throw descriptive errors later when used
    app = initializeApp(firebaseConfig);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;