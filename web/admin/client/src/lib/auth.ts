const API_BASE_URL = import.meta.env.VITE_VTU_BACKEND_URL || 'https://vtuapi.ferixas.com';

interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: string;
  is_admin: boolean;
  email_verified: boolean;
  avatar_url?: string;
  wallet?: {
    main_balance: number;
    cashback_balance: number;
    referral_balance: number;
  };
}

interface LoginResponse {
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const loginAdmin = async (email: string, password: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    if (data.tokens) {
      localStorage.setItem('access_token', data.tokens.access_token);
      localStorage.setItem('refresh_token', data.tokens.refresh_token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data.user;
  } catch (error) {
    console.error('[Auth] Login error:', error);
    throw error;
  }
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('access_token');
  return !!token;
};

export const logout = (): void => {
  clearTokens();
};

export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.is_admin || user?.role === 'admin' || false;
};

export const getCurrentUser = (): User | null => {
  return getUser();
};

export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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

export default {
  loginAdmin,
  logout,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getUser,
  setUser,
  clearTokens,
  isAuthenticated,
  isAdmin,
  getCurrentUser,
  updateProfile,
  changePassword,
};
