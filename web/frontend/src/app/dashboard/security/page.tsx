'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword, changePin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Lock, Shield } from 'lucide-react';

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();
  
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
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error('PIN must contain 4 to 6 digits');
      return;
    }
    setPinLoading(true);
    try {
      await changePin(pin, confirmPin);
      await refreshUser();
      toast.success('PIN changed successfully');
      setPin('');
      setConfirmPin('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change PIN');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Lock size={20} />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Shield size={20} />
          Transaction PIN
        </h2>
        <form onSubmit={handleChangePin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New PIN (4–6 digits)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              maxLength={6}
              pattern="[0-9]{4,6}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              maxLength={6}
              pattern="[0-9]{4,6}"
            />
          </div>
          <button
            type="submit"
            disabled={pinLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {pinLoading ? 'Changing...' : 'Change PIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
