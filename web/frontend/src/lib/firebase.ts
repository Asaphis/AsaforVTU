// lib/firebase.ts
import { initializeApp, FirebaseApp, getApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
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

// Standard Initialization
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('[Firebase] Initialization Error:', error);
  // Re-throw if in production or handle gracefully in a way that's not mocking
  // For now, we allow the app to load but these will be undefined if initialization failed
  // We use casting to satisfy TypeScript while maintaining the "real" state
  app = (undefined as unknown) as FirebaseApp;
  auth = (undefined as unknown) as Auth;
  db = (undefined as unknown) as Firestore;
  storage = (undefined as unknown) as FirebaseStorage;
}

export { app, auth, db, storage };
export default app;