"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SiGoogle, SiApple } from "react-icons/si";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuthForm } from "@/hooks/useAuthForm";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  
  const {
    isLoading,
    errors,
    needsVerification,
    handleLogin,
    handleResendVerification,
  } = useAuthForm();
  const [socialLoading, setSocialLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] LOGIN ATTEMPT START');
    try {
      console.log('[DEBUG] Login credentials:', { email: formData.email });
      await handleLogin(formData);
      console.log('[DEBUG] handleLogin call successful');
    } catch (err: any) {
      console.error('[DEBUG] LOGIN EXCEPTION:', err);
      // Force UI feedback for ANY error
      alert("System Error: " + (err.message || "Unknown error"));
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(true);
    try {
      console.log(`Login with ${provider}`);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full space-y-10 p-10 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
        <div className="space-y-2">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <img
              src="/logo.png"
              alt="AsaforVTU Logo"
              className="h-12 w-12 object-contain"
            />
            <span className="font-black text-2xl text-slate-900 tracking-tight">AsaforVTU</span>
          </div>
          <h1 className="text-center text-4xl font-black text-slate-950 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-center text-slate-500 font-semibold">
            Sign in to your secure account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-black text-slate-700 ml-1">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-14 pl-12 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-bold"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <Label htmlFor="password" className="text-sm font-black text-slate-700">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary font-black hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-14 pl-12 pr-12 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-bold"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
              <p className="mb-2">{errors.general}</p>
              {needsVerification && (
                <div className="mt-3 pt-3 border-t border-destructive/20">
                  <p className="text-sm font-semibold mb-2">Need to verify your email?</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleResendVerification(formData.email)}
                    disabled={isLoading || !formData.email}
                    className="w-full bg-white hover:bg-slate-50 text-destructive border-destructive/30 font-bold"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 px-1">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, rememberMe: checked as boolean })
              }
              className="h-5 w-5 rounded-lg border-slate-200 text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm font-bold text-slate-600 cursor-pointer"
            >
              Remember me for 30 days
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-primary text-white text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-400 font-black tracking-widest">
              Or connect with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            className="h-14 rounded-2xl border-2 border-slate-100 font-bold hover:bg-slate-50 transition-all"
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading || socialLoading}
          >
            <SiGoogle className="w-5 h-5 mr-3 text-red-500" />
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 rounded-2xl border-2 border-slate-100 font-bold hover:bg-slate-50 transition-all"
            onClick={() => handleSocialLogin("apple")}
            disabled={isLoading || socialLoading}
          >
            <SiApple className="w-5 h-5 mr-3 text-black" />
            Apple
          </Button>
        </div>

        <p className="text-center text-sm font-bold text-slate-500">
          New to AsaforVTU?{" "}
          <Link
            href="/register"
            className="text-primary font-black hover:text-primary/80 transition-colors"
          >
            Create Account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

