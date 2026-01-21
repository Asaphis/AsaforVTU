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

  // Load user data from Firestore
  const loadUserData = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        initialized: true,
      }));
      return;
    }

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        let userData = userDoc.data() as Omit<UserProfile, 'uid'>;

        // Ensure critical fields exist
        if (typeof userData.walletBalance === 'undefined') userData.walletBalance = 0;
        if (typeof userData.cashbackBalance === 'undefined') userData.cashbackBalance = 0;
        if (typeof userData.referralBalance === 'undefined') userData.referralBalance = 0;

        // Priority Sync: Try to get fresh data but don't crash if it fails
        try {
           const token = await firebaseUser.getIdToken();
           const backendBalances = await Promise.race([
             getWalletBalance(token),
             new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
           ]) as any;
           
           if (backendBalances) {
             userData.walletBalance = backendBalances.mainBalance;
             userData.cashbackBalance = backendBalances.cashbackBalance;
             userData.referralBalance = backendBalances.referralBalance;
           }
        } catch (err) {
           console.warn('Backend sync failed, using Firestore data:', err);
        }

        setState(prev => ({
          ...prev,
          user: { uid: firebaseUser.uid, ...userData },
          loading: false,
          initialized: true,
        }));
      } else {
        // Handle missing document case
        console.error('User document missing in Firestore for UID:', firebaseUser.uid);
        setState(prev => ({
          ...prev,
          error: 'User profile not found',
          loading: false,
          initialized: true,
        }));
      }
    } catch (error) {
      console.error('Critical failure in loadUserData:', error);
      setState(prev => ({
        ...prev,
        error: 'Authentication sync failed',
        loading: false,
        initialized: true,
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
      if (!userCredential.user.emailVerified) {
        throw new Error('Please verify your email.');
      }
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