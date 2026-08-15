'use client';

/* Ferixas account page: simple personal-information panel with a verified account summary. */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/auth';
import toast from 'react-hot-toast';
import { User, Phone, Mail, AtSign, ShieldCheck, Pencil, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    try { await updateProfile({ full_name: fullName, phone }); toast.success('Profile updated.'); setEditing(false); await refreshUser(); }
    catch (error) { toast.error('Unable to update your profile.'); console.error(error); }
    finally { setLoading(false); }
  };

  const accountItems = [
    { icon: Mail, label: 'Email address', value: user?.email || 'Not set' },
    { icon: AtSign, label: 'Username', value: user?.username || 'Not set' },
  ];

  return <main className="mx-auto max-w-4xl space-y-5 pb-24 lg:pb-8"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718096]">Account</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#012044]">Profile settings.</h1><p className="mt-1 text-sm text-[#718096]">Keep your account information current.</p></section><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"><section className="rounded-2xl border border-[#E8EDF2] bg-white p-5 sm:p-6"><header className="flex items-center justify-between gap-3"><div><p className="font-extrabold text-[#012044]">Personal details</p><p className="mt-0.5 text-xs text-[#718096]">These details help us support your account.</p></div><button onClick={() => setEditing((current) => !current)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] px-3 py-2 text-xs font-bold text-[#036A97] transition hover:border-[#036A97] hover:bg-[#F3FAFC]"><Pencil size={14} />{editing ? 'Cancel' : 'Edit profile'}</button></header><div className="mt-5 grid gap-3 sm:grid-cols-2">{accountItems.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl bg-[#FFF7F4] p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#036A97]"><item.icon size={17} /></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#718096]">{item.label}</p><p className="mt-0.5 truncate text-sm font-bold text-[#012044]">{item.value}</p></div></div>)}</div>{editing ? <div className="mt-5 space-y-4"><label className="block"><span className="text-xs font-bold text-[#012044]">Full name</span><input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] px-3 py-2.5 text-sm font-medium text-[#012044] outline-none focus:border-[#036A97] focus:ring-2 focus:ring-[#036A97]/10" /></label><label className="block"><span className="text-xs font-bold text-[#012044]">Phone number</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#E8EDF2] px-3 py-2.5 text-sm font-medium text-[#012044] outline-none focus:border-[#036A97] focus:ring-2 focus:ring-[#036A97]/10" /></label><button onClick={handleUpdate} disabled={loading} className="w-full rounded-xl bg-[#036A97] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#012044] disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Saving changes…' : 'Save changes'}</button></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{[{ icon: User, label: 'Full name', value: user?.fullName || 'Not set' }, { icon: Phone, label: 'Phone number', value: user?.phone || 'Not set' }].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#E8EDF2] p-3"><item.icon size={17} className="text-[#718096]" /><div><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#718096]">{item.label}</p><p className="mt-0.5 text-sm font-bold text-[#012044]">{item.value}</p></div></div>)}</div>}</section><aside className="rounded-2xl bg-[#012044] p-5 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#99BC0D] text-[#012044]"><ShieldCheck size={20} /></span><h2 className="mt-4 text-lg font-extrabold">Account status</h2><p className="mt-1 text-sm leading-6 text-white/65">Your verification and membership details.</p><div className="mt-6 space-y-3 border-t border-white/10 pt-4"><div className="flex items-center justify-between gap-3"><span className="text-xs text-white/60">Verification</span><span className={`inline-flex items-center gap-1 text-xs font-bold ${user?.isVerified || user?.emailVerified ? 'text-[#b6d837]' : 'text-[#FFD477]'}`}><CheckCircle2 size={14} />{user?.isVerified || user?.emailVerified ? 'Verified' : 'Unverified'}</span></div><div className="flex items-center justify-between gap-3"><span className="text-xs text-white/60">Member since</span><span className="text-xs font-bold text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }) : '—'}</span></div></div></aside></div></main>;
}
