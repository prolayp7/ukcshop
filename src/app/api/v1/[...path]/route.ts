import type { NextRequest } from "next/server";

// The API is private: browsers only ever talk to the storefront, and this route forwards their
// /api/v1/* calls (auth, cart, checkout, account, payment webhooks) to UKSHOP_API_URL server-side.
// Bodies are forwarded as raw bytes so webhook signatures (Stripe, PayPal) still verify.
const API_BASE = (process.env.UKSHOP_API_URL ?? "http://localhost:3000/api/v1").replace(/\/$/, "");

// Request headers the API reads; everything else (cookies, host, ...) stays at the storefront.
const FORWARDED_REQUEST_HEADERS = ["accept", "authorization", "content-type", "idempotency-key", "x-guest-token", "x-request-id", "stripe-signature"];
// Hop-by-hop / encoding headers must not be copied back: fetch has already decoded the body.
const DROPPED_RESPONSE_HEADERS = new Set(["connection", "content-encoding", "content-length", "keep-alive", "transfer-encoding"]);

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API_BASE}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // PayPal signs webhooks with its own paypal-* headers.
  request.headers.forEach((value, name) => { if (name.startsWith("paypal-")) headers.set(name, value); });
  // Pass on the client address the reverse proxy in front of the storefront saw, so the API's
  // per-IP rate limit counts customers individually rather than all as the storefront server.
  const clientIp = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, { method: request.method, headers, body: hasBody ? await request.arrayBuffer() : undefined, cache: "no-store", redirect: "manual" });
  } catch {
    return Response.json({ error: { code: "API_UNAVAILABLE", message: "The store is temporarily unavailable. Please try again." } }, { status: 503 });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => { if (!DROPPED_RESPONSE_HEADERS.has(name)) responseHeaders.set(name, value); });
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
