'use client';

/* Ferixas wallet: concise funding workspace with navy primary wallet and reward transfer cards. */
import { useAuth } from '@/contexts/AuthContext';
import { WalletCards, ArrowRightLeft, Eye, EyeOff, Copy, CreditCard, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { transferWallet, initiateFunding } from '@/lib/services';
import { useWalletListener } from '@/hooks/useWalletListener';

const format = (amount?: number) => `₦${Number(amount || 0).toLocaleString()}`;

export default function WalletPage() {
  const { user } = useAuth();
  const [showMain, setShowMain] = useState(false);
  const [showCashback, setShowCashback] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const { balance, loading, error, refresh } = useWalletListener(!!user);
  const [balances, setBalances] = useState({ mainBalance: 0, cashbackBalance: 0, referralBalance: 0 });
  const [processing, setProcessing] = useState<'cashback' | 'referral' | null>(null);
  const [fundAmount, setFundAmount] = useState<number>(1000);
  const [funding, setFunding] = useState(false);

  useEffect(() => { if (balance) setBalances(balance); }, [balance]);
  useEffect(() => {
    setShowMain(sessionStorage.getItem('showMainBalance') === 'true');
    setShowCashback(sessionStorage.getItem('showCashbackBalance') === 'true');
    setShowReferral(sessionStorage.getItem('showReferralBalance') === 'true');
  }, []);
  useEffect(() => { sessionStorage.setItem('showMainBalance', String(showMain)); }, [showMain]);
  useEffect(() => { sessionStorage.setItem('showCashbackBalance', String(showCashback)); }, [showCashback]);
  useEffect(() => { sessionStorage.setItem('showReferralBalance', String(showReferral)); }, [showReferral]);

  const startFunding = async () => {
    if (!user || funding) return;
    if (!fundAmount || fundAmount <= 0) return alert('Enter a valid funding amount.');
    setFunding(true);
    try {
      const result = await initiateFunding(fundAmount);
      if (result.link) window.location.href = result.link;
      else alert('A payment link was not returned. Please try again.');
    } catch (error: any) {
      alert(error.message || 'Unable to begin funding.');
    } finally { setFunding(false); }
  };

  const transfer = async (type: 'referral' | 'cashback') => {
    if (!user || processing) return;
    const amount = type === 'referral' ? balances.referralBalance : balances.cashbackBalance;
    if (amount <= 0) return;
    setProcessing(type);
    try {
      const result = await transferWallet(amount, type);
      if (result.success) {
        alert(`Transferred ${format(amount)} to your main wallet.`);
        await refresh();
      } else alert(result.message || 'Transfer failed.');
    } catch (error: any) {
      alert(error.message || 'Transfer failed.');
    } finally { setProcessing(null); }
  };

  const copyReferralCode = async () => {
    const code = user?.username || user?.uid;
    if (!code) return;
    try { await navigator.clipboard.writeText(code); alert('Referral code copied.'); }
    catch { alert('Unable to copy the referral code.'); }
  };

  const walletCards = [
    { type: 'cashback' as const, label: 'Cashback wallet', caption: 'Reward balance', amount: balances.cashbackBalance, visible: showCashback, setVisible: setShowCashback, surface: 'bg-[#FFFDF5]', accent: 'text-[#D69B04]', button: 'bg-[#D69B04] text-white' },
    { type: 'referral' as const, label: 'Referral wallet', caption: 'Referral rewards', amount: balances.referralBalance, visible: showReferral, setVisible: setShowReferral, surface: 'bg-[#F3FAFC]', accent: 'text-[#036A97]', button: 'bg-[#036A97] text-white' },
  ];

  return (
    <main className="space-y-5 pb-24 lg:pb-8">
      <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">Wallet</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#012044]">Fund and manage your balance.</h1></section>
      {error && <p className="rounded-xl border border-[#D69B04]/30 bg-[#FFF8E8] px-3 py-2 text-sm font-medium text-[#7B5200]">Wallet updates are temporarily unavailable. You can refresh this page to retry.</p>}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
        <article className="relative overflow-hidden rounded-[26px] bg-[#012044] p-5 text-white shadow-[0_20px_45px_rgba(1,32,68,0.16)] sm:p-6"><div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border-[25px] border-[#0291C0]/25" /><div className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full border-[18px] border-[#99BC0D]/20" /><div className="relative"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-white/65"><WalletCards size={17} /><span>Main wallet</span></div><button aria-label="Toggle main balance" className="rounded-lg p-2 hover:bg-white/10" onClick={() => setShowMain((current) => !current)}>{showMain ? <Eye size={18} /> : <EyeOff size={18} />}</button></div><p className="mt-7 text-3xl font-extrabold tracking-tight sm:text-4xl">{showMain ? format(balances.mainBalance) : '••••••••'}</p><p className="mt-1 text-xs text-white/55">Available to purchase VTU services.</p><div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]"><label className="relative"><span className="sr-only">Funding amount</span><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#99BC0D]">₦</span><input type="number" min={100} step={50} value={fundAmount} onChange={(event) => setFundAmount(Number(event.target.value))} className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-8 pr-3 text-sm font-bold text-white outline-none placeholder:text-white/40 focus:border-[#99BC0D]" placeholder="Amount" /></label><button onClick={startFunding} disabled={funding || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#99BC0D] px-4 py-3 text-sm font-extrabold text-[#012044] transition hover:bg-[#b6d837] disabled:cursor-not-allowed disabled:opacity-50"><CreditCard size={16} />{funding ? 'Opening checkout…' : 'Fund wallet'}</button></div></div></article>

        <aside className="rounded-2xl border border-[#E8EDF2] bg-white p-5"><div className="flex h-full flex-col"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3FAFC] text-[#036A97]"><ArrowRightLeft size={19} /></span><div><p className="font-extrabold text-[#012044]">Reward transfer</p><p className="text-xs text-[#718096]">Move rewards to your main wallet.</p></div></div><p className="mt-5 text-sm leading-6 text-[#718096]">Cashback and referral rewards can be transferred whenever a balance is available.</p><div className="mt-auto rounded-xl bg-[#FFF7F4] p-3"><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#718096]">Your referral code</p><div className="mt-1.5 flex items-center justify-between gap-3"><code className="truncate text-sm font-extrabold text-[#012044]">{user?.username || user?.uid || 'Not available'}</code><button onClick={copyReferralCode} aria-label="Copy referral code" className="rounded-lg p-2 text-[#036A97] transition hover:bg-white"><Copy size={16} /></button></div></div></div></aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2">{walletCards.map((card) => <article key={card.type} className={`relative overflow-hidden rounded-2xl border border-[#E8EDF2] ${card.surface} p-5`}><Sparkles className={`absolute -right-4 -top-3 h-16 w-16 opacity-10 ${card.accent}`} /><div className="relative"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold text-[#012044]">{card.label}</p><p className="mt-0.5 text-xs text-[#718096]">{card.caption}</p></div><button aria-label={`Toggle ${card.label}`} className={`rounded-lg p-2 ${card.accent} hover:bg-white/70`} onClick={() => card.setVisible((current) => !current)}>{card.visible ? <Eye size={17} /> : <EyeOff size={17} />}</button></div><p className={`mt-6 text-3xl font-extrabold ${card.accent}`}>{card.visible ? format(card.amount) : '••••••'}</p><button onClick={() => transfer(card.type)} disabled={processing === card.type || card.amount <= 0 || loading} className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35 ${card.button}`}>{processing === card.type ? 'Transferring…' : 'Move to main wallet'}</button></div></article>)}</section>
    </main>
  );
}
