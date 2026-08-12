const resolveBackendUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    console.log('[Backend Resolve] Current Host:', host);
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const url = envUrl || 'http://localhost:5000';
      console.log('[Backend Resolve] Using Local URL:', url);
      return url;
    }
  }
  
  const url = envUrl || 'https://vtuapi.ferixas.com';
  console.log('[Backend Resolve] Using Production URL:', url);
  return url;
};

// Announcement interface
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  created_at: string;
}

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const backendUrl = resolveBackendUrl();
  try {
    const res = await fetch(`${backendUrl}/api/announcements`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (Array.isArray(data)) return data as Announcement[];
    throw new Error('Invalid response');
  } catch (e) {
    console.error('Error fetching announcements:', e);
    return [];
  }
};

export const createTicket = async (subject: string, message: string): Promise<{ success: boolean; message: string; ticketId?: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = localStorage.getItem('access_token');
  try {
    const res = await fetch(`${backendUrl}/api/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ subject, category: 'general' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to create ticket');
    return { success: true, message: 'Ticket created successfully', ticketId: data.id };
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return { success: false, message: error?.message || 'Failed to create ticket' };
  }
};

export const replyToTicket = async (ticketId: string, message: string): Promise<{ success: boolean; message: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = localStorage.getItem('access_token');
  try {
    const res = await fetch(`${backendUrl}/api/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to send reply');
    return { success: true, message: 'Reply sent successfully' };
  } catch (error: any) {
    console.error('Error replying to ticket:', error);
    return { success: false, message: error?.message || 'Failed to send reply' };
  }
};

export const getTickets = async (): Promise<any[]> => {
  const backendUrl = resolveBackendUrl();
  const token = localStorage.getItem('access_token');
  try {
    const res = await fetch(`${backendUrl}/api/support/tickets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to fetch tickets');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
};

export const getTicketMessages = async (ticketId: string): Promise<any[]> => {
  const backendUrl = resolveBackendUrl();
  const token = localStorage.getItem('access_token');
  try {
    const res = await fetch(`${backendUrl}/api/support/tickets/${ticketId}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    return [];
  }
};

export interface ServiceDoc {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  icon?: string;
  enabled?: boolean;
  config?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

export const getWalletBalance = async (token?: string): Promise<{ main_balance: number; cashback_balance: number; referral_balance: number } | null> => {
  const backendUrl = resolveBackendUrl();
  console.log('[API Request] Fetching wallet balance from:', `${backendUrl}/api/wallet`);
  
  try {
    const idToken = token || localStorage.getItem('access_token');
    const res = await fetch(`${backendUrl}/api/wallet`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
    });

    if (!res.ok) {
      console.error('[API Error] Wallet balance fetch failed with status:', res.status);
      throw new Error(`Failed to fetch balance: ${res.status}`);
    }
    const data = await res.json();
    console.log('[API Success] Wallet balance received:', data);
    return data;
  } catch (error) {
    console.error('[API Network Error] getWalletBalance failed:', error);
    return null;
  }
};

export const getWalletHistory = async (): Promise<any[]> => {
  const backendUrl = resolveBackendUrl();
  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${backendUrl}/api/wallet/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to fetch wallet history');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Get Wallet History Error:', error);
    return [];
  }
};

export interface ServicePlan {
  id: string;
  network: string;
  name: string;
  price_user: number;
  price_api?: number;
  metadata?: { variation_id?: string; networkId?: number };
}

export const getServicePlans = async (): Promise<ServicePlan[]> => {
  const backendUrl = resolveBackendUrl();
  try {
    const res = await fetch(`${backendUrl}/api/plans`, { method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch service plans');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Get Service Plans Error:', error);
    return [];
  }
};

export const initiatePayment = async (amount: number): Promise<{ tx_ref: string; link: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = localStorage.getItem('access_token');
  
  try {
    const res = await fetch(`${backendUrl}/api/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ amount }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to initiate payment');
    }
    
    return await res.json();
  } catch (error: any) {
    console.error('Initiate Payment Error:', error);
    throw error;
  }
};

export const verifyPayment = async (tx_ref: string): Promise<{ success: boolean; message: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = localStorage.getItem('access_token');
  
  try {
    const res = await fetch(`${backendUrl}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ tx_ref }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to verify payment');
    }
    
    return await res.json();
  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    throw error;
  }
};

export const processTransaction = async (
  userId: string,
  amount: number,
  type: string,
  details: any
): Promise<TransactionResult> => {
  const backendUrl = resolveBackendUrl();
  const token = localStorage.getItem('access_token');
  
  try {
    const res = await fetch(`${backendUrl}/api/vtu/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ type, amount, details }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Transaction failed');
    }
    
    return await res.json();
  } catch (error: any) {
    console.error('Process Transaction Error:', error);
    throw error;
  }
};

export const getServices = async (): Promise<ServiceDoc[]> => {
  const backendUrl = resolveBackendUrl();
  try {
    const res = await fetch(`${backendUrl}/api/services`, { method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch services');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Get Services Error:', error);
    return [];
  }
};

export const transferToMain = async (amount: number, fromWalletType: 'cashback' | 'referral'): Promise<{ success: boolean; message: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = localStorage.getItem('access_token');
  
  try {
    const res = await fetch(`${backendUrl}/api/wallet/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ amount, fromWalletType }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Transfer failed');
    }
    
    return await res.json();
  } catch (error: any) {
    console.error('Transfer to Main Error:', error);
    throw error;
  }
};
