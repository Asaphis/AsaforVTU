// Ferixas live account entry: preserves the approved visual form shell while calling the existing customer backend.
"use client";

import { ChevronRight, Menu } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLiveAuth } from "../contexts/LiveAuthContext";
import * as api from "../lib/liveApi";

type Mode = "login" | "register" | "verify" | "forgot" | "reset";
const logo = "/brand/ferixas-globe.png";
function Brand() { return <span className="asf-logo"><span><img src={logo} alt="Ferixas AsaforVTU" /></span><div><b>Ferixas</b><small>AsaforVTU · VTU top-up services</small></div></span>; }

export default function LiveAuthScreen({ mode }: { mode: Mode }) {
  const [, go] = useLocation(); const { signIn } = useLiveAuth();
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const [form, setForm] = useState({ full_name: "", username: "", phone: "", email: params.get("email") || "", referral_code: "", pin: "", password: "", confirm: "", terms: false });
  const [notice, setNotice] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const move = (path: string) => { go(path); window.scrollTo({ top: 0, behavior: "smooth" }); };
  useEffect(() => { if (mode !== "verify") return; const token = params.get("token"); if (!token) return; setBusy(true); api.apiRequest("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }).then(api.parse).then(() => setNotice("Your email is verified. You can now sign in.")).catch((cause) => setError(cause.message || "The verification link could not be completed.")).finally(() => setBusy(false)); }, [mode]);
  const update = (key: keyof typeof form, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      if (mode === "login") { await signIn(form.email, form.password); move("/dashboard"); return; }
      if (mode === "register") {
        if (!form.terms) throw new Error("Please accept the Terms of Service and Privacy Policy.");
        if (form.password !== form.confirm) throw new Error("Your passwords do not match.");
        await api.register({ full_name: form.full_name, username: form.username, phone: form.phone, email: form.email, password: form.password, pin: form.pin, referral_code: form.referral_code || undefined });
        move(`/verify-email-sent?email=${encodeURIComponent(form.email)}`); return;
      }
      if (mode === "forgot") { await api.requestReset(form.email); setNotice("If this email is registered, a password-reset link has been sent."); return; }
      if (mode === "reset") { const token = params.get("token"); if (!token) throw new Error("This password-reset link is incomplete."); if (form.password !== form.confirm) throw new Error("Your passwords do not match."); await api.resetPassword(token, form.password); setNotice("Your password has been reset. You can now sign in."); return; }
      await api.resendVerification(form.email); setNotice("A new verification email has been requested. Please check your inbox.");
    } catch (cause: any) {
      if (cause?.code === "EMAIL_NOT_VERIFIED") { move(`/verify-email-sent?email=${encodeURIComponent(form.email)}`); return; }
      setError(cause?.message || "We could not complete that request.");
    } finally { setBusy(false); }
  };
  const title = mode === "login" ? <>Welcome back.<br /><em>Sign in to continue.</em></> : mode === "register" ? <>Create your account.<br /><em>Top up with confidence.</em></> : mode === "forgot" ? <>Reset your<br /><em>password.</em></> : mode === "reset" ? <>Create a new<br /><em>password.</em></> : <>Verify your<br /><em>email address.</em></>;
  const formTitle = mode === "login" ? "Sign in to AsaforVTU." : mode === "register" ? "Create your AsaforVTU account." : mode === "forgot" ? "Request a reset link." : mode === "reset" ? "Choose a new password." : "Email verification.";
  return <main className="public-shell"><header className="public-top"><button onClick={() => move("/")}><Brand /></button><nav><button onClick={() => move("/services")}>Services</button><button onClick={() => move("/how-it-works")}>How it works</button><button onClick={() => move("/help")}>Help centre</button><button onClick={() => move("/login")}>Sign in</button><button className="asf-btn" onClick={() => move("/register")}>Create account <ChevronRight size={16} /></button></nav><button className="menu" onClick={() => move(mode === "login" ? "/register" : "/login")} aria-label="Account entry"><Menu /></button></header><section className="auth-page"><aside><span className="asf-tag">AsaforVTU account</span><h1>{title}</h1><p>Use one verified account for wallet funding, service purchases, transaction receipts and support.</p><div className="auth-points"><span>Protected wallet access</span><span>Transaction receipts</span><span>Support when you need it</span></div></aside><div className="auth-card"><button className="back" onClick={() => move("/")}>← Back to home</button><form onSubmit={submit}><span className="asf-tag">{mode === "register" ? "Create account" : mode === "verify" ? "Verification" : "Account access"}</span><h2>{formTitle}</h2>{error && <p className="form-error">{error}</p>}{notice && <p className="form-success">{notice}</p>}{mode === "register" && <><div className="form-two"><label className="form-field"><b>Full name</b><input value={form.full_name} onChange={e => update("full_name", e.target.value)} required /></label><label className="form-field"><b>Username</b><input value={form.username} onChange={e => update("username", e.target.value)} required /></label></div><label className="form-field"><b>Phone number</b><input inputMode="numeric" value={form.phone} onChange={e => update("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="080 0000 0000" required /></label><label className="form-field"><b>Referral code <small>(optional)</small></b><input value={form.referral_code} onChange={e => update("referral_code", e.target.value)} /></label></>}{mode !== "reset" && <label className="form-field"><b>Email address</b><input type="email" value={form.email} onChange={e => update("email", e.target.value)} required /></label>}{mode === "register" && <label className="form-field"><b>Transaction PIN</b><input type="password" inputMode="numeric" value={form.pin} onChange={e => update("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>}{!["forgot", "verify"].includes(mode) && <label className="form-field"><b>{mode === "reset" ? "New password" : "Password"}</b><input type="password" value={form.password} onChange={e => update("password", e.target.value)} required /></label>}{["register", "reset"].includes(mode) && <label className="form-field"><b>Confirm password</b><input type="password" value={form.confirm} onChange={e => update("confirm", e.target.value)} required /></label>}{mode === "register" && <label className="terms"><input type="checkbox" checked={form.terms} onChange={e => update("terms", e.target.checked)} />I agree to the Terms of Service and Privacy Policy.</label>}{mode === "login" && <div className="form-line"><span>Use your registered account details.</span><button type="button" onClick={() => move("/forgot-password")}>Forgot password?</button></div>}<button className="asf-btn" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Reset password" : "Resend verification email"} <ChevronRight size={16} /></button>{mode === "verify" && <button className="form-switch" type="button" onClick={() => move("/login")}>Back to sign in</button>}{mode !== "verify" && <p className="form-switch">{mode === "login" ? <>New to AsaforVTU? <button type="button" onClick={() => move("/register")}>Create account</button></> : <button type="button" onClick={() => move("/login")}>Back to sign in</button>}</p>}</form></div></section></main>;
}
