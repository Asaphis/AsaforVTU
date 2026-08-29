// Production customer API contract: preserves the existing Ferixas backend endpoints and token-refresh behavior.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_VTU_BACKEND_URL || "https://vtuapi.ferixas.com").replace(/\/$/, "");
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 10 * 1000;
const ACCESS_TOKEN_MIN_RETRY_WINDOW_MS = 2 * 1000;

export type LiveUser = {
  id: string; email: string; full_name: string; username: string; phone?: string; role?: string;
  is_admin?: boolean; email_verified: boolean; pin_set?: boolean; referral_code?: string;
  created_at?: string; wallet?: { main_balance: number; cashback_balance: number; referral_balance: number } | null;
};

export type Wallet = { main_balance: number; cashback_balance: number; referral_balance: number };
export type ServicePlan = { id: string; name: string; network?: string; network_key?: string; price_user: number; priceUser?: number; active?: boolean; is_active?: boolean; metadata?: Record<string, unknown> };
export type ServiceItem = { id: string; name: string; slug: string; category?: string; description?: string; enabled?: boolean; is_active?: boolean };
export type LiveNotification = { id: string; title?: string; message?: string; type?: string; is_read?: boolean; created_at?: string; };

export class LiveApiError extends Error {
  code?: string; details: Record<string, unknown>;
  constructor(message: string, code?: string, details: Record<string, unknown> = {}) { super(message); this.name = "LiveApiError"; this.code = code; this.details = details; }
}

const inBrowser = () => typeof window !== "undefined";
const hasStorage = () => inBrowser() && typeof localStorage !== "undefined";
const accessToken = () => inBrowser() ? localStorage.getItem("access_token") : null;
const refreshToken = () => inBrowser() ? localStorage.getItem("refresh_token") : null;
const persistTokens = (access: string, refresh: string) => { if (inBrowser()) { localStorage.setItem("access_token", access); localStorage.setItem("refresh_token", refresh); } };
let refreshInFlight: Promise<boolean> | null = null;
let refreshTimer: ReturnType<typeof window.setTimeout> | null = null;
let autoRefreshBound = false;

const clearRefreshTimer = () => {
  if (refreshTimer && inBrowser()) {
    window.clearTimeout(refreshTimer);
  }
  refreshTimer = null;
};

export const clearSession = () => {
  if (inBrowser()) {
    clearRefreshTimer();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("asaforvtu-auth");
  }
};
const persistUser = (user: LiveUser) => { if (inBrowser()) localStorage.setItem("user", JSON.stringify(user)); };

const decodeJwtPayload = (token: string | null) => {
  if (!token || !inBrowser()) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
};

const getTokenExpiryMs = (token: string | null) => {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
};

const hasUsableAccessToken = (bufferMs = ACCESS_TOKEN_REFRESH_BUFFER_MS) => {
  const expiry = getTokenExpiryMs(accessToken());
  return Boolean(expiry && expiry - Date.now() > bufferMs);
};

const scheduleSessionRefresh = () => {
  if (!inBrowser()) return;
  clearRefreshTimer();

  const expiry = getTokenExpiryMs(accessToken());
  if (!expiry || !refreshToken()) return;

  const delay = Math.max(expiry - Date.now() - ACCESS_TOKEN_REFRESH_BUFFER_MS, ACCESS_TOKEN_MIN_RETRY_WINDOW_MS);
  refreshTimer = window.setTimeout(() => {
    void ensureSession(true).then((ready) => {
      if (!ready) clearSession();
    });
  }, delay);
};

const refreshAccessToken = async () => {
  if (refreshInFlight) return refreshInFlight;
  const refresh = refreshToken();
  if (!refresh) return false;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }), signal: AbortSignal.timeout(7000) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.access_token) return false;
      localStorage.setItem("access_token", payload.access_token);
      scheduleSessionRefresh();
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

export const ensureSession = async (forceRefresh = false) => {
  if (!hasStorage()) return false;
  if (!forceRefresh && hasUsableAccessToken()) {
    scheduleSessionRefresh();
    return true;
  }
  if (!refreshToken()) {
    return hasUsableAccessToken(0);
  }
  const refreshed = await refreshAccessToken();
  if (refreshed) {
    scheduleSessionRefresh();
    return true;
  }
  return false;
};

export const startSessionAutoRefresh = () => {
  if (!inBrowser() || autoRefreshBound) {
    if (inBrowser()) scheduleSessionRefresh();
    return;
  }

  const resume = () => { void ensureSession(); };
  window.addEventListener("focus", resume);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resume();
  });
  window.addEventListener("online", resume);
  autoRefreshBound = true;
  scheduleSessionRefresh();
};

export const initializeAuthSession = async () => {
  const ready = await ensureSession();
  if (ready) startSessionAutoRefresh();
  return ready;
};

export const apiRequest = async (path: string, init: RequestInit = {}, retry = true): Promise<Response> => {
  if (!path.endsWith("/refresh")) {
    await ensureSession();
  }
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

export const parse = async <T>(response: Response | Promise<Response>): Promise<T> => {
  const resolved = await response;
  const body = await resolved.json().catch(() => ({}));
  if (!resolved.ok) throw new LiveApiError(body.error || body.message || "Request failed", body.code, body);
  return body as T;
};

export const register = async (data: { full_name: string; username: string; phone: string; email: string; password: string; pin: string; referral_code?: string }) =>
  parse<{ user: LiveUser; verification_sent: boolean }>(await fetch(`${API_BASE}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));

export const login = async (email: string, password: string) => {
  const payload = await parse<{ user: LiveUser; tokens?: { access_token: string; refresh_token: string } }>(await fetch(`${API_BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }));
  if (!payload.user.email_verified) throw new LiveApiError("Please verify your email before signing in", "EMAIL_NOT_VERIFIED", payload as unknown as Record<string, unknown>);
  if (!payload.tokens?.access_token || !payload.tokens.refresh_token) throw new LiveApiError("The login response did not include a session", "INVALID_LOGIN_RESPONSE");
  persistTokens(payload.tokens.access_token, payload.tokens.refresh_token); persistUser(payload.user); startSessionAutoRefresh(); return payload.user;
};

export const logout = async () => { const refresh = refreshToken(); clearSession(); if (!refresh) return; try { await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }), signal: AbortSignal.timeout(4000) }); } catch {} };
export const currentUser = async (): Promise<LiveUser | null> => { if (!(await ensureSession())) return null; try { const payload = await parse<any>(await apiRequest("/api/auth/me")); const user = payload?.user || payload; if (!user?.id || !user?.email) throw new LiveApiError("The session response is invalid", "INVALID_SESSION_RESPONSE", payload); persistUser(user); return user as LiveUser; } catch { return null; } };
export const verifyEmail = async (token: string) => parse<{ success: boolean; message: string }>(await fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`, { cache: "no-store" }));
export const resendVerification = async (email: string) => parse(await fetch(`${API_BASE}/api/auth/resend-verification`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }));
export const requestReset = async (email: string) => parse(await fetch(`${API_BASE}/api/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }));
export const resetPassword = async (token: string, password: string) => parse(await fetch(`${API_BASE}/api/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, new_password: password }) }));

export const getWallet = () => parse<Wallet>(apiRequest("/api/wallet"));
export const getWalletHistory = () => parse<any[]>(apiRequest("/api/wallet/history"));
export const getTransactions = async () => { const payload = await parse<any>(apiRequest("/api/transactions")); return Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []); };
export const getAnnouncements = async () => { try { return await parse<any[]>(await apiRequest("/api/announcements")); } catch { return []; } };
export const getNotifications = async () => parse<LiveNotification[]>(apiRequest("/api/notifications?unreadOnly=false&limit=50"));
export const markNotificationRead = (id: string) => parse<LiveNotification>(apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }));
export const markAllNotificationsRead = () => parse<{ notifications: number }>(apiRequest("/api/notifications/read-all", { method: "POST" }));
export const getServices = async () => { try { return await parse<ServiceItem[]>(await apiRequest("/api/services")); } catch { return []; } };
export const getPlans = async () => { try { const plans = await parse<any[]>(await apiRequest("/api/plans")); return plans.map(plan => ({ ...plan, price_user: Number(plan.price_user ?? plan.priceUser ?? 0), priceUser: Number(plan.price_user ?? plan.priceUser ?? 0) })) as ServicePlan[]; } catch { return []; } };
export type FundingAccount = { id: string; bank_name: string; account_name: string; account_number: string; enabled?: boolean };
export type FundingOptions = { automated_enabled: boolean; manual: { bank_name: string; account_name: string; account_number: string; whatsapp_number: string; instructions: string; accounts: FundingAccount[] } };
export const getFundingOptions = () => parse<FundingOptions>(apiRequest("/api/payments/funding-options"));
export const initiateFunding = (amount: number) => parse<{ tx_ref: string; link: string }>(apiRequest("/api/payments/initiate", { method: "POST", body: JSON.stringify({ amount }) }));
export const verifyFunding = (tx_ref: string) => parse<{ success: boolean; message: string }>(apiRequest("/api/payments/verify", { method: "POST", body: JSON.stringify({ tx_ref }) }));
export const cancelFunding = (tx_ref: string) => parse<{ success: boolean; message: string }>(apiRequest("/api/payments/cancel", { method: "POST", body: JSON.stringify({ tx_ref }) }));
export const getReferralSummary = () => parse<any>(apiRequest("/api/referrals/me"));
export const transferWallet = (amount: number, fromWalletType: "cashback" | "referral") => parse(apiRequest("/api/wallet/transfer", { method: "POST", body: JSON.stringify({ amount, fromWalletType }) }));
export const purchase = (type: string, amount: number, details: Record<string, unknown>) => parse<any>(apiRequest("/api/vtu/purchase", { method: "POST", body: JSON.stringify({ type, amount, details }) }));
export const verifyPin = async (pin: string) => (await apiRequest("/api/auth/verify-pin", { method: "POST", body: JSON.stringify({ pin }) })).ok;
export const updateProfile = (updates: Record<string, unknown>) => parse<LiveUser>(apiRequest("/api/auth/profile", { method: "PUT", body: JSON.stringify(updates) }));
export const changePassword = (current_password: string, new_password: string) => parse(apiRequest("/api/auth/change-password", { method: "POST", body: JSON.stringify({ current_password, new_password }) }));
export const changePin = (current_pin: string, pin: string, confirm_pin: string) => parse(apiRequest("/api/auth/change-pin", { method: "POST", body: JSON.stringify({ current_pin, pin, confirm_pin }) }));
export const getTickets = async () => { try { return await parse<any[]>(await apiRequest("/api/support/tickets")); } catch { return []; } };
export const getTicketMessages = async (ticketId: string) => { try { return await parse<any[]>(await apiRequest(`/api/support/tickets/${ticketId}/messages`)); } catch { return []; } };
const ticketForm = (values: Record<string, string>, attachments: File[]) => { const form = new FormData(); Object.entries(values).forEach(([key, value]) => form.append(key, value)); attachments.forEach(file => form.append("attachments", file)); return form; };
export const createTicket = (subject: string, message: string, attachments: File[] = []) => parse<any>(apiRequest("/api/support/tickets", { method: "POST", body: ticketForm({ subject, message, category: "general" }, attachments) }));
export const replyTicket = (ticketId: string, message: string, attachments: File[] = []) => parse<any>(apiRequest(`/api/support/tickets/${ticketId}/reply`, { method: "POST", body: ticketForm({ message }, attachments) }));
