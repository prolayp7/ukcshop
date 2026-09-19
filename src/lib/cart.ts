"use client";

import { showAddedToCart } from "@/components/AddedToCartToast";
import { toast, notifyFailure } from "./notifications";
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
    const next = await notifyFailure("Could not add to your basket", () => request<CartData>("cart/items", { method: "POST", body: JSON.stringify({ productVariantId, quantity }) }));
    setCart(next);
    const line = next.items.find((item) => item.productVariantId === productVariantId);
    if (line) showAddedToCart(line, quantity, next.subtotal);
    else toast.success("Added to your basket", { id: "added-to-cart", description: "Your basket has been updated." });
  },
  async setQty(productVariantId: number, quantity: number): Promise<void> {
    if (quantity <= 0) return Cart.remove(productVariantId);
    const next = await notifyFailure("Could not update your basket", () => request<CartData>(`cart/items/${productVariantId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }));
    setCart(next);
    toast.info("Basket updated", { id: `cart-quantity-${productVariantId}`, description: `Quantity changed to ${quantity}.` });
  },
  async remove(productVariantId: number): Promise<void> {
    const removed = cartCache?.items.find((item) => item.productVariantId === productVariantId);
    const next = await notifyFailure("Could not remove this item", () => request<CartData>(`cart/items/${productVariantId}`, { method: "DELETE" }));
    setCart(next);
    toast.info("Removed from your basket", {
      description: removed ? `${removed.variant.product.title} was removed.` : "Your basket has been updated.",
      action: removed ? { label: "Undo", onClick: () => { void Cart.add(productVariantId, removed.quantity).catch(() => {}); } } : undefined,
    });
  },
  async validateCoupon(code: string): Promise<{ code: string; discountType: string; discountAmount: number; freeShipping: boolean }> {
    return notifyFailure("This coupon cannot be applied", () => request("cart/coupon/validate", { method: "POST", body: JSON.stringify({ code }) }));
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
