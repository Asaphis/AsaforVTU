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
    if (!firebaseUser) {
      setState(prev => ({ ...prev, user: null, loading: false, initialized: true }));
      return;
    }

    try {
      if (!db) throw new Error('Firestore not initialized');

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<UserProfile, 'uid'>;
        
        // Final, "Correct" loading sequence:
        // 1. Load from Firestore
        // 2. Fetch fresh balance from backend
        // 3. Only then set state to initialized
        
        let finalUserData = { ...userData };
        try {
          const token = await firebaseUser.getIdToken();
          const backendBalances = await getWalletBalance(token);
          if (backendBalances) {
            finalUserData = {
              ...finalUserData,
              walletBalance: backendBalances.mainBalance,
              cashbackBalance: backendBalances.cashbackBalance,
              referralBalance: backendBalances.referralBalance,
            };
          }
        } catch (e) {
          console.error('[Auth] Backend sync failed:', e);
          // If backend fails, we still proceed with Firestore data to avoid blocking the user
        }

        setState(prev => ({
          ...prev,
          user: { uid: firebaseUser.uid, ...finalUserData },
          loading: false,
          initialized: true,
          error: null
        }));
      } else {
        throw new Error('User document not found in database');
      }
    } catch (error: any) {
      console.error('[Auth] Data load error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to sync user data',
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