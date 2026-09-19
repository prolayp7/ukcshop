"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { sendOtp, resetPassword, ApiError } from "@/lib/storefront-client";
import { useHref } from "@/lib/design-context";
import { toast } from "@/lib/notifications";
import AuthLayout from "./AuthLayout";
import styles from "./auth.module.css";

export default function ForgotPasswordPage() {
  const href = useHref();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const accountEmail = email.trim();
      await sendOtp(accountEmail, "password_reset");
      setEmail(accountEmail);
      setStep(2);
    } catch {
      setError("Couldn’t send a reset code. Check the email address and try again.");
    } finally { setBusy(false); }
  }

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await resetPassword(email, code.trim(), newPassword);
      toast.success("Password updated. Sign in with your new password.");
      router.push(href.login());
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  return <AuthLayout pageTitle="Reset password">
    <h1 id="auth-heading">Reset your password.<br /><em>Get back to your account.</em></h1>
    <p className={styles.intro}>{step === 1 ? "Enter your account email and we’ll send you a code to reset your password." : "Enter your reset code and choose a new password to access your orders, wishlist and saved details."}</p>
    <div className={styles.security}>
      {step === 1 ? <ShieldCheck size={19} /> : <Mail size={19} />}
      <p>{step === 1 ? <><strong>A fresh start for your account.</strong>You’ll need access to your email to complete the reset.</> : <><strong>Check your inbox</strong>If an account exists for <span className={styles.recoveryEmail}>{email}</span>, a reset code has been sent. Check your spam folder too.</>}</p>
    </div>
    <form className={styles.form} onSubmit={step === 1 ? requestCode : submitReset} aria-busy={busy}>
      {step === 1 ? <div className={styles.field}>
        <label htmlFor="reset-email">Email address <b>*</b></label>
        <div className={styles.input}><Mail size={17} /><input id="reset-email" name="email" type="email" required maxLength={255} value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></div>
      </div> : <>
        <div className={styles.field}>
          <div className={styles.labelRow}><label htmlFor="reset-code">Reset code <b>*</b></label><button type="button" className={styles.recoveryAction} disabled={busy} onClick={() => { setStep(1); setCode(""); setNewPassword(""); setVisible(false); setError(""); }}>Change email</button></div>
          <div className={styles.input}><KeyRound size={17} /><input id="reset-code" name="code" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} title="Enter the 6-digit code from your email" value={code} onChange={event => setCode(event.target.value)} autoComplete="one-time-code" placeholder="6-digit code" autoFocus /></div>
        </div>
        <div className={styles.field}>
          <label htmlFor="reset-password">New password <b>*</b></label>
          <div className={styles.input}><LockKeyhole size={17} /><input id="reset-password" name="newPassword" type={visible ? "text" : "password"} required minLength={10} maxLength={128} value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="At least 10 characters" aria-describedby="reset-password-hint" /><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          <small id="reset-password-hint" className={styles.hint}>Use at least 10 characters. A longer, unique password is best.</small>
        </div>
      </>}
      {error && <p className={styles.error} role="alert"><AlertCircle size={18} />{error}</p>}
      <button className={styles.submit} type="submit" disabled={busy}>{busy ? (step === 1 ? "Sending code…" : "Resetting password…") : (step === 1 ? "Send reset code" : "Reset password")}<ArrowRight size={18} /></button>
    </form>
    <div className={styles.switchAccount}>Remember your password?<Link href={href.login()}><ArrowLeft size={15} />Back to sign in</Link></div>
  </AuthLayout>;
}
