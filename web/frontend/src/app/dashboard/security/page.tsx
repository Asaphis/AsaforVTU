'use client';

/* Ferixas security page: focused, low-friction credentials and transaction-PIN controls. */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword, changePin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { LockKeyhole, ShieldCheck, KeyRound } from 'lucide-react';

const inputClass = 'mt-1.5 w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-sm text-[#012044] outline-none transition placeholder:text-[#718096] focus:border-[#036A97] focus:ring-2 focus:ring-[#036A97]/10';

export default function SecurityPage() {
  const { refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match.'); return; }
    setPasswordLoading(true);
    try { await changePassword(currentPassword, newPassword); toast.success('Password updated.'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
    catch (error: any) { toast.error(error.message || 'Unable to change password.'); }
    finally { setPasswordLoading(false); }
  };
  const handleChangePin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pin !== confirmPin) { toast.error('PINs do not match.'); return; }
    if (!/^\d{4,6}$/.test(pin)) { toast.error('PIN must contain 4 to 6 digits.'); return; }
    setPinLoading(true);
    try { await changePin(pin, confirmPin); await refreshUser(); toast.success('Transaction PIN updated.'); setPin(''); setConfirmPin(''); }
    catch (error: any) { toast.error(error.message || 'Unable to change transaction PIN.'); }
    finally { setPinLoading(false); }
  };

  return <main className="mx-auto max-w-4xl space-y-5 pb-24 lg:pb-8"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">Security</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#012044]">Secure your account.</h1><p className="mt-1 text-sm text-[#718096]">Manage your sign-in password and transaction PIN.</p></section><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-[#E8EDF2] bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3FAFC] text-[#036A97]"><LockKeyhole size={19} /></span><div><h2 className="font-extrabold text-[#012044]">Password</h2><p className="mt-0.5 text-xs text-[#718096]">Use a strong, unique password.</p></div></div><form onSubmit={handleChangePassword} className="mt-5 space-y-3"><label className="block"><span className="text-xs font-bold text-[#012044]">Current password</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className={inputClass} /></label><label className="block"><span className="text-xs font-bold text-[#012044]">New password</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={6} className={inputClass} /></label><label className="block"><span className="text-xs font-bold text-[#012044]">Confirm new password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} className={inputClass} /></label><button type="submit" disabled={passwordLoading} className="mt-2 w-full rounded-xl bg-[#036A97] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#012044] disabled:cursor-not-allowed disabled:opacity-50">{passwordLoading ? 'Updating password…' : 'Update password'}</button></form></section><section className="rounded-2xl border border-[#E8EDF2] bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF5C7] text-[#416000]"><KeyRound size={19} /></span><div><h2 className="font-extrabold text-[#012044]">Transaction PIN</h2><p className="mt-0.5 text-xs text-[#718096]">Used to confirm sensitive purchase actions.</p></div></div><form onSubmit={handleChangePin} className="mt-5 space-y-3"><label className="block"><span className="text-xs font-bold text-[#012044]">New PIN</span><input type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} required maxLength={6} pattern="[0-9]{4,6}" placeholder="4–6 digits" className={inputClass} /></label><label className="block"><span className="text-xs font-bold text-[#012044]">Confirm PIN</span><input type="password" inputMode="numeric" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} required maxLength={6} pattern="[0-9]{4,6}" className={inputClass} /></label><button type="submit" disabled={pinLoading} className="mt-2 w-full rounded-xl bg-[#99BC0D] px-4 py-3 text-sm font-bold text-[#012044] transition hover:bg-[#b6d837] disabled:cursor-not-allowed disabled:opacity-50">{pinLoading ? 'Updating PIN…' : 'Update transaction PIN'}</button></form></section></div><aside className="flex items-center gap-3 rounded-2xl border border-[#99BC0D]/25 bg-[#F8FCEB] p-4"><ShieldCheck size={20} className="shrink-0 text-[#416000]" /><p className="text-sm leading-6 text-[#486000]">Never share your password or transaction PIN. Ferixas support will not ask for either one.</p></aside></main>;
}
