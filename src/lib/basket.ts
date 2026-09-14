"use client";

import { useCallback, useSyncExternalStore } from "react";
import { byId } from "./catalogue";
import { Product } from "./types";
import { request, useCustomerAuth, isLoggedIn as customerIsLoggedIn } from "./storefront-client";

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = JSON.parse(window.localStorage.getItem("ukcs." + key) ?? "null");
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}
function lsSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("ukcs." + key, JSON.stringify(value));
  } catch {
    // ignore quota/availability errors, same as the static site
  }
}

/** Fired whenever any tab-local store below changes, so every mounted hook
 * instance (header badge, drawer, page body) re-reads localStorage and
 * re-renders — mirrors the static site's document-wide refresh functions.
 *
 * useSyncExternalStore requires getSnapshot to return a *stable reference*
 * when nothing has changed, or React treats every render as a store change
 * and loops forever. Compare.products() builds a fresh array on every call,
 * so the object-returning snapshots below are cached here and only
 * recomputed when notify() fires. */
const EVENT = "ukcs:store-changed";
let compareCache: Product[] | null = null;
let recentCache: number[] | null = null;
function notify() {
  compareCache = null;
  recentCache = null;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export interface WishlistItem {
  productVariantId: number;
  productId: number;
  productTitle: string;
  productSlug: string;
  variantTitle: string;
  price: number;
  salePrice: number | null;
}
interface ApiWishlistItem {
  productVariantId: number;
  productVariant: {
    title: string;
    price: string;
    salePrice: string | null;
    product: { id: number; title: string; slug: string };
  };
}
const WISHLIST_EVENT = "ukcs:wishlist-changed";
const EMPTY_WISHLIST: WishlistItem[] = [];
let wishlistCache: WishlistItem[] | null = null;
let wishlistLoaded = false;
let wishlistLoadedFor = false; // the login state the cache above was loaded under
let wishlistInFlight: Promise<void> | null = null;

function toWishlistItem(item: ApiWishlistItem): WishlistItem {
  return {
    productVariantId: item.productVariantId,
    productId: item.productVariant.product.id,
    productTitle: item.productVariant.product.title,
    productSlug: item.productVariant.product.slug,
    variantTitle: item.productVariant.title,
    price: Number(item.productVariant.price),
    salePrice: item.productVariant.salePrice !== null ? Number(item.productVariant.salePrice) : null,
  };
}
function setWishlist(items: ApiWishlistItem[]) {
  wishlistCache = items.map(toWishlistItem);
  wishlistLoaded = true;
  wishlistLoadedFor = customerIsLoggedIn();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WISHLIST_EVENT));
}
async function loadWishlist(): Promise<void> {
  if (!customerIsLoggedIn()) {
    wishlistCache = [];
    wishlistLoaded = true;
    wishlistLoadedFor = false;
    return;
  }
  if (wishlistInFlight) return wishlistInFlight;
  wishlistInFlight = request<{ items: ApiWishlistItem[] }>("wishlist")
    .then((data) => setWishlist(data.items))
    .catch(() => {
      wishlistCache = [];
      wishlistLoaded = true;
    })
    .finally(() => {
      wishlistInFlight = null;
    });
  return wishlistInFlight;
}

/** Customer-only (the storefront API has no guest wishlist) - see
 * docs/6-day-completion-plan.md Day 4. Signed-out visitors are sent to
 * /login from WishlistButton rather than falling back to a local list. */
export const Wishlist = {
  items(): WishlistItem[] {
    if ((!wishlistLoaded || wishlistLoadedFor !== customerIsLoggedIn()) && typeof window !== "undefined") void loadWishlist();
    return wishlistCache ?? EMPTY_WISHLIST;
  },
  has(productId: number): boolean {
    return Wishlist.items().some((i) => i.productId === productId);
  },
  async toggle(productId: number, productVariantId: number): Promise<void> {
    const existing = Wishlist.items().find((i) => i.productId === productId);
    const data = existing
      ? await request<{ items: ApiWishlistItem[] }>(`wishlist/items/${existing.productVariantId}`, { method: "DELETE" })
      : await request<{ items: ApiWishlistItem[] }>("wishlist/items", { method: "POST", body: JSON.stringify({ productVariantId }) });
    setWishlist(data.items);
  },
};

export const COMPARE_MAX = 4;
export const Compare = {
  // Stores full product snapshots, not bare ids: `byId()` only resolves
  // against the static mock catalogue, which doesn't contain real API
  // product ids, so a snapshot taken at toggle-time (when the caller
  // already has the real Product in hand) is the only reliable way to
  // read it back - same reasoning as Wishlist storing its own item fields.
  raw(): Product[] {
    return lsGet("compare", [] as Product[]);
  },
  save(v: Product[]) {
    lsSet("compare", v);
    notify();
  },
  has(id: number | string): boolean {
    return Compare.raw().some((p) => p.id === Number(id));
  },
  toggle(product: Product): boolean {
    const v = Compare.raw();
    const i = v.findIndex((p) => p.id === product.id);
    if (i > -1) {
      v.splice(i, 1);
      Compare.save(v);
      return false;
    }
    if (v.length >= COMPARE_MAX) return false;
    v.push(product);
    Compare.save(v);
    return true;
  },
  remove(id: number | string) {
    Compare.save(Compare.raw().filter((p) => p.id !== Number(id)));
  },
  clear() {
    Compare.save([]);
  },
  products(): Product[] {
    return Compare.raw();
  },
};

export const Recent = {
  raw(): number[] {
    return lsGet("recent", [] as number[]);
  },
  push(id: number | string) {
    const nid = Number(id);
    const r = Recent.raw().filter((x) => x !== nid);
    r.unshift(nid);
    lsSet("recent", r.slice(0, 10));
    notify();
  },
  products(n = 6, excludeId?: number | string): Product[] {
    const ex = excludeId !== undefined ? Number(excludeId) : null;
    return Recent.raw()
      .filter((id) => id !== ex)
      .map(byId)
      .filter((p): p is Product => p !== null)
      .slice(0, n);
  },
};

/** Client hooks — re-render whenever the underlying store changes. Reading
 * happens straight from localStorage rather than being cached in React
 * state, since these stores are shared across every component on the page
 * and the source of truth already lives outside React.
 *
 * useSyncExternalStore, not useState+useEffect: the server (and the
 * client's first hydration pass) has no localStorage, so getServerSnapshot
 * always returns the same fixed "empty" value — guaranteeing the server-
 * rendered HTML and React's first client render agree exactly. The real
 * value then appears in a normal post-hydration re-render, which is not a
 * mismatch because it happens after hydration completes, not during it. */
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
function subscribeWishlist(callback: () => void) {
  window.addEventListener(WISHLIST_EVENT, callback);
  window.addEventListener("ukcs:auth-changed", callback);
  return () => {
    window.removeEventListener(WISHLIST_EVENT, callback);
    window.removeEventListener("ukcs:auth-changed", callback);
  };
}

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_IDS: number[] = [];
const getServerProducts = () => EMPTY_PRODUCTS;

export function useWishlist() {
  const { isLoggedIn } = useCustomerAuth();
  const items = useSyncExternalStore(subscribeWishlist, Wishlist.items, () => EMPTY_WISHLIST);
  return {
    has: (productId: number) => items.some((i) => i.productId === productId),
    toggle: useCallback((productId: number, productVariantId: number) => Wishlist.toggle(productId, productVariantId), []),
    items,
    count: items.length,
    isLoggedIn,
  };
}
export function useCompare() {
  const products = useSyncExternalStore(subscribe, () => (compareCache ??= Compare.products()), getServerProducts);
  return {
    has: (id: number | string) => products.some((p) => p.id === Number(id)),
    toggle: useCallback((product: Product) => Compare.toggle(product), []),
    products,
    count: products.length,
  };
}

/** Recently-viewed ids — used to seed both "recently viewed" rails and the
 * recommendation weighting. Same SSR-safe caching as the hooks above. */
export function useRecentIds(): number[] {
  return useSyncExternalStore(subscribe, () => (recentCache ??= Recent.raw()), () => EMPTY_IDS);
}
