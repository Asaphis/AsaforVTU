const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://vtuapi.ferixas.com').replace(/\/$/, '');

export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone: string;
  role: string;
  is_admin?: boolean;
  email_verified: boolean;
  pin_set?: boolean;
  referral_code: string;
  avatar_url?: string;
  created_at?: string;
  wallet?: { main_balance: number; cashback_balance: number; referral_balance: number } | null;
}

interface LoginResponse { user: User; tokens: { access_token: string; refresh_token: string } }
export interface RegisterResponse { user: User; verification_sent: boolean }
export class AuthApiError extends Error {
  code?: string;
  details?: Record<string, unknown>;
  constructor(message: string, code?: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.details = details;
  }
}

const isClient = () => typeof window !== 'undefined';
const getAccessToken = () => isClient() ? localStorage.getItem('access_token') : null;
const getRefreshToken = () => isClient() ? localStorage.getItem('refresh_token') : null;
const setTokens = (accessToken: string, refreshToken: string) => {
  if (!isClient()) return;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};
export const clearTokens = () => {
  if (!isClient()) return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};
const getStoredUser = (): User | null => {
  if (!isClient()) return null;
  try {
    const value = localStorage.getItem('user');
    return value ? JSON.parse(value) : null;
  } catch (_) {
    localStorage.removeItem('user');
    return null;
  }
};
const setUser = (user: User) => { if (isClient()) localStorage.setItem('user', JSON.stringify(user)); };

const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (!data.access_token) return false;
    if (isClient()) localStorage.setItem('access_token', data.access_token);
    return true;
  } catch (_) { return false; }
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}, retry = true): Promise<Response> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  Object.entries(options.headers || {}).forEach(([key, value]) => { headers[key] = String(value); });
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (response.status === 401 && retry && !endpoint.endsWith('/refresh')) {
    if (await refreshAccessToken()) return apiRequest(endpoint, options, false);
    clearTokens();
  }
  return response;
};

export const signUp = async (userData: {
  email: string; password: string; full_name: string; username?: string; phone?: string; pin?: string; referral_code?: string;
}): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AuthApiError(data.error || 'Registration failed', data.code, data);
  // Registration intentionally does not create an authenticated browser session.
  return data as RegisterResponse;
};

export const signIn = async (email: string, password: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AuthApiError(data.error || 'Login failed', data.code, data);
  if (!data.user?.email_verified) throw new AuthApiError('Please verify your email before signing in', 'EMAIL_NOT_VERIFIED', data);
  setTokens(data.tokens.access_token, data.tokens.refresh_token);
  setUser(data.user);
  return data.user;
};

export const signOut = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  clearTokens();
  if (!refreshToken) return;
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }), signal: AbortSignal.timeout(3000)
    });
  } catch (_) {
    // Local state is already cleared; network failure must never strand logout navigation.
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!getAccessToken()) return null;
  try {
    const response = await apiRequest('/api/auth/me');
    if (!response.ok) { clearTokens(); return null; }
    const user = await response.json() as User;
    setUser(user);
    return user;
  } catch (_) {
    return getStoredUser();
  }
};

export const verifyEmail = async (token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Email verification failed');
};

export const resendVerification = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not resend verification email');
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Password reset request failed');
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, new_password: newPassword })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Password reset failed');
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  const response = await apiRequest('/api/auth/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) });
  return response.ok;
};

export const changePin = async (pin: string, confirmPin: string): Promise<void> => {
  const response = await apiRequest('/api/auth/change-pin', { method: 'POST', body: JSON.stringify({ pin, confirm_pin: confirmPin }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'PIN change failed');
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const response = await apiRequest('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Password change failed');
};

export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const response = await apiRequest('/api/auth/profile', { method: 'PUT', body: JSON.stringify(updates) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Profile update failed');
  const updatedUser = { ...(getStoredUser() || {}), ...data } as User;
  setUser(updatedUser);
  return updatedUser;
};

export const logout = signOut;
export const isAuthenticated = () => Boolean(getAccessToken());

export default { signUp, signIn, signOut, logout, getCurrentUser, isAuthenticated, verifyEmail, resendVerification, requestPasswordReset, resetPassword, verifyPin, changePin, updateProfile, changePassword, apiRequest };
