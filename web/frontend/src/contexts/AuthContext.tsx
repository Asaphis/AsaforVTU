'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { UserProfile, SignUpData, LoginCredentials, AuthState, AuthContextType } from '@/types/auth';
import { User as ApiUser, signIn, signUp, signOut, getCurrentUser, apiRequest, requestPasswordReset, resetPassword } from '@/lib/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

const toProfile = (user: ApiUser): UserProfile => ({
  uid: user.id,
  email: user.email,
  displayName: user.full_name,
  fullName: user.full_name,
  username: user.username,
  phone: user.phone,
  walletBalance: Number(user.wallet?.main_balance || 0),
  referralBalance: Number(user.wallet?.referral_balance || 0),
  cashbackBalance: Number(user.wallet?.cashback_balance || 0),
  accountStatus: 'active',
  isVerified: Boolean(user.email_verified),
  emailVerified: Boolean(user.email_verified),
  createdAt: user.created_at,
  updatedAt: user.created_at,
  metadata: { role: user.role, is_admin: user.is_admin, pin_set: user.pin_set }
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null, initialized: false });

  const loadUserData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setState(prev => ({ ...prev, user: null, loading: false, initialized: true, error: null }));
        return;
      }
      const profile = toProfile(user);
      try {
        const response = await apiRequest('/api/wallet');
        if (response.ok) {
          const wallet = await response.json();
          profile.walletBalance = Number(wallet.main_balance || 0);
          profile.cashbackBalance = Number(wallet.cashback_balance || 0);
          profile.referralBalance = Number(wallet.referral_balance || 0);
        }
      } catch (_) { /* stale wallet values remain usable until the next refresh */ }
      setState(prev => ({ ...prev, user: profile, loading: false, initialized: true, error: null }));
    } catch (error: any) {
      setState(prev => ({ ...prev, user: null, loading: false, initialized: true, error: error?.message || 'Authentication failed' }));
    }
  }, []);

  useEffect(() => { void loadUserData(); }, [loadUserData]);

  const login = async ({ email, password }: LoginCredentials): Promise<UserProfile> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const profile = toProfile(await signIn(email, password));
      setState(prev => ({ ...prev, user: profile, loading: false, initialized: true, error: null }));
      return profile;
    } catch (error: any) {
      setState(prev => ({ ...prev, user: null, loading: false, error: error?.message || 'Login failed' }));
      throw error;
    }
  };

  const signUpFn = async (data: SignUpData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        username: data.username,
        phone: data.phone,
        pin: data.transactionPin,
        referral_code: data.referralCode || data.referralUsername
      });
      setState(prev => ({ ...prev, user: null, loading: false, initialized: true, error: null }));
      return result;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error?.message || 'Registration failed' }));
      throw error;
    }
  };

  const logoutFn = async () => {
    setState(prev => ({ ...prev, user: null, loading: false, initialized: true, error: null }));
    await signOut();
  };

  const refreshUser = useCallback(async () => { await loadUserData(); }, [loadUserData]);
  const requestPasswordResetFn = async (email: string) => { await requestPasswordReset(email); };
  const resetPasswordFn = async (token: string, newPassword: string) => { await resetPassword(token, newPassword); };

  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    signIn: login,
    signUp: signUpFn,
    signOut: logoutFn,
    refreshUser,
    resetPassword: resetPasswordFn,
    requestPasswordReset: requestPasswordResetFn
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
