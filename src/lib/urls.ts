import type { CategoryPaths } from "./category-paths";

/**
 * Mirrors the static site's Shop.url(). Takes a design slug for parity with
 * ukshop-store (which routes multiple designs under /[design]/...), but this
 * build only ever renders one design chosen at build time (see THEME in
 * src/lib/designs.ts), so slug is always "" here and base resolves empty.
 */
function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return s ? `?${s}` : "";
}

export function makeHref(slug = "", categoryPaths: CategoryPaths = {}) {
  const base = slug ? `/${slug}` : "";
  return {
    home: () => base || "/",
    /** Canonical category URLs (/category/parent/child, /deals). `cat`/`sub` take a category title or
     * slug; an unknown one falls back to the legacy query URL, which the /category route resolves or 404s. */
    category: (params?: { cat?: string; sub?: string; sort?: string; featured?: number; deals?: number; q?: string }) => {
      const { cat, sub, deals, ...rest } = params ?? {};
      const name = sub || cat;
      const path = name ? categoryPaths[name.toLowerCase()] : undefined;
      if (path) return `${base}${path}${qs({ ...rest, deals })}`;
      if (name) return `${base}/category${qs(params)}`;
      if (deals) return `${base}/deals${qs(rest)}`;
      return `${base}/category${qs(rest)}`;
    },
    product: (id: number | string) => `${base}/product/${id}`,
    brand: (name: string) => `${base}/brand/${encodeURIComponent(name)}`,
    brands: () => `${base}/brands`,
    basket: () => `${base}/basket`,
    checkout: () => `${base}/checkout`,
    compare: () => `${base}/compare`,
    account: (params?: { tab?: string }) => `${base}/account${qs(params)}`,
    login: (params?: { next?: string }) => `${base}/login${qs(params)}`,
    register: () => `${base}/register`,
    forgotPassword: () => `${base}/forgot-password`,
    order: (uuid: string) => `${base}/account/orders/${uuid}`,
    returnNew: (orderUuid: string) => `${base}/account/returns/new?order=${encodeURIComponent(orderUuid)}`,
    returnDetail: (returnNumber: string) => `${base}/account/returns/${encodeURIComponent(returnNumber)}`,
    invoice: (uuid: string) => `${base}/account/orders/${uuid}/invoice`,
  };
}
export type Href = ReturnType<typeof makeHref>;
