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
      // Step 1: Check if DB is initialized. If not, this is a config error.
      if (!db) {
        throw new Error('Database not initialized. Check Firebase configuration.');
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        let userData = userDoc.data() as Omit<UserProfile, 'uid'>;

        // Ensure critical fields exist with defaults
        if (typeof userData.walletBalance === 'undefined') userData.walletBalance = 0;
        if (typeof userData.cashbackBalance === 'undefined') userData.cashbackBalance = 0;
        if (typeof userData.referralBalance === 'undefined') userData.referralBalance = 0;

        // Step 2: Immediate state update so user can see dashboard
        setState(prev => ({
          ...prev,
          user: { uid: firebaseUser.uid, ...userData },
          loading: false,
          initialized: true,
          error: null,
        }));

        // Step 3: Background Sync (Non-blocking)
        try {
           const token = await firebaseUser.getIdToken();
           const backendBalances = await getWalletBalance(token);
           
           if (backendBalances) {
             const updatedData = {
               ...userData,
               walletBalance: backendBalances.mainBalance,
               cashbackBalance: backendBalances.cashbackBalance,
               referralBalance: backendBalances.referralBalance,
             };
             
             setState(prev => ({
               ...prev,
               user: { uid: firebaseUser.uid, ...updatedData },
             }));
           }
        } catch (err) {
           console.warn('[Auth] Background sync failed (harmless):', err);
        }
      } else {
        // Step 4: Handle new user or missing document
        console.warn('[Auth] User document missing, creating temporary profile');
        const tempUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          fullName: firebaseUser.displayName || '',
          username: firebaseUser.email?.split('@')[0] || '',
          phone: '',
          pinHash: '',
          walletBalance: 0,
          referralBalance: 0,
          cashbackBalance: 0,
          accountStatus: 'active',
          isVerified: firebaseUser.emailVerified,
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            creationTime: firebaseUser.metadata.creationTime || new Date().toISOString(),
            lastSignInTime: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
          }
        };

        setState(prev => ({
          ...prev,
          user: tempUser,
          loading: false,
          initialized: true,
          error: null,
        }));
      }
    } catch (error: any) {
      console.error('[Auth] Critical synchronization error:', error);
      
      // Check for specific Firebase configuration errors
      const errorMsg = error.message || '';
      if (errorMsg.includes('invalid-api-key') || errorMsg.includes('configuration-not-found')) {
        setState(prev => ({
          ...prev,
          error: 'Firebase Configuration Error: Please check your API keys.',
          loading: false,
          initialized: true,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Authentication sync failed. Please refresh the page.',
          loading: false,
          initialized: true,
        }));
      }
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