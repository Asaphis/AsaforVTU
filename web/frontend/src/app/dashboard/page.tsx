'use client';

/* Ferixas operational canvas: navy balance surfaces, warm paper workspace, compact data-first cards. */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Smartphone, Wifi, Tv, Zap, GraduationCap, Eye, EyeOff, ChevronLeft, ChevronRight,
  Pause, Play, Megaphone, ArrowUpRight, WalletCards, Receipt, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletHistory, getWalletBalance, getAnnouncements, transferToMain } from '@/lib/services';
import { useNotifications } from '@/contexts/NotificationContext';

const naira = (value: number) => `₦${Number(value || 0).toLocaleString()}`;

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, initialized, refreshUser } = useAuth();
  const { addNotification } = useNotifications();
  const [showMain, setShowMain] = useState(true);
  const [showCashback, setShowCashback] = useState(true);
  const [showReferral, setShowReferral] = useState(true);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [walletBalance, setWalletBalance] = useState<any>(null);

  const nextAnnouncement = useCallback(() => {
    setAnnouncements((current) => {
      if (current.length > 1) setCurrentAnnIndex((index) => (index + 1) % current.length);
      return current;
    });
  }, []);

  const prevAnnouncement = useCallback(() => {
    setAnnouncements((current) => {
      if (current.length > 1) setCurrentAnnIndex((index) => (index - 1 + current.length) % current.length);
      return current;
    });
  }, []);

  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;
    const timer = setInterval(nextAnnouncement, 6000);
    return () => clearInterval(timer);
  }, [announcements.length, isPaused, nextAnnouncement]);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await getAnnouncements();
        setAnnouncements(data
          .filter((announcement: any) => announcement.is_active !== false)
          .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 3));
      } catch (error) {
        console.error('Announcements load failed', error);
      }
    };
    if (!user) return;
    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!initialized || loading) return;
    if (user && !user.emailVerified) router.push('/verify');
    setShowMain(sessionStorage.getItem('showMainBalance') === 'true');
    setShowCashback(sessionStorage.getItem('showCashbackBalance') === 'true');
    setShowReferral(sessionStorage.getItem('showReferralBalance') === 'true');
  }, [initialized, user, loading, router]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      try {
        const balance = await getWalletBalance();
        if (balance) setWalletBalance(balance);
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };
    if (!user) return;
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const loadRecent = async () => {
      if (!user) return;
      try {
        setRecent((await getWalletHistory()).slice(0, 5));
      } catch (error) {
        console.error('Recent history load failed', error);
      }
    };
    loadRecent();
  }, [user]);

  const handleWithdraw = async (type: 'referral' | 'cashback') => {
    if (!user || processingWithdrawal) return;
    const amount = type === 'referral' ? (walletBalance?.referral_balance ?? 0) : (walletBalance?.cashback_balance ?? 0);
    if (amount <= 0) {
      addNotification('warning', 'Insufficient balance', 'No funds are available to transfer.');
      return;
    }
    if (!confirm(`Transfer ${naira(amount)} to your main wallet?`)) return;
    setProcessingWithdrawal(true);
    try {
      await transferToMain(amount, type);
      addNotification('success', 'Transfer complete', `${naira(amount)} moved to your main wallet.`);
      await refreshUser();
      const balance = await getWalletBalance();
      if (balance) setWalletBalance(balance);
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      addNotification('error', 'Transfer failed', error.message || 'Please try again.');
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  const setVisibility = (which: 'main' | 'cashback' | 'referral', value: boolean) => {
    const stateSetters = { main: setShowMain, cashback: setShowCashback, referral: setShowReferral };
    stateSetters[which](value);
    sessionStorage.setItem(`show${which.charAt(0).toUpperCase()}${which.slice(1)}Balance`, String(value));
  };

  if (loading || !user) {
    return <div className="space-y-5 animate-pulse"><div className="h-8 w-44 rounded bg-[#E8EDF2]" /><div className="h-52 rounded-[26px] bg-[#E8EDF2]" /><div className="grid gap-4 md:grid-cols-2"><div className="h-44 rounded-2xl bg-[#E8EDF2]" /><div className="h-44 rounded-2xl bg-[#E8EDF2]" /></div></div>;
  }

  const mainBalance = walletBalance?.main_balance ?? user.walletBalance ?? 0;
  const cashbackBalance = walletBalance?.cashback_balance ?? user.cashbackBalance ?? 0;
  const referralBalance = walletBalance?.referral_balance ?? user.referralBalance ?? 0;
  const actions = [
    { icon: Smartphone, label: 'Airtime', href: '/dashboard/services/airtime', tone: 'bg-[#036A97]' },
    { icon: Wifi, label: 'Data', href: '/dashboard/services/data', tone: 'bg-[#0291C0]' },
    { icon: Tv, label: 'Cable TV', href: '/dashboard/services/cable', tone: 'bg-[#D69B04]' },
    { icon: Zap, label: 'Electricity', href: '/dashboard/services/electricity', tone: 'bg-[#99BC0D]' },
    { icon: GraduationCap, label: 'Exam PINs', href: '/dashboard/services/exam-pins', tone: 'bg-[#012044]' },
  ];

  return (
    <main className="space-y-5 pb-24 lg:pb-8">
      <section className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">AsaforVTU workspace</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#012044]">Good to see you, {user.fullName?.split(' ')[0] || 'there'}.</h1>
        </div>
        <Link href="/dashboard/transactions" className="inline-flex items-center gap-1 self-start text-sm font-bold text-[#036A97] transition hover:text-[#012044] sm:self-auto">View history <ArrowUpRight size={16} /></Link>
      </section>

      {announcements.length > 0 && (
        <section onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} className="relative overflow-hidden rounded-2xl border border-[#012044]/10 bg-[#012044] px-4 py-3 text-white shadow-[0_16px_30px_rgba(1,32,68,0.12)]">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border-[20px] border-[#99BC0D]/15" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#99BC0D]"><Megaphone size={17} /></div>
            <div className="min-w-0 flex-1">
              {announcements.map((announcement: any, index: number) => index === currentAnnIndex && <div key={announcement.id} className="animate-in fade-in slide-in-from-right-2 duration-300"><p className="text-sm font-bold">{announcement.title}</p><p className="mt-0.5 truncate text-xs text-white/70">{announcement.content}</p></div>)}
            </div>
            {announcements.length > 1 && <div className="flex shrink-0 items-center gap-0.5"><button aria-label="Previous announcement" onClick={prevAnnouncement} className="rounded-lg p-2 hover:bg-white/10"><ChevronLeft size={16} /></button><button aria-label="Pause announcements" onClick={() => setIsPaused(!isPaused)} className="rounded-lg p-2 hover:bg-white/10">{isPaused ? <Play size={16} /> : <Pause size={16} />}</button><button aria-label="Next announcement" onClick={nextAnnouncement} className="rounded-lg p-2 hover:bg-white/10"><ChevronRight size={16} /></button></div>}
          </div>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.85fr)]">
        <div className="space-y-5">
          <article className="relative overflow-hidden rounded-[26px] bg-[#012044] p-5 text-white shadow-[0_20px_45px_rgba(1,32,68,0.16)] sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border-[28px] border-[#0291C0]/25" /><div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full border-[21px] border-[#99BC0D]/20" />
            <div className="relative"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-white/65"><WalletCards size={17} /><span>Main wallet</span></div><button aria-label="Toggle main wallet balance" onClick={() => setVisibility('main', !showMain)} className="rounded-lg p-2 text-white/75 transition hover:bg-white/10">{showMain ? <Eye size={18} /> : <EyeOff size={18} />}</button></div><div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-3xl font-extrabold tracking-tight sm:text-4xl">{showMain ? naira(mainBalance) : '••••••••'}</p><p className="mt-1 text-xs text-white/55">Available for your next top-up</p></div><Link href="/dashboard/wallet" className="inline-flex items-center gap-1.5 rounded-xl bg-[#99BC0D] px-3.5 py-2.5 text-sm font-extrabold text-[#012044] transition hover:bg-[#b6d837]">Fund wallet <ArrowUpRight size={16} /></Link></div></div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: 'cashback' as const, label: 'Cashback', value: cashbackBalance, visible: showCashback, accent: 'text-[#D69B04]', surface: 'bg-[#FFFDF5]', button: 'bg-[#D69B04] text-white', details: 'Earned reward balance' },
              { key: 'referral' as const, label: 'Referral', value: referralBalance, visible: showReferral, accent: 'text-[#036A97]', surface: 'bg-[#F3FAFC]', button: 'bg-[#036A97] text-white', details: 'Referral reward balance' },
            ].map((card) => <article key={card.key} className={`relative overflow-hidden rounded-2xl border border-[#E8EDF2] ${card.surface} p-4`}><Sparkles className={`absolute -right-3 -top-3 h-16 w-16 opacity-10 ${card.accent}`} /><div className="relative"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718096]">{card.label}</p><button aria-label={`Toggle ${card.label} balance`} onClick={() => setVisibility(card.key, !card.visible)} className={`rounded-lg p-1.5 ${card.accent} hover:bg-white/70`}>{card.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button></div><p className={`mt-3 text-2xl font-extrabold ${card.accent}`}>{card.visible ? naira(card.value) : '••••'}</p><p className="mt-0.5 text-xs text-[#718096]">{card.details}</p><button onClick={() => handleWithdraw(card.key)} disabled={processingWithdrawal || card.value <= 0} className={`mt-4 w-full rounded-xl px-3 py-2 text-xs font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35 ${card.button}`}>{processingWithdrawal ? 'Transferring…' : 'Move to main wallet'}</button></div></article>)}
          </div>

          <section className="rounded-2xl border border-[#E8EDF2] bg-white p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-base font-extrabold text-[#012044]">Top up quickly</p><p className="text-xs text-[#718096]">Choose a service to continue</p></div><Link href="/dashboard/services" className="text-xs font-bold text-[#036A97] hover:text-[#012044]">All services</Link></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">{actions.map((action) => <Link key={action.href} href={action.href} className="group rounded-xl p-2 text-center transition hover:bg-[#FFF7F4]"><span className={`mx-auto grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm transition duration-200 group-hover:-translate-y-0.5 ${action.tone}`}><action.icon size={18} /></span><span className="mt-2 block text-[11px] font-bold leading-tight text-[#012044]">{action.label}</span></Link>)}</div></section>
        </div>

        <aside className="rounded-2xl border border-[#E8EDF2] bg-white p-4 sm:p-5"><div className="flex items-start justify-between"><div><p className="text-base font-extrabold text-[#012044]">Recent activity</p><p className="mt-0.5 text-xs text-[#718096]">Your latest wallet entries</p></div><Receipt size={19} className="text-[#0291C0]" /></div>{recent.length === 0 ? <div className="mt-7 rounded-xl bg-[#FFF7F4] px-4 py-8 text-center"><p className="text-sm font-bold text-[#012044]">No activity yet</p><p className="mt-1 text-xs text-[#718096]">Your completed purchases will appear here.</p></div> : <div className="mt-4 divide-y divide-[#E8EDF2]">{recent.map((transaction: any) => { const isCredit = transaction.type === 'credit'; return <div key={transaction.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#012044]">{transaction.description || transaction.type}</p><p className="mt-0.5 text-xs text-[#718096]">{new Date(transaction.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p></div><span className={`shrink-0 text-sm font-extrabold ${isCredit ? 'text-[#147115]' : 'text-[#D06945]'}`}>{isCredit ? '+' : '-'}{naira(transaction.amount)}</span></div>; })}</div>}<Link href="/dashboard/transactions" className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[#E8EDF2] px-3 py-2.5 text-xs font-bold text-[#036A97] transition hover:border-[#036A97] hover:bg-[#F3FAFC]">All transactions <ArrowUpRight size={14} /></Link></aside>
      </section>
    </main>
  );
}
