const STORAGE = {
  access: 'asafor_admin_access_token',
  refresh: 'asafor_admin_refresh_token',
  user: 'asafor_admin_user',
};

const json = value => JSON.parse(JSON.stringify(value));
const number = value => Number(value || 0);
const displayName = record => record?.full_name || record?.displayName || record?.name || record?.username || record?.email?.split('@')[0] || 'Administrator';
const iso = value => value || new Date(0).toISOString();
const metadata = record => record?.metadata && typeof record.metadata === 'object' ? record.metadata : {};
const slugify = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function sessionFromUser(user, signedInAt = new Date().toISOString()) {
  return {
    id: user.id,
    name: displayName(user),
    email: user.email || '',
    phone: user.phone || '',
    role: user.role === 'admin' || user.is_admin ? 'Administrator' : (user.role || 'Administrator'),
    signedInAt,
  };
}

function getToken() { return sessionStorage.getItem(STORAGE.access) || ''; }
function getRefreshToken() { return sessionStorage.getItem(STORAGE.refresh) || ''; }
function getStoredSession() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE.user) || 'null'); }
  catch { clearSession(); return null; }
}
function persistSession(user, tokens, signedInAt) {
  if (tokens?.access_token) sessionStorage.setItem(STORAGE.access, tokens.access_token);
  if (tokens?.refresh_token) sessionStorage.setItem(STORAGE.refresh, tokens.refresh_token);
  const session = sessionFromUser(user, signedInAt);
  sessionStorage.setItem(STORAGE.user, JSON.stringify(session));
  return session;
}
function clearSession() {
  sessionStorage.removeItem(STORAGE.access);
  sessionStorage.removeItem(STORAGE.refresh);
  sessionStorage.removeItem(STORAGE.user);
}

async function refreshAccessToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return false;
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
    credentials: 'same-origin',
  });
  if (!response.ok) return false;
  const data = await response.json();
  if (!data?.access_token) return false;
  sessionStorage.setItem(STORAGE.access, data.access_token);
  return true;
}

async function request(path, { method = 'GET', body, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });
  if (response.status === 401 && retry && path !== '/api/auth/refresh') {
    if (await refreshAccessToken()) return request(path, { method, body, retry: false });
    clearSession();
    throw new Error('Your administrator session has expired. Please sign in again.');
  }
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text || response.statusText }; }
  if (!response.ok) throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  return data;
}

function mapUser(row) {
  return {
    id: row.id,
    name: displayName(row),
    email: row.email || '',
    phone: row.phone || '—',
    joined: iso(row.created_at),
    status: row.is_active === false ? 'suspended' : 'active',
    main: number(row.main_balance ?? row.main),
    cashback: number(row.cashback_balance ?? row.cashback),
    referral: number(row.referral_balance ?? row.referral),
    verified: Boolean(row.email_verified ?? row.verified),
  };
}

function mapTransaction(row) {
  const meta = metadata(row);
  const service = row.service_name || [row.plan_network, row.plan_name].filter(Boolean).join(' ') || row.type || 'Service transaction';
  return {
    id: row.id,
    reference: row.reference || row.tx_ref || row.provider_reference || row.id,
    userId: row.user_id || row.userId || row.user?.id || '',
    user: {
      id: row.user_id || row.userId || row.user?.id || '',
      name: displayName(row.user || row),
      email: row.email || row.user?.email || '',
    },
    type: row.type || 'transaction',
    service,
    amount: number(row.amount ?? row.userPrice),
    providerCost: number(row.provider_cost ?? row.providerCost ?? meta.provider_cost),
    smsCost: number(row.sms_cost ?? row.smsCost ?? meta.sms_cost),
    status: row.status || 'pending',
    channel: meta.channel || meta.source || row.payment_method || 'platform',
    createdAt: iso(row.created_at ?? row.createdAt),
    recipient: row.phone || row.smartcard_number || row.meter_number || '',
    failureSource: row.failure_source || row.failureSource || meta.failure_source || '',
    failureReason: row.failure_reason || row.failureReason || meta.failure_reason || '',
    providerRaw: meta.provider_response || meta.providerResponse || null,
  };
}

function mapPlan(row) {
  return {
    id: row.id,
    group: row.type || row.service_slug || 'other',
    network: row.network || row.network_key || '—',
    name: row.name || 'Unnamed plan',
    userPrice: number(row.priceUser ?? row.price_user),
    apiPrice: number(row.priceApi ?? row.price_api),
    active: Boolean(row.active ?? row.is_active),
    variation: row.networkKey || row.network_key || '',
    serviceId: row.serviceId || row.service_id,
    serviceSlug: row.service_slug || row.type || '',
  };
}

function mapService(row) {
  return {
    id: row.id,
    name: row.name || 'Unnamed service',
    slug: row.slug || '',
    category: row.category || 'General',
    active: Boolean(row.enabled ?? row.is_active ?? row.active),
  };
}

function mapTicket(row, messages = []) {
  return {
    id: row.id,
    userId: row.user_id,
    subject: row.subject || 'Support request',
    status: row.status || 'open',
    updatedAt: iso(row.updated_at ?? row.created_at),
    user: { id: row.user_id, name: displayName(row), email: row.email || '' },
    messages: messages.map(message => ({
      id: message.id,
      author: message.is_admin ? 'admin' : 'customer',
      text: message.message || '',
      createdAt: iso(message.created_at),
    })),
  };
}

function dateSeries(transactions) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    const next = new Date(date); next.setDate(date.getDate() + 1);
    const rows = transactions.filter(item => new Date(item.createdAt) >= date && new Date(item.createdAt) < next && item.status === 'success');
    const gross = rows.reduce((sum, item) => sum + item.amount, 0);
    const net = rows.reduce((sum, item) => sum + item.amount - item.providerCost - item.smsCost, 0);
    return { label: date.toLocaleDateString('en-US', { weekday: 'short' }), value: net, gross };
  });
}

async function listUsersRaw() { return request('/api/admin/users?limit=500'); }
async function listTransactionsRaw(filters = {}) {
  const params = new URLSearchParams({ limit: '500' });
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);
  return request(`/api/admin/transactions?${params}`);
}

export const api = {
  async login(email, password) {
    const result = await request('/api/auth/login', { method: 'POST', body: { email, password }, retry: false });
    if (!result?.tokens?.access_token || !result?.user) throw new Error('The sign-in service returned an invalid session.');
    if (!(result.user.is_admin || result.user.role === 'admin')) {
      clearSession();
      throw new Error('Administrator access is required for this dashboard.');
    }
    return persistSession(result.user, result.tokens);
  },
  getSession() { return getStoredSession(); },
  async logout() {
    const refresh_token = getRefreshToken();
    try { if (refresh_token) await request('/api/auth/logout', { method: 'POST', body: { refresh_token }, retry: false }); }
    finally { clearSession(); }
  },

  async getDashboard() {
    const [stats, txRows, deposits, tickets] = await Promise.all([
      request('/api/admin/stats'),
      listTransactionsRaw(),
      request('/api/admin/wallet/deposits'),
      request('/api/admin/support/tickets'),
    ]);
    const transactions = txRows.map(mapTransaction);
    const successful = transactions.filter(item => item.status === 'success');
    return {
      totalUsers: number(stats.totalUsers),
      wallet: number(stats.walletBalance),
      totalTransactions: number(stats.totalTransactions),
      todaySales: number(stats.todaySales),
      successRate: transactions.length ? Math.round((successful.length / transactions.length) * 1000) / 10 : 0,
      days: dateSeries(transactions).map(item => ({ label: item.label, value: item.gross })),
      recent: (stats.recentTransactions || []).map(mapTransaction),
      pendingFunding: (deposits || []).filter(item => ['pending', 'processing'].includes(String(item.status).toLowerCase())).length,
      openTickets: (tickets || []).filter(item => !['resolved', 'closed'].includes(String(item.status).toLowerCase())).length,
    };
  },

  async listUsers() { return (await listUsersRaw()).map(mapUser); },
  async getUser(id) {
    const [users, txRows, finance] = await Promise.all([
      listUsersRaw(),
      request(`/api/admin/users/transactions?uid=${encodeURIComponent(id)}`),
      request(`/api/admin/finance/analytics?uid=${encodeURIComponent(id)}`),
    ]);
    const user = mapUser((users || []).find(item => item.id === id) || {});
    if (!user.id) throw new Error('Customer not found.');
    const transactions = (txRows || []).map(mapTransaction);
    const totals = finance?.totals || {};
    return {
      ...user,
      transactions,
      finance: {
        deposits: number(totals.depositsTotal),
        providerCost: number(totals.providerCostTotal),
        smsCost: number(totals.smsCostTotal),
        netProfit: number(totals.netProfitTotal),
      },
      risk: { providerBalanceRequired: number(finance?.providerBalanceRequired), smsCost: number(totals.smsCostTotal), expectedProfit: number(totals.netProfitTotal) },
    };
  },
  async createUser(input) {
    const created = await request('/api/admin/users/create', { method: 'POST', body: { email: input.email, password: input.password, displayName: input.name, phoneNumber: input.phone, requireVerification: true } });
    const id = created?.user?.id || created?.uid;
    if (id) return this.getUser(id);
    return { id: '', name: input.name, email: input.email, phone: input.phone || '—', status: 'active', main: 0, cashback: 0, referral: 0, verified: false, joined: new Date().toISOString() };
  },
  async setUserStatus(id, active) {
    await request('/api/admin/users/suspend', { method: 'POST', body: { userId: id, suspend: !active } });
    return this.getUser(id);
  },
  async issueVerification(id) {
    return request('/api/admin/users/verification-link', { method: 'POST', body: { uid: id } });
  },
  async resetUserPassword(id) {
    const user = await this.getUser(id);
    return request('/api/auth/forgot-password', { method: 'POST', body: { email: user.email }, retry: false });
  },

  async listFunding() {
    const deposits = await request('/api/admin/wallet/deposits');
    return (deposits || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      user: { id: item.user_id, name: displayName(item), email: item.email || '' },
      amount: number(item.amount),
      method: item.payment_method || item.provider || 'payment',
      status: item.status || 'pending',
      createdAt: iso(item.created_at),
      reference: item.tx_ref || item.provider_reference || item.id,
    }));
  },
  async decideFunding(id, decision) {
    if (decision !== 'approved') throw new Error('Manual rejection is not available. Use the payment provider’s reversal process.');
    const funding = (await this.listFunding()).find(item => item.id === id);
    if (!funding) throw new Error('Funding record not found.');
    return request('/api/admin/wallet/reverify', { method: 'POST', body: { tx_ref: funding.reference, force: false } });
  },
  async adjustWallet(input) {
    const endpoint = input.action === 'debit' ? '/api/admin/wallet/debit' : '/api/admin/wallet/credit';
    await request(endpoint, { method: 'POST', body: { userId: input.userId, amount: number(input.amount), walletType: input.walletType || 'main', description: input.note } });
    return { user: await this.getUser(input.userId) };
  },
  async ghostWalletRepair(dryRun) {
    const result = await request('/api/admin/wallet/fix-ghosts', { method: 'POST', body: { dryRun: Boolean(dryRun) } });
    return { dryRun: Boolean(result.dryRun), candidates: number(result.total), repaired: number(result.fixed) };
  },

  async listTransactions(filters = {}) {
    const rows = (await listTransactionsRaw(filters)).map(mapTransaction);
    const search = String(filters.search || '').toLowerCase().trim();
    return search ? rows.filter(item => `${item.id} ${item.reference} ${item.type} ${item.service} ${item.user.name} ${item.user.email}`.toLowerCase().includes(search)) : rows;
  },
  async getTransaction(id) { return mapTransaction(await request(`/api/admin/transactions/${encodeURIComponent(id)}`)); },

  async listServices() { return (await request('/api/admin/services')).map(mapService); },
  async updateService(id, patch) { return mapService(await request(`/api/admin/services/${encodeURIComponent(id)}`, { method: 'PUT', body: { enabled: patch.active, ...patch } })); },
  async createService(input) {
    return mapService(await request('/api/admin/services', { method: 'POST', body: { name: input.name, slug: slugify(input.name), category: input.category, enabled: true } }));
  },
  async getSettings() {
    const raw = await request('/api/admin/settings');
    const airtime = raw.airtime_networks || raw.airtimeNetworks || {};
    const cashback = raw.cashback_settings || raw.cashbackSettings || {};
    const referral = raw.referral_settings || raw.referralSettings || {};
    return { airtimeNetworks: airtime, cashbackEnabled: Boolean(cashback.enabled), referralBudget: number(referral.daily_budget), referralCampaignStartAt: referral.campaign_start_at || '', referralCampaignEndAt: referral.campaign_end_at || '', webhook: '' };
  },
  async updateSettings(patch) {
    return request('/api/admin/settings', { method: 'POST', body: { cashbackEnabled: Boolean(patch.cashbackEnabled), dailyReferralBudget: number(patch.referralBudget), referralCampaignStartAt: patch.referralCampaignStartAt || null, referralCampaignEndAt: patch.referralCampaignEndAt || null, ...(patch.airtimeNetworks ? { airtimeNetworks: patch.airtimeNetworks } : {}) } });
  },
  async listNetworks() {
    const settings = await this.getSettings();
    return Object.entries(settings.airtimeNetworks || {}).map(([name, item]) => ({ name, discount: number(item?.discount), active: item?.enabled !== false }));
  },
  async updateNetwork(name, patch) {
    const settings = await this.getSettings();
    const airtimeNetworks = { ...(settings.airtimeNetworks || {}), [name]: { enabled: Boolean(patch.active), discount: number(patch.discount) } };
    await this.updateSettings({ ...settings, airtimeNetworks });
    return { name, discount: number(patch.discount), active: Boolean(patch.active) };
  },
  async listPlans(group) {
    const rows = (await request('/api/admin/plans')).map(mapPlan);
    return group ? rows.filter(item => item.group === group) : rows;
  },
  async updatePlan(id, patch) {
    return mapPlan(await request(`/api/admin/plans/${encodeURIComponent(id)}`, { method: 'PUT', body: { network: patch.network, name: patch.name, priceUser: number(patch.userPrice), priceApi: number(patch.apiPrice), networkKey: patch.variation } }));
  },
  async createPlan(input) {
    const services = await this.listServices();
    const service = services.find(item => item.slug === input.group || item.slug === `${input.group}-pins`) || services.find(item => item.category?.toLowerCase().includes(input.group));
    if (!service) throw new Error('Create the matching service category before adding its plan.');
    return mapPlan(await request('/api/admin/plans', { method: 'POST', body: { serviceId: service.id, type: input.group, network: input.network, name: input.name, priceUser: number(input.userPrice), priceApi: number(input.apiPrice), metadata: { variation: input.variation } } }));
  },
  async syncPlans() { throw new Error('Provider plan synchronisation is not enabled by the backend. No changes were made.'); },

  async getFinance(filters = {}) {
    const query = new URLSearchParams();
    if (filters.userId) query.set('uid', filters.userId);
    const raw = await request(`/api/admin/finance/analytics${query.toString() ? `?${query}` : ''}`);
    const transactions = (raw.transactions || []).map(mapTransaction);
    const totals = raw.totals || {};
    const period = [
      ['day', raw.daily], ['week', raw.weekly], ['month', raw.monthly],
    ].map(([label, item]) => ({ label, deposits: number(item?.deposits), providerCost: number(item?.providerCost), smsCost: number(item?.smsCost), netProfit: number(item?.netProfit), transactionCount: label === 'month' ? transactions.length : 0 }));
    const users = filters.userId ? await this.listUsers() : [];
    const user = filters.userId ? users.find(item => item.id === filters.userId) || null : null;
    const plans = user ? (await this.listPlans()).filter(item => item.active) : [];
    return {
      scope: user ? 'customer' : 'system',
      user,
      walletBalance: number(raw.walletBalance),
      totalWalletBalance: number(raw.totalWalletBalance),
      providerBalanceRequired: number(raw.providerBalanceRequired),
      totals: { deposits: number(totals.depositsTotal), providerCost: number(totals.providerCostTotal), smsCost: number(totals.smsCostTotal), netProfit: number(totals.netProfitTotal) },
      period,
      transactions,
      dateSeries: dateSeries(transactions),
      capacity: user ? plans.map(item => ({ service: `${item.network} ${item.name}`, apiPrice: item.apiPrice, capacity: item.apiPrice > 0 ? Math.floor(number(raw.walletBalance) / item.apiPrice) : 0 })) : [],
      customerFinance: user ? { walletBalance: number(raw.walletBalance), totalDeposited: number(totals.depositsTotal), totalSpent: number(totals.depositsTotal), totalProviderCost: number(totals.providerCostTotal), totalSmsCost: number(totals.smsCostTotal), netProfit: number(totals.netProfitTotal), risk: { providerBalanceRequired: number(raw.providerBalanceRequired), smsCost: number(totals.smsCostTotal), expectedProfit: number(totals.netProfitTotal) } } : null,
    };
  },

  async listTickets() { return (await request('/api/admin/support/tickets')).map(row => mapTicket(row)); },
  async getTicket(id) {
    const tickets = await request('/api/admin/support/tickets');
    const ticket = tickets.find(item => item.id === id);
    if (!ticket) throw new Error('Support ticket not found.');
    const messages = await request(`/api/admin/support/tickets/${encodeURIComponent(id)}/messages`);
    return mapTicket(ticket, messages || []);
  },
  async replyTicket(id, message) { return request(`/api/admin/support/tickets/${encodeURIComponent(id)}/reply`, { method: 'POST', body: { message } }); },
  async updateTicket(id, status) { return request(`/api/admin/support/tickets/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status } }); },
  async deleteTicket(id) { return request(`/api/admin/support/tickets/${encodeURIComponent(id)}/delete`, { method: 'POST' }); },
  async listAnnouncements() {
    const rows = await request('/api/admin/announcements');
    return rows.map(item => ({ id: item.id, title: item.title, content: item.content, type: item.priority === 'warning' ? 'warning' : 'info', createdAt: iso(item.created_at) }));
  },
  async createAnnouncement(input) { return request('/api/admin/announcements', { method: 'POST', body: { title: input.title, content: input.content, priority: input.type === 'warning' ? 'warning' : 'info' } }); },
  async deleteAnnouncement(id) { return request(`/api/admin/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' }); },

  async reconcile(reference, force = false) {
    const result = await request('/api/admin/payments/reconcile', { method: 'POST', body: { tx_ref: reference, force: Boolean(force) } });
    return { success: Boolean(result?.success ?? true), message: result?.message || 'Payment reconciliation completed.' };
  },
  async listAdmins() {
    const rows = await request('/api/admin/admins');
    return rows.map(item => ({ id: item.id, name: displayName(item), email: item.email || '', role: item.role || 'Administrator', status: 'active' }));
  },
  async createAdmin(input) {
    const result = await request('/api/admin/admins', { method: 'POST', body: { email: input.email, password: input.password, full_name: input.name } });
    const user = result.user || result;
    return { id: user.id, name: displayName(user), email: user.email, role: user.role || 'Administrator', status: 'active' };
  },
  async listAudit() { return request('/api/admin/audit'); },
  async updateProfile(patch) {
    const current = getStoredSession();
    const updated = await request('/api/admin/profile/update', { method: 'POST', body: { full_name: patch.name, username: patch.name, phone: patch.phone } });
    return persistSession({ ...current, ...updated, full_name: updated.full_name || patch.name, phone: updated.phone || patch.phone }, null, current?.signedInAt);
  },
  async changePassword(currentPassword, newPassword) {
    return request('/api/admin/profile/password', { method: 'POST', body: { current_password: currentPassword, new_password: newPassword } });
  },
};
