'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { User, Phone, Mail, AtSign, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fullName,
        phone,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div>
        <h1 className="text-4xl font-black text-[#0B4F6C] tracking-tighter">Profile Center</h1>
        <div className="h-1.5 w-12 bg-[#C58A17] rounded-full mt-2" />
        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Identity & Security Management</p>
      </div>

      <div className="dashboard-card border-none shadow-brand space-y-10 p-8 lg:p-12 relative overflow-hidden">
        <div className="tech-pattern absolute inset-0 opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C58A17]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-[#0B4F6C] border-8 border-white shadow-2xl group hover:rotate-6 transition-transform duration-500">
              <User size={64} className="group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#0B4F6C] tracking-tighter">{user?.fullName}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                 <AtSign size={14} className="text-[#C58A17]" />
                 <p className="text-xs text-[#C58A17] font-black uppercase tracking-[0.3em]">@{user?.username}</p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                 <span className="px-4 py-1.5 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] text-[10px] font-black uppercase tracking-widest border border-[#4CAF50]/20">Active Session</span>
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${user?.isVerified ? 'bg-[#0B4F6C]/10 text-[#0B4F6C] border-[#0B4F6C]/20' : 'bg-[#C58A17]/10 text-[#C58A17] border-[#C58A17]/20'}`}>
                    {user?.isVerified ? 'Verified Account' : 'Identity Pending'}
                 </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              if (editing) handleUpdate();
              else setEditing(true);
            }}
            disabled={loading}
            className={`px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl group ${
              editing 
                ? 'bg-[#4CAF50] text-white shadow-[#4CAF50]/20 hover:bg-[#4CAF50]/90' 
                : 'bg-[#0B4F6C] text-white shadow-[#0B4F6C]/20 hover:bg-[#0D2B5D]'
            }`}
          >
            <span className="flex items-center gap-3">
              {loading ? 'SYNCHRONIZING...' : editing ? 'SAVE CHANGES' : 'REFINE PROFILE'}
              {!loading && (editing ? <ShieldCheck size={16} /> : <AtSign size={16} />)}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10 pt-10 border-t border-gray-100">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-2">
              <User size={14} className="text-[#C58A17]" /> Legal Identity
            </label>
            {editing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0B4F6C]/20 focus:bg-white focus:outline-none transition-all font-black text-[#0B4F6C] shadow-inner text-lg"
              />
            ) : (
              <p className="font-black text-[#0B4F6C] text-xl bg-gray-50/50 px-6 py-5 rounded-2xl border border-gray-100/50">{user?.fullName}</p>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-2">
              <AtSign size={14} className="text-[#C58A17]" /> Network Identifier
            </label>
            <div className="relative group">
               <p className="font-black text-[#0B4F6C] text-xl bg-gray-50/50 px-6 py-5 rounded-2xl border border-gray-100/50 opacity-80">
                 {user?.username}
               </p>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ShieldCheck size={20} className="text-[#4CAF50]" />
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-2">
              <Mail size={14} className="text-[#C58A17]" /> Communication Channel
            </label>
            <p className="font-black text-[#0B4F6C] text-xl bg-gray-50/50 px-6 py-5 rounded-2xl border border-gray-100/50 opacity-80">
              {user?.email}
            </p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-2">
              <Phone size={14} className="text-[#C58A17]" /> Primary Contact
            </label>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0B4F6C]/20 focus:bg-white focus:outline-none transition-all font-black text-[#0B4F6C] shadow-inner text-lg"
              />
            ) : (
              <p className="font-black text-[#0B4F6C] text-xl bg-gray-50/50 px-6 py-5 rounded-2xl border border-gray-100/50">{user?.phone || 'Not configured'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
