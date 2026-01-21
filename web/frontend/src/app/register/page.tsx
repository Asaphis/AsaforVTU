"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SiGoogle, SiApple } from "react-icons/si";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuthForm } from "@/hooks/useAuthForm";
import { logger } from "@/lib/logger";

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

type FormData = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  transactionPin: string;
  referralUsername: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    transactionPin: "",
    referralUsername: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const { 
    isLoading: isFormLoading, 
    handleSignUp 
  } = useAuthForm();
  
  const isLoading = isFormLoading || isSocialLoading;
  
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      setFormErrors({});
    }
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.transactionPin) newErrors.transactionPin = "Transaction PIN is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms";

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      await handleSignUp({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        transactionPin: formData.transactionPin,
        password: formData.password,
        acceptTerms: formData.acceptTerms,
        referralUsername: formData.referralUsername || ''
      });
    } catch (error: any) {
      setFormErrors(prev => ({ ...prev, general: error.message || 'Registration failed' }));
    }
  };

  const handleSocialRegister = async (provider: "google" | "apple") => {
    setIsSocialLoading(true);
    try {
      console.log(`Register with ${provider}`);
    } finally {
      setIsSocialLoading(false);
    }
  };

  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <AuthLayout>
      <div className="w-full space-y-10 p-10 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
        <div className="space-y-2">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <img src="/logo.png" alt="AsaforVTU Logo" className="h-12 w-12 object-contain" />
            <span className="font-black text-2xl text-slate-900 tracking-tight">AsaforVTU</span>
          </div>
          <h1 className="text-center text-4xl font-black text-slate-950 tracking-tight">Create Account</h1>
          <p className="text-center text-slate-500 font-semibold">Join the future of digital top-ups</p>
        </div>

        {formErrors.general && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold" role="alert">
            {formErrors.general}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-black text-slate-700 ml-1">Full Name</Label>
              <Input
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-14 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                disabled={isLoading}
              />
              {formErrors.fullName && <p className="text-xs text-destructive font-bold ml-1">{formErrors.fullName}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-black text-slate-700 ml-1">Username</Label>
              <Input
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-14 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                disabled={isLoading}
              />
              {formErrors.username && <p className="text-xs text-destructive font-bold ml-1">{formErrors.username}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-black text-slate-700 ml-1 truncate">Referral (Opt)</Label>
              <Input
                placeholder="Username"
                value={formData.referralUsername}
                onChange={(e) => setFormData({ ...formData, referralUsername: e.target.value })}
                className="h-14 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-black text-slate-700 ml-1">Phone</Label>
              <Input
                placeholder="08012345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                className="h-14 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                disabled={isLoading}
              />
              {formErrors.phone && <p className="text-xs text-destructive font-bold ml-1">{formErrors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-black text-slate-700 ml-1">PIN</Label>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  placeholder="4-6 digits"
                  value={formData.transactionPin}
                  onChange={(e) => setFormData({ ...formData, transactionPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="h-14 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.transactionPin && <p className="text-xs text-destructive font-bold ml-1">{formErrors.transactionPin}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-black text-slate-700 ml-1">Email Address</Label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-14 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
              disabled={isLoading}
            />
            {formErrors.email && <p className="text-xs text-destructive font-bold ml-1">{formErrors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-black text-slate-700 ml-1">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-14 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && <p className="text-xs text-destructive font-bold ml-1">{formErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-black text-slate-700 ml-1">Confirm</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="h-14 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.confirmPassword && <p className="text-xs text-destructive font-bold ml-1">{formErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="flex items-start gap-3 px-1">
            <Checkbox
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
              className="h-5 w-5 mt-0.5 rounded-lg border-slate-200 text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <Label htmlFor="acceptTerms" className="text-sm font-bold text-slate-600 leading-tight cursor-pointer">
              I agree to the <Link href="/terms" className="text-primary hover:text-primary/80 font-black">Terms</Link> and <Link href="/privacy" className="text-primary hover:text-primary/80 font-black">Privacy Policy</Link>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-primary text-white text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm font-bold text-slate-500">
          Already a member?{" "}
          <Link href="/login" className="text-primary font-black hover:text-primary/80 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
