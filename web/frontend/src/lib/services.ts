import { collection, doc, getDoc, getDocs, query, where, runTransaction, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import app from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '@/lib/firebase';

const resolveBackendUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_VTU_BACKEND_URL;
  const envUrlLocal = process.env.NEXT_PUBLIC_VTU_BACKEND_URL_LOCAL;
  
  // LOGGING: Identify which URL is being used
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    console.log('[Backend Resolve] Current Host:', host);
    
    // Always use current origin for API calls if on Replit
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const url = envUrlLocal || envUrl || 'http://localhost:3001';
      console.log('[Backend Resolve] Using Local URL:', url);
      return url;
    }
  }
  
  const url = envUrl || 'https://asaforvtubackend.onrender.com';
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
  createdAt: any;
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
    console.warn('Backend announcements failed, using Firestore:', e);
    // Fallback: try Firestore
    try {
      const q = query(collection(db, 'announcements'), where('active', '==', true), limit(10));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
    } catch (error) {
      console.error('Error fetching announcements from Firestore:', error);
      return [];
    }
  }
};

export const createTicket = async (subject: string, message: string): Promise<{ success: boolean; message: string; ticketId?: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  try {
    const res = await fetch(`${backendUrl}/api/support/tickets/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ subject, message, email: auth.currentUser?.email }),
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
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
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
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
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
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
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
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

export const purchaseAirtimeViaCloud = async (
  userId: string,
  amount: number,
  details: { network: string; phone: string; provider: string }
): Promise<TransactionResult> => {
  const functions = getFunctions(app);
  const fn = httpsCallable(functions, 'purchaseAirtime');
  const res = await fn({ userId, amount, ...details });
  return res.data as TransactionResult;
};

export const getWalletBalance = async (token?: string): Promise<{ mainBalance: number; cashbackBalance: number; referralBalance: number } | null> => {
  const backendUrl = resolveBackendUrl();
  console.log('[API Request] Fetching wallet balance from:', `${backendUrl}/api/wallet`);
  
  try {
    const idToken = token || (auth.currentUser ? await auth.currentUser.getIdToken() : '');
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
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
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
  priceUser: number;
  priceApi?: number;
  metadata?: { variation_id?: string; networkId?: number };
}

export const getServicePlans = async (): Promise<ServicePlan[]> => {
  const backendUrl = resolveBackendUrl();
  try {
    const res = await fetch(`${backendUrl}/api/plans`, { method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch plans');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const purchaseAirtime = async (
  userId: string,
  amount: number,
  details: { network?: string; networkId?: number | string; phone: string }
): Promise<TransactionResult> => {
  const backendUrl = resolveBackendUrl();
  let token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const body = JSON.stringify({
    type: 'airtime',
    amount,
    details: {
      phone: details.phone,
      ...(details.networkId !== undefined ? { networkId: details.networkId } : {}),
      ...(details.network ? { network: details.network } : {}),
    },
  });

  let res = await fetch(`${backendUrl}/api/transactions/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  if (res.status === 401 && auth.currentUser) {
     try {
       console.log('Token expired, refreshing...');
       token = await auth.currentUser.getIdToken(true);
       res = await fetch(`${backendUrl}/api/transactions/purchase`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`,
         },
         body,
       });
     } catch (e) {
       console.error('Token refresh failed, forcing logout:', e);
       await auth.signOut();
       if (typeof window !== 'undefined') {
         window.location.href = '/login';
       }
       return { success: false, message: 'Session expired. Please log in again.' };
     }
   }
   
   if (res.status === 401) {
     console.error('Request failed with 401 after refresh, forcing logout');
     await auth.signOut();
     if (typeof window !== 'undefined') {
       window.location.href = '/login';
     }
     return { success: false, message: 'Session expired. Please log in again.' };
   }
 
   const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { success: false, message: (data && (data.error || data.message)) || 'Transaction failed' };
  }
  return { success: true, message: 'Airtime initiated' };
};

export const purchaseData = async (
  userId: string,
  amount: number,
  details: { planId: string; phone: string; network?: string; networkId?: number | string }
): Promise<TransactionResult> => {
  const backendUrl = resolveBackendUrl();
  let token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const body = JSON.stringify({
    type: 'data',
    amount,
    details: {
      planId: details.planId,
      phone: details.phone,
      ...(details.networkId !== undefined ? { networkId: details.networkId } : {}),
      ...(details.network ? { network: details.network } : {}),
    },
  });

  let res = await fetch(`${backendUrl}/api/transactions/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  if (res.status === 401 && auth.currentUser) {
     try {
       console.log('Token expired, refreshing...');
       token = await auth.currentUser.getIdToken(true);
       res = await fetch(`${backendUrl}/api/transactions/purchase`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`,
         },
         body,
       });
     } catch (e) {
       console.error('Token refresh failed, forcing logout:', e);
       await auth.signOut();
       if (typeof window !== 'undefined') {
         window.location.href = '/login';
       }
       return { success: false, message: 'Session expired. Please log in again.' };
     }
   }
   
   if (res.status === 401) {
     console.error('Request failed with 401 after refresh, forcing logout');
     await auth.signOut();
     if (typeof window !== 'undefined') {
       window.location.href = '/login';
     }
     return { success: false, message: 'Session expired. Please log in again.' };
   }
 
   const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { success: false, message: (data && (data.error || data.message)) || 'Transaction failed' };
  }
  return { success: true, message: 'Data initiated' };
};

export const processTransaction = async (
  userId: string,
  amount: number,
  type: 'cable' | 'electricity' | 'tv',
  details: Record<string, any>
): Promise<TransactionResult> => {
  const backendUrl = resolveBackendUrl();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const res = await fetch(`${backendUrl}/api/transactions/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      type,
      amount,
      details,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { success: false, message: (data && (data.error || data.message)) || 'Transaction failed' };
  }
  return { success: true, message: 'Transaction initiated' };
};


export const getServices = async (): Promise<ServiceDoc[]> => {
  try {
    // First try public backend API
    const backendUrl = resolveBackendUrl();
    const res = await fetch(`${backendUrl}/api/services`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.ok) {
      const services = await res.json();
      return Array.isArray(services) ? services : [];
    }
    
    // Fallback to Firestore if backend fails
    const col = collection(db, 'services');
    const snap = await getDocs(col);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ServiceDoc));
    }
  } catch (e) {
    console.error('Error fetching services:', e);
    // Try fallback to Firestore
    try {
      const col = collection(db, 'services');
      const snap = await getDocs(col);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ServiceDoc));
      }
    } catch (e2) {
      console.error('Error fetching services from Firestore fallback:', e2);
    }
  }
  return [];
};

export const getServiceBySlug = async (slug: string): Promise<ServiceDoc | null> => {
  try {
    const services = await getServices();
    const service = services.find(s => s.slug === slug || s.id === slug);
    return service || null;
  } catch (error) {
    console.error('Error fetching service by slug:', error);
    return null;
  }
};

export const getServiceById = async (id: string): Promise<ServiceDoc | null> => {
  const ref = doc(db, 'services', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as ServiceDoc;
};

export const initiateFunding = async (amount: number): Promise<{ tx_ref?: string; link?: string; error?: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  try {
    const res = await fetch(`${backendUrl}/api/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: (data && (data.error || data.message)) || 'Failed to initiate payment' };
    }
    return { tx_ref: data.tx_ref, link: data.link };
  } catch (e: any) {
    return { error: 'Network error contacting payment service. Please retry shortly.' };
  }
};

export const verifyFunding = async (tx_ref: string): Promise<{ success: boolean; message?: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const res = await fetch(`${backendUrl}/api/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ tx_ref }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { success: false, message: (data && (data.error || data.message)) || 'Verification failed' };
  }
  return { success: Boolean(data?.success), message: data?.message || (data?.success ? 'Wallet credited' : 'Not credited') };
};

export const transferWallet = async (amount: number, fromWalletType: 'cashback' | 'referral'): Promise<{ success: boolean; message?: string }> => {
  const backendUrl = resolveBackendUrl();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const res = await fetch(`${backendUrl}/api/wallet/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ amount, fromWalletType }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { success: false, message: (data && (data.error || data.message)) || 'Transfer failed' };
  }
  return { success: true, message: 'Transfer successful' };
};

export const getAdminSettings = async (): Promise<any> => {
  try {
    const backendUrl = resolveBackendUrl();
    const res = await fetch(`${backendUrl}/api/settings`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching settings:', e);
  }
  
  // Return default settings if backend fails
  return {
    airtimeNetworks: {
      MTN: { enabled: true, discount: 0 },
      Airtel: { enabled: true, discount: 0 },
      Glo: { enabled: true, discount: 0 },
      "9mobile": { enabled: true, discount: 0 }
    },
    systemStatus: 'online',
    announcementsEnabled: true
  };
};
