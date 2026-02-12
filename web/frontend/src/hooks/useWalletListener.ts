'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getWalletBalance } from '@/lib/services';

interface WalletBalance {
  mainBalance: number;
  cashbackBalance: number;
  referralBalance: number;
}

export function useWalletListener(enabled = true) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWalletBalance();
      if (data) {
        setBalance({
          mainBalance: data.mainBalance ?? 0,
          cashbackBalance: data.cashbackBalance ?? 0,
          referralBalance: data.referralBalance ?? 0,
        });
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);
      setError(err.message || 'Failed to fetch wallet balance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately
    fetchBalance();

    // Set up polling every 10 seconds to detect admin credits
    pollInterval.current = setInterval(() => {
      fetchBalance();
    }, 10000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [enabled, fetchBalance]);

  const refresh = useCallback(() => {
    return fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refresh };
}
