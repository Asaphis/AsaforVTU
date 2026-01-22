'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { generateHash } from '@/lib/crypto';
import toast from 'react-hot-toast';
import { Lock, Shield } from 'lucide-react';

export default function SecurityPage() {
  const { user } = useAuth();
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // PIN State
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      if (auth.currentUser && auth.currentUser.email) {
        // Re-authenticate first
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        await updatePassword(auth.currentUser, newPassword);
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    setPinLoading(true);
    try {
      if (user) {
        const pinHash = await generateHash(pin);
        await updateDoc(doc(db, 'users', user.uid), {
          pinHash,
          updatedAt: new Date().toISOString()
        });
        toast.success('Transaction PIN updated successfully');
        setPin('');
        setConfirmPin('');
      }
    } catch (error: any) {
      toast.error('Failed to update PIN');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-[#0A1F44] tracking-tight">Security Settings</h1>
        <p className="text-gray-400 font-medium mt-1">Protect your account and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Change Password */}
        <div className="dashboard-card border-none shadow-brand relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0A1F44]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0A1F44] group-hover:rotate-12 transition-all">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0A1F44] tracking-tight">Change Password</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Access Security</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44]"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#0A1F44]/20 focus:bg-white focus:outline-none transition-all font-bold text-[#0A1F44]"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-4 rounded-2xl bg-[#0A1F44] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#0A1F44]/90 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-30 mt-4"
            >
              {passwordLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        </div>

        {/* Transaction PIN */}
        <div className="dashboard-card border-none shadow-brand relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F97316]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#F97316] group-hover:rotate-12 transition-all">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0A1F44] tracking-tight">Transaction PIN</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Wallet Security</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed">
            Set a secure 4-digit PIN to authorize wallet transfers and service purchases.
          </p>
          <form onSubmit={handleUpdatePin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">New 4-Digit PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#F97316]/30 focus:bg-white focus:outline-none transition-all font-black text-[#0A1F44] text-2xl tracking-[1em] text-center"
                placeholder="••••"
                required
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Confirm PIN</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#F97316]/30 focus:bg-white focus:outline-none transition-all font-black text-[#0A1F44] text-2xl tracking-[1em] text-center"
                placeholder="••••"
                required
                maxLength={4}
              />
            </div>
            <button
              type="submit"
              disabled={pinLoading}
              className="w-full py-4 rounded-2xl bg-[#F97316] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#F97316]/90 transition-all shadow-xl shadow-orange-900/20 disabled:opacity-30 mt-4"
            >
              {pinLoading ? 'UPDATING...' : 'UPDATE PIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
