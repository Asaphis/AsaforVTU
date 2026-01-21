'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // This component is a simplified sign-up widget; forward users to the full register page
    router.push('/register');
  };

  return (
    <div className="max-w-md w-full space-y-10 p-10 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
      <div>
        <h2 className="text-center text-4xl font-black text-slate-950 tracking-tight">
          Join AsaforVTU
        </h2>
        <p className="mt-4 text-center text-slate-500 font-medium">Create your secure account in seconds</p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold flex items-center" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-sm font-bold text-slate-700 ml-1 mb-2">Full Name</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              className="appearance-none block w-full h-14 px-5 border-2 border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email-address" className="block text-sm font-bold text-slate-700 ml-1 mb-2">
              Email Address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none block w-full h-14 px-5 border-2 border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-slate-700 ml-1 mb-2">
              Create Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none block w-full h-14 px-5 border-2 border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full h-14 flex justify-center items-center px-4 border border-transparent text-lg font-black rounded-2xl text-white bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create Account'}
          </button>
        </div>
      </form>
      <div className="text-center pt-2">
        <p className="text-sm font-bold text-slate-500">
          Already a member?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-black">
            Sign In Instead
          </Link>
        </p>
      </div>
    </div>
  );
}
