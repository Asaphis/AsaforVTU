// Production customer API contract: preserves the existing Ferixas backend endpoints and token-refresh behavior.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://vtuapi.ferixas.com").replace(/\/$/, "");

export type LiveUser = {
  id: string; email: string; full_name: string; username: string; phone?: string; role?: string;
  is_admin?: boolean; email_verified: boolean; pin_set?: boolean; referral_code?: string;
  created_at?: string; wallet?: { main_balance: number; cashback_balance: number; referral_balance: number } | null;
};

export type Wallet = { main_balance: number; cashback_balance: number; referral_balance: number };
export type ServicePlan = { id: string; name: string; network?: string; network_key?: string; price_user: number; priceUser?: number; active?: boolean; is_active?: boolean; metadata?: Record<string, unknown> };
export type ServiceItem = { id: string; name: string; slug: string; category?: string; description?: string; enabled?: boolean; is_active?: boolean };

export class LiveApiError extends Error {
  code?: string; details: Record<string, unknown>;
  constructor(message: string, code?: string, details: Record<string, unknown> = {}) { super(message); this.name = "LiveApiError"; this.code = code; this.details = details; }
}

const inBrowser = () => typeof window !== "undefined";
const accessToken = () => inBrowser() ? localStorage.getItem("access_token") : null;
const refreshToken = () => inBrowser() ? localStorage.getItem("refresh_token") : null;
const persistTokens = (access: string, refresh: string) => { if (inBrowser()) { localStorage.setItem("access_token", access); localStorage.setItem("refresh_token", refresh); } };
export const clearSession = () => { if (inBrowser()) { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); localStorage.removeItem("user"); } };
const persistUser = (user: LiveUser) => { if (inBrowser()) localStorage.setItem("user", JSON.stringify(user)); };

const refreshAccessToken = async () => {
  const refresh = refreshToken();
  if (!refresh) return false;
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }), signal: AbortSignal.timeout(7000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) return false;
    localStorage.setItem("access_token", payload.access_token);
    return true;
  } catch { return false; }
};

export const apiRequest = async (path: string, init: RequestInit = {}, retry = true): Promise<Response> => {
  const form = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers: Record<string, string> = form ? {} : { "Content-Type": "application/json" };
  Object.entries(init.headers || {}).forEach(([key, value]) => { headers[key] = String(value); });
  const token = accessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });
  if (response.status === 401 && retry && !path.endsWith("/refresh")) {
    if (await refreshAccessToken()) return apiRequest(path, init, false);
    clearSession();
  }
  return response;
};

export const parse = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new LiveApiError(body.error || body.message || "Request failed", body.code, body);
  return body as T;
};

export const register = async (data: { full_name: string; username: string; phone: string; email: string; password: string; pin: string; referral_code?: string }) =>
  parse<{ user: LiveUser; verification_sent: boolean }>(await fetch(`${API_BASE}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));

export const login = async (email: string, password: string) => {
  const payload = await parse<{ user: LiveUser; tokens?: { access_token: string; refresh_token: string } }>(await fetch(`${API_BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }));
  if (!payload.user.email_verified) throw new LiveApiError("Please verify your email before signing in", "EMAIL_NOT_VERIFIED", payload as unknown as Record<string, unknown>);
  if (!payload.tokens?.access_token || !payload.tokens.refresh_token) throw new LiveApiError("The login response did not include a session", "INVALID_LOGIN_RESPONSE");
  persistTokens(payload.tokens.access_token, payload.tokens.refresh_token); persistUser(payload.user); return payload.user;
};

export const logout = async () => { const refresh = refreshToken(); clearSession(); if (!refresh) return; try { await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }), signal: AbortSignal.timeout(4000) }); } catch {} };
export const currentUser = async (): Promise<LiveUser | null> => { if (!accessToken()) return null; try { const user = await parse<LiveUser>(await apiRequest("/api/auth/me")); persistUser(user); return user; } catch { return null; } };
export const resendVerification = async (email: string) => parse(await fetch(`${API_BASE}/api/auth/resend-verification`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }));
export const requestReset = async (email: string) => parse(await fetch(`${API_BASE}/api/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }));
export const resetPassword = async (token: string, password: string) => parse(await fetch(`${API_BASE}/api/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, new_password: password }) }));

export const getWallet = () => parse<Wallet>(apiRequest("/api/wallet"));
export const getWalletHistory = () => parse<any[]>(apiRequest("/api/wallet/history"));
export const getTransactions = async () => { const payload = await parse<any>(apiRequest("/api/transactions")); return Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []); };
export const getAnnouncements = async () => { try { return await parse<any[]>(await apiRequest("/api/announcements")); } catch { return []; } };
export const getServices = async () => { try { return await parse<ServiceItem[]>(await apiRequest("/api/services")); } catch { return []; } };
export const getPlans = async () => { try { const plans = await parse<any[]>(await apiRequest("/api/plans")); return plans.map(plan => ({ ...plan, price_user: Number(plan.price_user ?? plan.priceUser ?? 0), priceUser: Number(plan.price_user ?? plan.priceUser ?? 0) })) as ServicePlan[]; } catch { return []; } };
export const initiateFunding = (amount: number) => parse<{ tx_ref: string; link: string }>(apiRequest("/api/payments/initiate", { method: "POST", body: JSON.stringify({ amount }) }));
export const verifyFunding = (tx_ref: string) => parse<{ success: boolean; message: string }>(apiRequest("/api/payments/verify", { method: "POST", body: JSON.stringify({ tx_ref }) }));
export const transferWallet = (amount: number, fromWalletType: "cashback" | "referral") => parse(apiRequest("/api/wallet/transfer", { method: "POST", body: JSON.stringify({ amount, fromWalletType }) }));
export const purchase = (type: string, amount: number, details: Record<string, unknown>) => parse<any>(apiRequest("/api/vtu/purchase", { method: "POST", body: JSON.stringify({ type, amount, details }) }));
export const verifyPin = async (pin: string) => (await apiRequest("/api/auth/verify-pin", { method: "POST", body: JSON.stringify({ pin }) })).ok;
export const updateProfile = (updates: Record<string, unknown>) => parse<LiveUser>(apiRequest("/api/auth/profile", { method: "PUT", body: JSON.stringify(updates) }));
export const changePassword = (current_password: string, new_password: string) => parse(apiRequest("/api/auth/change-password", { method: "POST", body: JSON.stringify({ current_password, new_password }) }));
export const changePin = (pin: string, confirm_pin: string) => parse(apiRequest("/api/auth/change-pin", { method: "POST", body: JSON.stringify({ pin, confirm_pin }) }));
export const getTickets = async () => { try { return await parse<any[]>(await apiRequest("/api/support/tickets")); } catch { return []; } };
export const getTicketMessages = async (ticketId: string) => { try { return await parse<any[]>(await apiRequest(`/api/support/tickets/${ticketId}/messages`)); } catch { return []; } };
const ticketForm = (values: Record<string, string>, attachments: File[]) => { const form = new FormData(); Object.entries(values).forEach(([key, value]) => form.append(key, value)); attachments.forEach(file => form.append("attachments", file)); return form; };
export const createTicket = (subject: string, message: string, attachments: File[] = []) => parse<any>(apiRequest("/api/support/tickets", { method: "POST", body: ticketForm({ subject, message, category: "general" }, attachments) }));
export const replyTicket = (ticketId: string, message: string, attachments: File[] = []) => parse<any>(apiRequest(`/api/support/tickets/${ticketId}/reply`, { method: "POST", body: ticketForm({ message }, attachments) }));
