"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import * as api from "../lib/liveApi";

type LiveAuthValue = { user: api.LiveUser | null; loading: boolean; refresh: () => Promise<void>; signIn: (email: string, password: string) => Promise<api.LiveUser>; signOut: () => Promise<void> };
const Context = createContext<LiveAuthValue | undefined>(undefined);

export const useLiveAuth = () => { const value = useContext(Context); if (!value) throw new Error("useLiveAuth must be used inside LiveAuthProvider"); return value; };

export function LiveAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.LiveUser | null>(null); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); try { setUser(await api.currentUser()); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const signIn = async (email: string, password: string) => { const next = await api.login(email, password); setUser(next); return next; };
  const signOut = async () => { setUser(null); await api.logout(); };
  return <Context.Provider value={{ user, loading, refresh, signIn, signOut }}>{children}</Context.Provider>;
}
