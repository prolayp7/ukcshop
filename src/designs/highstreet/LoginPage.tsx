"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, ApiError } from "@/lib/storefront-client";
import { useHref } from "@/lib/design-context";
import { Icon } from "@/components/Icon";
import Header from "./Header";
import Footer from "./Footer";
import AuthPromo from "./AuthPromo";

export default function LoginPage() {
  const href = useHref();
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") || "";
  // Only follow same-site relative paths - a bare "next" param straight from
  // the URL would otherwise let an attacker redirect a freshly logged-in
  // user to an external site (open redirect).
  const isSafeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\");
  const next = isSafeNext ? rawNext : href.account();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? "Incorrect email or password." : "Something went wrong. Try again.");
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
            <Icon id="i-user" w={28} className="auth-icon" />
            <h1>Sign in</h1>
            <p className="auth-sub">Access your orders, wishlist and saved addresses.</p>
            <form onSubmit={submit}>
              <div className="ck-field">
                <label>Email address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="ck-field">
                <label>Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="auth-row">
                <span />
                <Link className="auth-link" href={href.forgotPassword()}>
                  Forgot password?
                </Link>
              </div>
              {error ? (
                <p className="cart-detail-error" role="alert" style={{ marginBottom: 12 }}>
                  {error}
                </p>
              ) : null}
              <button className="bk-cta" type="submit" disabled={busy} style={{ width: "100%" }}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="auth-foot">
              New here? <Link href={href.register()}>Create an account</Link>
            </p>
          </div>
          <AuthPromo />
        </div>
      </div>
      <Footer />
    </>
  );
}
