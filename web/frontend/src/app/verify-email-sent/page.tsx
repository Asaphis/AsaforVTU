'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AuthLayout } from '@/components/auth/AuthLayout';

function VerifyEmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email address';

  return (
    <AuthLayout>
      <div className="w-full space-y-8 p-10 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-black text-slate-950 tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-lg text-slate-600 font-semibold">
            We've sent a verification link to
          </p>
          <p className="text-lg font-bold text-primary break-all">
            {decodeURIComponent(email)}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-3">
          <div className="flex gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">What's next?</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Check your inbox for an email from us</li>
                <li>Click the verification link in the email</li>
                <li>Return to the login page to sign in</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
          <div className="flex gap-3">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 mb-2">Didn't receive the email?</h3>
              <p className="text-sm text-amber-800 mb-4">
                Check your spam or junk folder. If you still don't see it, you can request a new verification link from the login page.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full h-14 bg-primary text-white text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2">
              Go to Sign In <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/register" className="block">
            <Button 
              variant="outline" 
              className="w-full h-14 border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all"
            >
              Back to Register
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-slate-500 font-semibold">
          Once you verify your email, you'll have full access to your account.
        </p>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailSentContent />
    </Suspense>
  );
}
