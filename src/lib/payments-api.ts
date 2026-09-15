"use client";

import { request } from "./storefront-client";

export type PaymentProvider = "STRIPE" | "PAYPAL" | "TWOCHECKOUT";

export interface PaymentMethodInfo {
  provider: PaymentProvider;
  enabled: boolean;
}
export function listPaymentMethods(): Promise<PaymentMethodInfo[]> {
  return request("payments/methods");
}

export interface PaymentAttempt {
  attemptId: string;
  orderUuid: string;
  provider: PaymentProvider;
  status: string;
  amount: string;
  currency: string;
  redirectUrl: string | null;
  error: { code: string; message: string; retryable: boolean } | null;
  expiresAt: string | null;
}

/** A fresh idempotency key per call, not a stable one derived from the order -
 * a customer retrying after a declined/cancelled payment should get a new
 * PayPal order, not the same (possibly expired) one back. */
export function createPaymentAttempt(input: { orderUuid: string; email: string; provider: PaymentProvider }): Promise<PaymentAttempt> {
  return request("payments/attempts", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
}

export function capturePaymentAttempt(attemptId: string, email: string): Promise<PaymentAttempt> {
  return request(`payments/attempts/${encodeURIComponent(attemptId)}/capture`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
