"use client";

import { toast } from "@/lib/notifications";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, ApiError } from "@/lib/storefront-client";
import { useHref } from "@/lib/design-context";
import { Icon } from "@/components/Icon";
import Header from "./Header";
import Footer from "./Footer";
import AuthPromo from "./AuthPromo";

export default function RegisterPage() {
  const href = useHref();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!firstName || !lastName) {
      setError("First and last name can't be blank.");
      return;
    }
    if (form.password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register({ ...form, firstName, lastName, email });
      toast.success("Account created");
      router.push(href.account());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
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
            <h1>Create an account</h1>
            <p className="auth-sub">Track orders, save addresses and build a wishlist.</p>
            <form onSubmit={submit}>
              <div className="ck-two">
                <div className="ck-field">
                  <label>First name</label>
                  <input required maxLength={120} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} autoComplete="given-name" />
                </div>
                <div className="ck-field">
                  <label>Last name</label>
                  <input required maxLength={120} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} autoComplete="family-name" />
                </div>
              </div>
              <div className="ck-field">
                <label>Email address</label>
                <input type="email" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              </div>
              <div className="ck-field">
                <label>Password</label>
                <input
                  type="password"
                  required
                  minLength={10}
                  maxLength={128}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              <p style={{ fontSize: 11.5, color: "var(--c-muted)", margin: "-10px 0 16px" }}>At least 10 characters.</p>
              {error ? (
                <p className="cart-detail-error" role="alert" style={{ marginBottom: 12 }}>
                  {error}
                </p>
              ) : null}
              <button className="bk-cta" type="submit" disabled={busy} style={{ width: "100%" }}>
                {busy ? "Creating account…" : "Create account"}
              </button>
            </form>
            <p className="auth-foot">
              Already have an account? <Link href={href.login()}>Sign in</Link>
            </p>
          </div>
          <AuthPromo />
        </div>
      </div>
      <Footer />
    </>
  );
}
