"use client";

import { useCart, useCartCount } from "@/lib/cart";
import { money } from "@/lib/catalogue";

/** Live basket total text — a client island dropped into an otherwise
 * server-rendered header, matching the static site's data-basket-total. */
export function BasketTotal() {
  const { cart } = useCart();
  return <>{money(cart?.subtotal ?? 0)}</>;
}
export function BasketCount() {
  const count = useCartCount();
  if (!count) return null;
  return <>{count}</>;
}
