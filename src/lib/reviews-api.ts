"use client";

import { request } from "./storefront-client";
import type { ApiReview } from "./api";

export interface ReviewInput {
  productId: number;
  rating: number;
  title?: string;
  comment?: string;
}

/** New reviews start as PENDING and only appear publicly once an admin
 * approves them (see the storefront reviews list, which filters to
 * APPROVED) - the caller should tell the customer that, not expect the
 * review to show up in the list right after this resolves. */
export function submitReview(input: ReviewInput): Promise<ApiReview> {
  return request("reviews", { method: "POST", body: JSON.stringify(input) });
}
