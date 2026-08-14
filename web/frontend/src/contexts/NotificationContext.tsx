'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'transaction' | 'wallet' | 'referral';
interface Notification { id: string; type: NotificationType; title: string; message: string; createdAt: string; serverBacked?: boolean; }
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, title: string, message?: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); return; }
    try {
      const response = await apiRequest('/api/notifications?unreadOnly=true&limit=50');
      if (!response.ok) return;
      const data = await response.json();
      setNotifications((Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        type: item.type || 'info',
        title: item.title,
        message: item.message,
        createdAt: item.created_at,
        serverBacked: true
      })));
    } catch (_) { /* notification failure must not block the dashboard */ }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
    if (!user) return;
    const timer = window.setInterval(() => { void loadNotifications(); }, 15000);
    return () => window.clearInterval(timer);
  }, [loadNotifications, user]);

  const addNotification = useCallback((type: NotificationType, title: string, message = '') => {
    const item: Notification = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`, type, title, message, createdAt: new Date().toISOString(), serverBacked: false };
    setNotifications(prev => [item, ...prev].slice(0, 50));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
    if (!id.startsWith('local-')) void apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    void apiRequest('/api/notifications/read-all', { method: 'POST' });
  }, []);

  return <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
