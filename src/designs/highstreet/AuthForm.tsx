"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { ApiError, login, register, sendOtp, verifyEmailOtp } from "@/lib/storefront-client";
import { toast } from "@/lib/notifications";
import { useHref } from "@/lib/design-context";
import { theme } from "@/lib/theme.config";
import styles from "./auth.module.css";

const OTP_LENGTH = 6;

/** Six single-digit boxes standing in for one code value, auto-advancing on
 * type/backspace and accepting a full pasted code in any box. */
function OtpBoxes({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  function fillFrom(index: number, raw: string) {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) return;
    const next = digits.slice();
    for (let i = 0; i < digitsOnly.length && index + i < OTP_LENGTH; i++) next[index + i] = digitsOnly[i];
    onChange(next.join(""));
    refs.current[Math.min(index + digitsOnly.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    if (!raw) { const next = digits.slice(); next[index] = ""; onChange(next.join("")); return; }
    fillFrom(index, raw);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
    else if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const raw = event.clipboardData.getData("text");
    if (!/\d/.test(raw)) return;
    event.preventDefault();
    fillFrom(index, raw);
  }

  return <div className={styles.otpRow}>
    {digits.map((digit, index) => (
      <input
        key={index}
        ref={element => { refs.current[index] = element; }}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={1}
        value={digit}
        disabled={disabled}
        onChange={event => handleChange(index, event)}
        onKeyDown={event => handleKeyDown(index, event)}
        onPaste={event => handlePaste(index, event)}
        aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
        autoFocus={index === 0}
      />
    ))}
  </div>;
}

export default function AuthForm({ registration = false, next }: { registration?: boolean; next?: string }) {
  const href = useHref();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const strength = Number(password.length >= 10) + Number(password.length >= 14) + Number(/[a-z]/.test(password) && /[A-Z]/.test(password)) + Number(/\d/.test(password) && /[^A-Za-z0-9]/.test(password));

  // Registration only: after the account is created, step 2 collects the
  // emailed verification code on this same form before logging the customer in.
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const firstName = String(data.get("firstName") || "").trim();
    const lastName = String(data.get("lastName") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const invalid: Record<string, string> = {};
    if (registration && !firstName) invalid.firstName = "Enter your first name.";
    if (registration && !lastName) invalid.lastName = "Enter your last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.email = "Enter a valid email address.";
    if (registration && phone && !/^\+?[\d\s().-]{7,30}$/.test(phone)) invalid.phone = "Enter a valid phone number.";
    if (!password) invalid.password = "Enter your password.";
    else if (registration && password.length < 10) invalid.password = "Use at least 10 characters for your password.";
    setError("");
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      (form.elements.namedItem(Object.keys(invalid)[0]) as HTMLInputElement)?.focus();
      return;
    }
    setBusy(true);
    try {
      if (registration) {
        await register({ firstName, lastName, email, password, phone: phone || undefined });
        setPendingEmail(email);
        setStep(2);
      } else {
        await login(email, password);
        toast.success("Signed in successfully");
        router.push(next || href.account());
      }
    } catch (err) {
      setError(err instanceof ApiError ? (!registration && err.status === 401 ? "Incorrect email or password. Please try again." : err.message) : "We couldn’t connect. Please try again.");
    } finally { setBusy(false); }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (code.length < OTP_LENGTH) { setError("Enter all 6 digits."); return; }
    setBusy(true);
    setError("");
    try {
      await verifyEmailOtp(pendingEmail, code);
      toast.success("Account verified");
      router.push(next || href.account());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn’t connect. Please try again.");
    } finally { setBusy(false); }
  }

  async function resendCode() {
    if (resending) return;
    setResending(true);
    setResent(false);
    setError("");
    try {
      await sendOtp(pendingEmail, "email_verification");
      setResent(true);
    } catch {
      setError("Couldn’t resend the code. Please try again.");
    } finally { setResending(false); }
  }

  const fieldError = (name: string) => errors[name] ? <small id={`${name}-error`} className={styles.fieldError}>{errors[name]}</small> : null;

  if (registration && step === 2) return <>
    <h1 id="auth-heading">Check your inbox.<br /><em>One more step.</em></h1>
    <p className={styles.intro}>We&rsquo;ve sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below to verify your account and sign in.</p>
    <div className={styles.security}><Mail size={19} /><p><strong>Check your spam folder too.</strong>The code expires after 10 minutes.</p></div>
    <form className={styles.form} noValidate onSubmit={submitCode} aria-busy={busy}>
      <div className={styles.field}>
        <div className={styles.labelRow}><label>Verification code <b>*</b></label><button type="button" className={styles.recoveryAction} disabled={busy} onClick={() => { setStep(1); setCode(""); setError(""); setResent(false); }}>Change email</button></div>
        <OtpBoxes value={code} onChange={setCode} disabled={busy} />
      </div>
      {error && <p className={styles.error} role="alert"><AlertCircle size={18} />{error}</p>}
      {resent && !error && <p className={styles.hint}>A new code is on its way.</p>}
      <button className={styles.submit} type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify & continue"}<ArrowRight size={18} /></button>
    </form>
    <div className={styles.switchAccount}>Didn&rsquo;t get a code?<button type="button" className={styles.recoveryAction} disabled={resending} onClick={() => void resendCode()}>{resending ? "Sending…" : "Resend code"}</button></div>
  </>;

  return <>
    <h1 id="auth-heading">{registration ? <>Create your account.<br /><em>Make your next upgrade yours.</em></> : <>Welcome back.<br /><em>Your setup. Your account.</em></>}</h1>
    <p className={styles.intro}>{registration ? `Join ${theme.brand.name} to save your favourite components, track orders and keep your details ready for checkout.` : "Sign in to access your orders, revisit your wishlist and pick up where you left off."}</p>
    {registration && <div className={styles.security}><ShieldCheck size={19} /><p><strong>Everything for your next setup.</strong>One account for components, computers, laptops and accessories.</p></div>}
    <form className={styles.form} noValidate onSubmit={submit} aria-busy={busy} onChange={event => {
      const name = event.target instanceof HTMLInputElement ? event.target.name : "";
      if (errors[name]) setErrors(previous => { const updated = { ...previous }; delete updated[name]; return updated; });
    }}>
      {registration && <div className={styles.twoColumns}>{[{ name: "firstName", label: "First name", autocomplete: "given-name" }, { name: "lastName", label: "Last name", autocomplete: "family-name" }].map(field => <div className={styles.field} key={field.name}>
        <label htmlFor={field.name}>{field.label} <b>*</b></label>
        <input id={field.name} name={field.name} required maxLength={120} autoComplete={field.autocomplete} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} />{fieldError(field.name)}
      </div>)}</div>}
      <div className={styles.field}><label htmlFor="email">Email address <b>*</b></label><div className={styles.input}><Mail size={17} /><input id="email" name="email" type="email" required maxLength={255} autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} /></div>{fieldError("email")}</div>
      {registration && <div className={styles.field}><label htmlFor="phone">Phone number <span>(optional)</span></label><input id="phone" name="phone" type="tel" maxLength={30} autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />{fieldError("phone")}</div>}
      <div className={styles.field}><div className={styles.labelRow}><label htmlFor="password">{registration ? "Create password" : "Password"} <b>*</b></label>{!registration && <Link href={href.forgotPassword()}>Forgot password?</Link>}</div>
        <div className={styles.input}><LockKeyhole size={17} /><input id="password" name="password" type={visible ? "text" : "password"} required maxLength={128} minLength={registration ? 10 : undefined} autoComplete={registration ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder={registration ? "At least 10 characters" : "Enter your password"} aria-invalid={!!errors.password} aria-describedby={[registration ? "password-hint" : "", errors.password ? "password-error" : ""].filter(Boolean).join(" ") || undefined} /><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        {registration && <><small id="password-hint" className={styles.hint}>Use at least 10 characters. A longer, unique password is best.</small>{password && <div className={styles.strength}><div>{[0, 1, 2, 3].map(index => <span key={index} data-filled={index < strength} />)}</div><small>{["Weak", "Weak", "Fair", "Good", "Strong"][strength]}</small></div>}</>}{fieldError("password")}
      </div>
      {!registration && <div className={styles.security}><LockKeyhole size={18} /><p><strong>Your account, in one place.</strong>Manage your orders, wishlist and saved delivery addresses.</p></div>}
      {error && <p className={styles.error} role="alert"><AlertCircle size={18} />{error}</p>}
      <button className={styles.submit} type="submit" disabled={busy}>{busy ? (registration ? "Creating account…" : "Signing in…") : (registration ? "Create free account" : `Sign in to ${theme.brand.name}`)}<ArrowRight size={18} /></button>
    </form>
    <div className={styles.switchAccount}>{registration ? "Already have an account?" : `New to ${theme.brand.name}?`}<Link href={registration ? href.login() : href.register()}>{registration ? "Sign in to your account" : "Create your free account"}<ArrowRight size={15} /></Link></div>
  </>;
}
