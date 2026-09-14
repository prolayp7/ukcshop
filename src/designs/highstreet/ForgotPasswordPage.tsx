"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendOtp, resetPassword, ApiError } from "@/lib/storefront-client";
import { useHref } from "@/lib/design-context";
import { Icon } from "@/components/Icon";
import Header from "./Header";
import Footer from "./Footer";

export default function ForgotPasswordPage() {
  const href = useHref();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendOtp(email, "password_reset");
      setStep(2);
    } catch {
      setError("Couldn't send a reset code. Check the email address and try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await resetPassword(email, code, newPassword);
      router.push(href.login());
    } catch (err) {
      setError(err instanceof ApiError ? "That code is invalid or expired." : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <div className="wrap">
        <div className="auth-wrap">
          <div className="auth-card">
            <Icon id="i-shield" w={28} className="auth-icon" />
            <h1>Reset your password</h1>
            {step === 1 ? (
              <>
                <p className="auth-sub">Enter your account email and we&rsquo;ll send you a reset code.</p>
                <form onSubmit={requestCode}>
                  <div className="ck-field">
                    <label>Email address</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </div>
                  {error ? (
                    <p className="cart-detail-error" role="alert" style={{ marginBottom: 12 }}>
                      {error}
                    </p>
                  ) : null}
                  <button className="bk-cta" type="submit" disabled={busy} style={{ width: "100%" }}>
                    {busy ? "Sending…" : "Send reset code"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="auth-sub">Enter the 6-digit code sent to {email} and choose a new password.</p>
                <form onSubmit={submitReset}>
                  <div className="ck-field">
                    <label>Reset code</label>
                    <input required maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" />
                  </div>
                  <div className="ck-field">
                    <label>New password</label>
                    <input
                      type="password"
                      required
                      minLength={10}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  {error ? (
                    <p className="cart-detail-error" role="alert" style={{ marginBottom: 12 }}>
                      {error}
                    </p>
                  ) : null}
                  <button className="bk-cta" type="submit" disabled={busy} style={{ width: "100%" }}>
                    {busy ? "Resetting…" : "Reset password"}
                  </button>
                </form>
              </>
            )}
            <p className="auth-foot">
              <Link href={href.login()}>Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
