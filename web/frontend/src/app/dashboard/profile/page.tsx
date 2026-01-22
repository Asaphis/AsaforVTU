'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { User, Phone, Mail, AtSign } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight">Profile Settings</h1>
        <p className="text-gray-400 font-medium mt-1">Manage your personal information</p>
      </div>

      <div className="dashboard-card border-none shadow-brand space-y-8 p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center text-[#0A1F44] border-4 border-white shadow-xl">
              <User size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0A1F44] tracking-tight">{user?.fullName}</h2>
              <p className="text-sm text-[#F97316] font-black uppercase tracking-[0.2em]">@{user?.username}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (editing) handleUpdate();
              else setEditing(true);
            }}
            disabled={loading}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg ${
              editing 
                ? 'bg-[#F97316] text-white shadow-orange-900/20 hover:bg-[#F97316]/90' 
                : 'bg-[#0A1F44] text-white shadow-blue-900/20 hover:bg-[#0A1F44]/90'
            }`}
          >
            {loading ? 'Saving...' : editing ? 'Save Profile' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <User size={14} className="text-[#F97316]" /> Full Name
            </label>
            {editing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#F97316]/30 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44]"
              />
            ) : (
              <p className="font-bold text-[#0A1F44] text-lg px-2">{user?.fullName}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <AtSign size={14} className="text-[#F97316]" /> Username
            </label>
            <p className="font-bold text-[#0A1F44] text-lg bg-gray-50/50 px-5 py-4 rounded-2xl border border-gray-100/50">
              {user?.username}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Mail size={14} className="text-[#F97316]" /> Email Address
            </label>
            <p className="font-bold text-[#0A1F44] text-lg bg-gray-50/50 px-5 py-4 rounded-2xl border border-gray-100/50">
              {user?.email}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Phone size={14} className="text-[#F97316]" /> Phone Number
            </label>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#F97316]/30 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44]"
              />
            ) : (
              <p className="font-bold text-[#0A1F44] text-lg px-2">{user?.phone || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
