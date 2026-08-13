// JWT-based authentication for admin panel
// Replaces Firebase client SDK

const API_BASE_URL = import.meta.env.VITE_VTU_BACKEND_URL || 'https://vtuapi.ferixas.com';

interface LoginResponse {
  user: {
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
  };
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

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

// Store tokens in localStorage
export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Store user data
export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const setUser = (user: User): void => {
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

// Login
export const loginAdmin = async (email: string, password: string): Promise<User> => {
  console.log('[loginAdmin] Attempting login for:', email);
  console.log('[loginAdmin] Backend URL:', API_BASE_URL);
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  console.log('[loginAdmin] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('[loginAdmin] Login failed:', error);
    throw new Error(error.error || 'Login failed');
  }

  const data: LoginResponse = await response.json();
  console.log('[loginAdmin] Login successful, user:', data.user);
  
  // Store tokens and user
  setTokens(data.tokens.access_token, data.tokens.refresh_token);
  setUser(data.user);
  
  console.log('[loginAdmin] Tokens stored in localStorage');
  
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
    localStorage.setItem('access_token', data.access_token);
    
    return true;
  } catch (error) {
    console.error('[Auth] Token refresh failed:', error);
    return false;
  }
};

// Logout
export const logout = async (): Promise<void> => {
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

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) return false;
  
  // Check if we have a valid user in localStorage
  const user = getUser();
  if (user) return true;
  
  // If no user data, try to fetch it
  try {
    const response = await apiRequest('/api/auth/me');
    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Auth] Token validation failed:', error);
    return false;
  }
};

// Check if user is admin
export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.is_admin || user?.role === 'admin' || false;
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

// Change password
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

export default {
  loginAdmin,
  logout,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  updateProfile,
  changePassword,
  apiRequest,
};
