"use client";

import { useSyncExternalStore } from "react";
import { request, ApiError } from "./storefront-client";

export interface CartLine {
  productVariantId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  onSale: boolean;
  savedForLater: boolean;
  variant: {
    id: number;
    title: string;
    stockQty: number;
    product: { id: number; title: string; slug: string };
  };
}
export interface CartData {
  guestToken: string | null;
  items: CartLine[];
  savedForLater: CartLine[];
  subtotal: number;
  totalWeightKg: number;
}

const EVENT = "ukcs:cart-changed";
let cartCache: CartData | null = null;
let loaded = false;
let inFlight: Promise<void> | null = null;

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

function setCart(next: CartData) {
  cartCache = next;
  loaded = true;
  notify();
}

async function load(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = request<CartData>("cart")
    .then(setCart)
    .catch(() => {
      loaded = true;
      notify();
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export const Cart = {
  /** Current cached cart, or null before the first load resolves. */
  data(): CartData | null {
    if (!loaded && typeof window !== "undefined") void load();
    return cartCache;
  },
  isLoaded(): boolean {
    return loaded;
  },
  count(): number {
    return (cartCache?.items ?? []).reduce((n, l) => n + l.quantity, 0);
  },
  async add(productVariantId: number, quantity = 1): Promise<void> {
    const next = await request<CartData>("cart/items", { method: "POST", body: JSON.stringify({ productVariantId, quantity }) });
    setCart(next);
  },
  async setQty(productVariantId: number, quantity: number): Promise<void> {
    if (quantity <= 0) return Cart.remove(productVariantId);
    const next = await request<CartData>(`cart/items/${productVariantId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
    setCart(next);
  },
  async remove(productVariantId: number): Promise<void> {
    const next = await request<CartData>(`cart/items/${productVariantId}`, { method: "DELETE" });
    setCart(next);
  },
  async validateCoupon(code: string): Promise<{ code: string; discountType: string; discountAmount: number; freeShipping: boolean }> {
    return request("cart/coupon/validate", { method: "POST", body: JSON.stringify({ code }) });
  },
  async refresh(): Promise<void> {
    await load();
  },
};

export { ApiError };

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
const getServerCart = () => null;
const getServerLoaded = () => false;

export function useCart(): { cart: CartData | null; loaded: boolean } {
  const cart = useSyncExternalStore(subscribe, Cart.data, getServerCart);
  const isLoaded = useSyncExternalStore(subscribe, Cart.isLoaded, getServerLoaded);
  return { cart, loaded: isLoaded };
}
export function useCartCount(): number {
  return useSyncExternalStore(subscribe, Cart.count, () => 0);
}
