// JWT-based authentication for customer frontend
// Replaces Firebase client SDK

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vtuapi.ferixas.com';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    username: string;
    phone: string;
    role: string;
    email_verified: boolean;
    referral_code: string;
    avatar_url?: string;
    wallet?: {
      main_balance: number;
      cashback_balance: number;
      referral_balance: number;
    };
  };
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    username: string;
    phone: string;
    referral_code: string;
    email_verified: boolean;
    created_at: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  verification_token: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone: string;
  role: string;
  email_verified: boolean;
  referral_code: string;
  avatar_url?: string;
  wallet?: {
    main_balance: number;
    cashback_balance: number;
    referral_balance: number;
  };
}

// Client-side only helpers
const isClient = () => typeof window !== 'undefined';

// Store tokens in localStorage
const getAccessToken = (): string | null => {
  if (!isClient()) return null;
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  if (!isClient()) return null;
  return localStorage.getItem('refresh_token');
};

const setTokens = (accessToken: string, refreshToken: string): void => {
  if (!isClient()) return;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

const clearTokens = (): void => {
  if (!isClient()) return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Store user data
const getUser = (): User | null => {
  if (!isClient()) return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const setUser = (user: User): void => {
  if (!isClient()) return;
  localStorage.setItem('user', JSON.stringify(user));
};

// API request helper with auth
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 unauthorized - try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request with new token
      return apiRequest(endpoint, options);
    } else {
      // Refresh failed, logout
      logout();
      throw new Error('Session expired');
    }
  }

  return response;
};

// Register
export const signUp = async (userData: {
  email: string;
  password: string;
  full_name: string;
  username?: string;
  phone?: string;
  pin?: string;
  referral_code?: string;
}): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  const data: RegisterResponse = await response.json();
  
  // Store tokens and user
  setTokens(data.tokens.access_token, data.tokens.refresh_token);
  setUser(data.user);
  
  return data;
};

// Login
export const signIn = async (email: string, password: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data: LoginResponse = await response.json();
  
  // Check if email is verified
  if (!data.user.email_verified) {
    await logout();
    throw new Error('Please verify your email before signing in');
  }
  
  // Store tokens and user
  setTokens(data.tokens.access_token, data.tokens.refresh_token);
  setUser(data.user);
  
  return data.user;
};

// Refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    // Update access token
    if (isClient()) {
      localStorage.setItem('access_token', data.access_token);
    }
    
    return true;
  } catch (error) {
    console.error('[Auth] Token refresh failed:', error);
    return false;
  }
};

// Logout
export const signOut = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  
  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.error('[Auth] Logout request failed:', error);
    }
  }
  
  clearTokens();
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const user = getUser();
  if (user) {
    return user;
  }

  const token = getAccessToken();
  if (!token) {
    return null;
  }

  try {
    const response = await apiRequest('/api/auth/me');
    
    if (!response.ok) {
      return null;
    }

    const userData: User = await response.json();
    setUser(userData);
    return userData;
  } catch (error) {
    console.error('[Auth] Get current user failed:', error);
    return null;
  }
};

// Verify email
export const verifyEmail = async (token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Email verification failed');
  }
};

// Request password reset
export const resetPassword = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Password reset request failed');
  }
};

// Reset password with token
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Password reset failed');
  }
};

// Change password (for logged in users)
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const response = await apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Password change failed');
  }
};

// Update user profile
export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const response = await apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Profile update failed');
  }

  const updatedUser: User = await response.json();
  setUser(updatedUser);
  return updatedUser;
};

// Logout (alias for signOut)
export const logout = signOut;

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  isAuthenticated,
  verifyEmail,
  resetPassword,
  updateProfile,
  changePassword,
  apiRequest,
};
