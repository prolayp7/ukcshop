"use client";

import { useSyncExternalStore } from "react";

/** Ephemeral "which product is open in Quick View" state — in-memory only
 * (unlike Basket/Wishlist/Compare in lib/basket.ts, this never needs to
 * survive a reload), using the same event + useSyncExternalStore pattern
 * so it stays SSR-safe without a hydration mismatch. */
let openId: number | null = null;
const EVENT = "ukcs:quickview-changed";

export function openQuickView(id: number) {
  openId = id;
  window.dispatchEvent(new Event(EVENT));
}
export function closeQuickView() {
  openId = null;
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
export function useQuickViewId(): number | null {
  return useSyncExternalStore(subscribe, () => openId, () => null);
}
