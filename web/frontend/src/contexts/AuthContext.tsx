'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { UserProfile, SignUpData, LoginCredentials, AuthState, AuthContextType } from '@/types/auth';
import { signIn, signUp, signOut, getCurrentUser, isAuthenticated } from '@/lib/auth';

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

  const loadUserData = useCallback(async () => {
    console.log('[Auth] Loading user data...');
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setState(prev => ({ ...prev, user: null, loading: false, initialized: true }));
        return;
      }

      const user = await getCurrentUser();
      
      if (user) {
        // Fetch wallet balance from backend
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vtuapi.ferixas.com';
          const walletRes = await fetch(`${backendUrl}/api/wallet`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (walletRes.ok) {
            const walletData = await walletRes.json();
            user.walletBalance = walletData.main_balance;
            user.cashbackBalance = walletData.cashback_balance;
            user.referralBalance = walletData.referral_balance;
          }
        } catch (e) {
          console.warn('[Auth] Failed to fetch wallet balance:', e);
        }

        setState(prev => ({
          ...prev,
          user,
          loading: false,
          initialized: true,
          error: null
        }));
      } else {
        // Token invalid, clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setState(prev => ({ ...prev, user: null, loading: false, initialized: true }));
      }
    } catch (error: any) {
      console.error('[Auth] Critical loading error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Authentication failed',
        loading: false,
        initialized: true
      }));
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const login = async ({ email, password }: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await signIn(email, password);
      
      // Fetch wallet balance
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vtuapi.ferixas.com';
        const walletRes = await fetch(`${backendUrl}/api/wallet`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          user.walletBalance = walletData.main_balance;
          user.cashbackBalance = walletData.cashback_balance;
          user.referralBalance = walletData.referral_balance;
        }
      } catch (e) {
        console.warn('[Auth] Failed to fetch wallet balance after login:', e);
      }

      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null
      }));
      
      return user;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  const signUpFn = async (data: SignUpData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signUp(data);
      
      // Create user object from response
      const user: UserProfile = {
        uid: result.user.id,
        email: result.user.email,
        displayName: result.user.full_name,
        fullName: result.user.full_name,
        username: result.user.username,
        phone: result.user.phone,
        walletBalance: 0,
        referralBalance: 0,
        cashbackBalance: 0,
        accountStatus: 'active',
        isVerified: result.user.email_verified,
        emailVerified: result.user.email_verified,
        createdAt: result.user.created_at,
        updatedAt: result.user.created_at,
        metadata: {}
      };

      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null
      }));
      
      return result;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  const logoutFn = async () => {
    try {
      await signOut();
      setState(prev => ({ ...prev, user: null, loading: false, initialized: true }));
    } catch (error: any) {
      console.error('[Auth] Logout error:', error);
      // Still clear state even if logout fails
      setState(prev => ({ ...prev, user: null, loading: false, initialized: true }));
    }
  };

  const refreshUser = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    signIn: login,
    signUp: signUpFn,
    signOut: logoutFn,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
