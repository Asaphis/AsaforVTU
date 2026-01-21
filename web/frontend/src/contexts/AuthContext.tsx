'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generateHash } from '@/lib/crypto';
import { getWalletBalance } from '@/lib/services';
import { UserProfile, SignUpData, LoginCredentials, AuthState, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    initialized: false,
  });

  const loadUserData = useCallback(async (firebaseUser: FirebaseUser | null) => {
    console.log('[Auth] loadUserData triggered. User:', firebaseUser?.uid || 'null');
    
    if (!firebaseUser) {
      setState(prev => ({ ...prev, user: null, loading: false, initialized: true }));
      return;
    }

    try {
      if (!db) {
        console.error('[Auth] Firestore (db) is null. Firebase failed to initialize.');
        throw new Error('Database connection failed. Please check your configuration.');
      }

      console.log('[Auth] Attempting to fetch user doc from Firestore...');
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<UserProfile, 'uid'>;
        console.log('[Auth] Firestore user data loaded successfully');
        
        let finalUserData = { ...userData };
        
        // Blocking fetch for fresh data to ensure accuracy, but with a timeout
        try {
          console.log('[Auth] Fetching fresh wallet balance from backend...');
          const token = await firebaseUser.getIdToken();
          
          const backendBalances = await Promise.race([
            getWalletBalance(token),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Backend Timeout')), 5000))
          ]) as any;

          if (backendBalances) {
            console.log('[Auth] Backend sync successful');
            finalUserData = {
              ...finalUserData,
              walletBalance: backendBalances.mainBalance,
              cashbackBalance: backendBalances.cashbackBalance,
              referralBalance: backendBalances.referralBalance,
            };
          }
        } catch (e: any) {
          console.warn('[Auth] Backend sync failed or timed out:', e.message);
          // Proceed with Firestore data if backend fails
        }

        setState(prev => ({
          ...prev,
          user: { uid: firebaseUser.uid, ...finalUserData },
          loading: false,
          initialized: true,
          error: null
        }));
      } else {
        console.error('[Auth] User document not found in Firestore for UID:', firebaseUser.uid);
        throw new Error('User account not found in database. Please contact support.');
      }
    } catch (error: any) {
      console.error('[Auth] Critical loading error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Synchronization failed',
        loading: false,
        initialized: true
      }));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadUserData(firebaseUser);
    });
    return () => unsubscribe();
  }, [loadUserData]);

  const signIn = async ({ email, password }: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await userCredential.user.reload();
      if (!userCredential.user.emailVerified) throw new Error('Please verify your email.');
      await loadUserData(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  const signUp = async (data: SignUpData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const pinHash = await generateHash(data.transactionPin);
      const userDoc: Omit<UserProfile, 'uid'> = {
        email: data.email,
        displayName: data.fullName,
        fullName: data.fullName,
        username: data.username,
        phone: data.phone,
        pinHash,
        walletBalance: 0,
        referralBalance: 0,
        cashbackBalance: 0,
        accountStatus: 'active',
        isVerified: false,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          creationTime: userCredential.user.metadata.creationTime || new Date().toISOString(),
          lastSignInTime: userCredential.user.metadata.lastSignInTime || new Date().toISOString(),
        }
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      await firebaseSendEmailVerification(userCredential.user);
      setState(prev => ({ ...prev, user: { uid: userCredential.user.uid, ...userDoc }, loading: false }));
      return userCredential.user;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setState(prev => ({ ...prev, user: null, error: null }));
  };

  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    signUp,
    signIn,
    signOut,
    resetPassword: async (email: string) => await firebaseSendPasswordResetEmail(auth, email),
    verifyEmail: async () => auth.currentUser && await firebaseSendEmailVerification(auth.currentUser),
    verifyTransactionPin: async (pin: string) => state.user ? (await generateHash(pin)) === state.user.pinHash : false,
    updateProfile: async (data: any) => {
      if (!auth.currentUser) return;
      const updates = { ...data, updatedAt: new Date().toISOString() };
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
      setState(prev => ({ ...prev, user: prev.user ? { ...prev.user, ...updates } : null }));
    },
    refreshUser: async () => auth.currentUser && await loadUserData(auth.currentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}