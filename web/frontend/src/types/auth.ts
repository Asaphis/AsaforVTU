export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  username?: string;
  phone?: string;
  walletBalance?: number;
  referralBalance?: number;
  cashbackBalance?: number;
  accountStatus?: string;
  isVerified?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  username?: string;
  phone?: string;
  transactionPin?: string;
  referralCode?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (credentials: LoginCredentials) => Promise<UserProfile>;
  signUp: (data: SignUpData) => Promise<any>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
