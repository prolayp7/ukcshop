"use client";

import { useSyncExternalStore } from "react";

/**
 * Client-side transport for the storefront API's interactive surface (auth,
 * cart, addresses, orders, wishlist) - everything that needs a real browser
 * session (bearer token / guest token / mutations), unlike the read-only
 * catalog fetchers in src/lib/api.ts which run server-side behind Next API
 * proxy routes. Called directly from "use client" components.
 */

const AUTH_KEY = "ukcs.auth";
const GUEST_TOKEN_KEY = "ukcs.guestToken";
const EVENT = "ukcs:auth-changed";

export interface Customer {
  id: number;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  emailVerified?: boolean;
}
interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  customer: Customer;
}

function lsGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/availability errors
  }
}

// useSyncExternalStore requires getSnapshot to return a stable reference
// when nothing has changed (see the equivalent note in basket.ts), but
// lsGet() JSON.parses a fresh object on every call - cache it and only
// re-read when writeAuth() actually changes something.
let authCache: StoredAuth | null | undefined;
function readAuth(): StoredAuth | null {
  if (authCache === undefined) authCache = lsGet<StoredAuth>(AUTH_KEY);
  return authCache;
}
function writeAuth(value: StoredAuth | null) {
  authCache = value;
  lsSet(AUTH_KEY, value);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}
function readGuestToken(): string | null {
  return lsGet<string>(GUEST_TOKEN_KEY);
}
function writeGuestToken(value: string | null) {
  lsSet(GUEST_TOKEN_KEY, value);
}

export function getCurrentCustomer(): Customer | null {
  return readAuth()?.customer ?? null;
}
export function isLoggedIn(): boolean {
  return readAuth() !== null;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_UKSHOP_API_URL ?? "http://localhost:3000/api/v1";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function rawRequest(path: string, init: RequestInit, accessToken?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    const guestToken = readGuestToken();
    if (guestToken) headers.set("X-Guest-Token", guestToken);
  }
  return fetch(apiUrl(path), { ...init, headers });
}

// Refresh tokens rotate server-side (each use revokes the old one), so two
// requests that 401 at the same moment must share one refresh attempt -
// otherwise the second call reuses an already-rotated-out token, fails, and
// wrongly logs the user out. inFlightRefresh de-dupes concurrent callers.
let inFlightRefresh: Promise<StoredAuth | null> | null = null;

async function tryRefresh(refreshToken: string): Promise<StoredAuth | null> {
  if (inFlightRefresh) return inFlightRefresh;
  inFlightRefresh = (async () => {
    const res = await fetch(apiUrl("auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const current = readAuth();
    if (!current) return null;
    const next: StoredAuth = { ...current, accessToken: body.data.accessToken, refreshToken: body.data.refreshToken };
    writeAuth(next);
    return next;
  })();
  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

/** Core request helper: attaches bearer/guest auth, refreshes an expired
 * access token once and retries, and captures a freshly-minted guest token
 * from cart-shaped responses. Returns the full response envelope - use
 * request() below to unwrap plain {data}, or read `.meta` directly for a
 * paginated list. */
export async function requestRaw<T>(path: string, init: RequestInit = {}): Promise<{ data: T; meta?: unknown }> {
  const auth = readAuth();
  let res = await rawRequest(path, init, auth?.accessToken);

  if (res.status === 401 && auth) {
    const refreshed = await tryRefresh(auth.refreshToken);
    if (refreshed) {
      res = await rawRequest(path, init, refreshed.accessToken);
    } else {
      writeAuth(null);
    }
  }

  if (res.status === 204) return { data: undefined as T };
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body?.error?.message ?? `Request failed (${res.status})`, body?.error?.code ?? "UNKNOWN", res.status);
  }
  if (body?.data && typeof body.data === "object" && "guestToken" in body.data) {
    writeGuestToken(body.data.guestToken ?? null);
  }
  return body;
}

/** The common case - unwraps straight to `.data`. */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await requestRaw<T>(path, init);
  return data;
}

function asJsonBody(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}

/* ------------------------------- Auth ---------------------------------- */

export async function login(email: string, password: string): Promise<Customer> {
  const result = await request<{ accessToken: string; refreshToken: string; customer: Customer }>("auth/login", asJsonBody({ email, password }));
  writeAuth(result);
  await mergeGuestCartIfAny();
  return result.customer;
}

export async function register(input: { email: string; password: string; firstName: string; lastName: string; phone?: string }): Promise<Customer> {
  const result = await request<{ accessToken: string; refreshToken: string; customer: Customer }>("auth/register", asJsonBody(input));
  writeAuth(result);
  await mergeGuestCartIfAny();
  return result.customer;
}

export async function logout(): Promise<void> {
  const auth = readAuth();
  writeAuth(null);
  if (auth?.refreshToken) {
    await request("auth/logout", asJsonBody({ refreshToken: auth.refreshToken })).catch(() => {});
  }
}

export function sendOtp(email: string, purpose: "email_verification" | "password_reset"): Promise<void> {
  return request("auth/otp/send", asJsonBody({ email, purpose }));
}

export function subscribeNewsletter(email: string): Promise<void> {
  return request("newsletter/subscribe", asJsonBody({ email }));
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await request("auth/password/reset", asJsonBody({ email, code, newPassword }));
}

export async function fetchMe(): Promise<Customer> {
  const customer = await request<Customer>("me");
  const current = readAuth();
  if (current) writeAuth({ ...current, customer });
  return customer;
}

export async function updateProfile(patch: { firstName?: string; lastName?: string; phone?: string }): Promise<Customer> {
  const customer = await request<Customer>("me", { method: "PATCH", body: JSON.stringify(patch) });
  const current = readAuth();
  if (current) writeAuth({ ...current, customer });
  return customer;
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request("me/password", asJsonBody({ currentPassword, newPassword }));
}

/** Merges a guest cart into the just-logged-in customer's cart, if one
 * exists locally. Best-effort - a failed merge shouldn't block login. */
async function mergeGuestCartIfAny(): Promise<void> {
  const guestToken = readGuestToken();
  if (!guestToken) return;
  writeGuestToken(null);
  await request("cart/merge", asJsonBody({ guestToken })).catch(() => {});
  const { Cart } = await import("./cart");
  await Cart.refresh();
}

function subscribeAuth(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

const getServerCustomer = () => null;
export function useCustomerAuth(): { customer: Customer | null; isLoggedIn: boolean } {
  const customer = useSyncExternalStore(subscribeAuth, getCurrentCustomer, getServerCustomer);
  return { customer, isLoggedIn: customer !== null };
}
