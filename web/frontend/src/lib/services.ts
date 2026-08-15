import { apiRequest } from '@/lib/auth';

export interface Announcement { id: string; title: string; content: string; priority?: string; target_audience?: string; created_at: string; }
export interface ServiceDoc { id: string; name: string; slug: string; category: string; description?: string; icon?: string; enabled?: boolean; is_active?: boolean; created_at?: string; updated_at?: string; }
export interface ServicePlan { id: string; service_id?: string; network: string; network_key?: string; networkKey?: string; name: string; type?: string; sub_type?: string; price_user: number; price_api?: number; priceUser?: number; priceApi?: number; is_active?: boolean; active?: boolean; metadata?: { variation_id?: string; networkId?: number; [key: string]: any }; }
export interface TransactionResult { success: boolean; status?: string; message: string; transactionId?: string; data?: any; }

const parse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || data?.message || 'Request failed');
  return data;
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  try { const data = await parse(await apiRequest('/api/announcements')); return Array.isArray(data) ? data : []; }
  catch (_) { return []; }
};

const supportForm = (fields: Record<string, string>, attachments: File[] = []) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  attachments.forEach(file => form.append('attachments', file));
  return form;
};

export const createTicket = async (subject: string, message: string, attachments: File[] = []): Promise<{ success: boolean; message: string; ticketId?: string }> => {
  try {
    const data = await parse(await apiRequest('/api/support/tickets', { method: 'POST', body: supportForm({ subject, message, category: 'general' }, attachments) }));
    return { success: true, message: 'Ticket created successfully', ticketId: data.id };
  } catch (error: any) { return { success: false, message: error.message || 'Failed to create ticket' }; }
};

export const replyToTicket = async (ticketId: string, message: string, attachments: File[] = []) => {
  try { await parse(await apiRequest(`/api/support/tickets/${ticketId}/reply`, { method: 'POST', body: supportForm({ message }, attachments) })); return { success: true, message: 'Reply sent successfully' }; }
  catch (error: any) { return { success: false, message: error.message || 'Failed to send reply' }; }
};
export const getTickets = async (): Promise<any[]> => { try { const data = await parse(await apiRequest('/api/support/tickets')); return Array.isArray(data) ? data : []; } catch (_) { return []; } };
export const getTicketMessages = async (ticketId: string): Promise<any[]> => { try { const data = await parse(await apiRequest(`/api/support/tickets/${ticketId}/messages`)); return Array.isArray(data) ? data : []; } catch (_) { return []; } };

export const getWalletBalance = async (): Promise<{ main_balance: number; cashback_balance: number; referral_balance: number } | null> => {
  try {
    const data = await parse(await apiRequest('/api/wallet'));
    return { main_balance: Number(data.main_balance || 0), cashback_balance: Number(data.cashback_balance || 0), referral_balance: Number(data.referral_balance || 0) };
  } catch (_) { return null; }
};
export const getWalletHistory = async (): Promise<any[]> => { try { const data = await parse(await apiRequest('/api/wallet/history')); return Array.isArray(data) ? data : []; } catch (_) { return []; } };

export const getServicePlans = async (): Promise<ServicePlan[]> => {
  try {
    const data = await parse(await apiRequest('/api/plans'));
    return (Array.isArray(data) ? data : []).map((plan: any) => ({ ...plan, price_user: Number(plan.price_user ?? plan.priceUser ?? 0), price_api: Number(plan.price_api ?? plan.priceApi ?? 0), priceUser: Number(plan.price_user ?? plan.priceUser ?? 0), priceApi: Number(plan.price_api ?? plan.priceApi ?? 0), active: Boolean(plan.is_active ?? plan.active) }));
  } catch (_) { return []; }
};

export const initiatePayment = async (amount: number): Promise<{ tx_ref: string; link: string; payment_id?: string }> => parse(await apiRequest('/api/payments/initiate', { method: 'POST', body: JSON.stringify({ amount }) }));
export const verifyPayment = async (tx_ref: string): Promise<{ success: boolean; message: string }> => parse(await apiRequest('/api/payments/verify', { method: 'POST', body: JSON.stringify({ tx_ref }) }));

export const processTransaction = async (_userId: string, amount: number, type: string, details: any): Promise<TransactionResult> => {
  return parse(await apiRequest('/api/vtu/purchase', { method: 'POST', body: JSON.stringify({ type, amount, details }) }));
};

export const getServices = async (): Promise<ServiceDoc[]> => {
  try {
    const data = await parse(await apiRequest('/api/services'));
    return (Array.isArray(data) ? data : []).map((service: any) => ({ ...service, enabled: Boolean(service.enabled ?? service.is_active), is_active: Boolean(service.is_active ?? service.enabled) }));
  } catch (_) { return []; }
};
export const transferToMain = async (amount: number, fromWalletType: 'cashback' | 'referral') => parse(await apiRequest('/api/wallet/transfer', { method: 'POST', body: JSON.stringify({ amount, fromWalletType }) }));
export const getAdminSettings = async (): Promise<any> => { try { return await parse(await apiRequest('/api/settings')); } catch (_) { return {}; } };

export const purchaseAirtime = async (userIdOrData: any, amount?: number, details?: any): Promise<TransactionResult> => {
  const payload = typeof userIdOrData === 'string' ? { userId: userIdOrData, amount: Number(amount), details: details || {} } : userIdOrData;
  return processTransaction(payload.userId || '', Number(payload.amount), 'airtime', payload.details || payload);
};
export const purchaseData = async (userIdOrData: any, amount?: number, details?: any): Promise<TransactionResult> => {
  const payload = typeof userIdOrData === 'string' ? { userId: userIdOrData, amount: Number(amount), details: details || {} } : userIdOrData;
  return processTransaction(payload.userId || '', Number(payload.amount), 'data', payload.details || payload);
};
export const purchaseCable = async (userIdOrData: any, amount?: number, details?: any): Promise<TransactionResult> => {
  const payload = typeof userIdOrData === 'string' ? { userId: userIdOrData, amount: Number(amount), details: details || {} } : userIdOrData;
  return processTransaction(payload.userId || '', Number(payload.amount), 'cable', payload.details || payload);
};
export const purchaseElectricity = async (userIdOrData: any, amount?: number, details?: any): Promise<TransactionResult> => {
  const payload = typeof userIdOrData === 'string' ? { userId: userIdOrData, amount: Number(amount), details: details || {} } : userIdOrData;
  return processTransaction(payload.userId || '', Number(payload.amount), 'electricity', payload.details || payload);
};

export const initiateFunding = initiatePayment;
export const transferWallet = transferToMain;
export const verifyFunding = verifyPayment;
export const getServiceBySlug = async (slug: string): Promise<ServiceDoc | null> => { try { return await parse(await apiRequest(`/api/services/${encodeURIComponent(slug)}`)); } catch (_) { return null; } };
