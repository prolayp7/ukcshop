// Cache tags for admin-managed storefront data. Every cached fetch of this data carries one of these
// tags, and the API (ukshop-api src/modules/revalidation/cache-tags.ts, which must stay in step with
// this file) asks /api/revalidate to clear exactly the tags an admin change affects.

export const CacheTags = {
  /** Homepage sections, hero slides and badges, banners and featured rails. */
  homepage: "homepage",
  /** Settings > General, footer, top bar and account-creation page content. */
  settings: "settings",
  /** Header mega menu and footer menu. */
  menus: "menus",
  /** The category tree and category listings. */
  categories: "categories",
  category: (id: number) => `category:${id}`,
  categorySlug: (slug: string) => `category-slug:${slug}`,
  /** Product listings (category pages, search, deals, rails). */
  products: "products",
  attributes: "attributes",
  product: (id: number) => `product:${id}`,
  productSlug: (slug: string) => `product-slug:${slug}`,
  brands: "brands",
  brand: (id: number) => `brand:${id}`,
  brandSlug: (slug: string) => `brand-slug:${slug}`,
  cmsPageSlug: (slug: string) => `cms-page-slug:${slug}`,
  faqs: "faqs",
  testimonials: "testimonials",
} as const;

const FIXED_TAGS = new Set(["homepage", "settings", "menus", "categories", "products", "attributes", "brands", "faqs", "testimonials"]);
const RESOURCE_TAG = /^(category|product|brand)(-slug)?:[a-z0-9-]{1,200}$|^cms-page-slug:[a-z0-9-]{1,200}$/;

/** Only tags this storefront actually uses can be revalidated (no arbitrary invalidation). */
export function isKnownCacheTag(tag: unknown): tag is string {
  return typeof tag === "string" && (FIXED_TAGS.has(tag) || RESOURCE_TAG.test(tag));
}

const FIXED_PATHS = new Set(["/", "/brands", "/category", "/deals", "/faqs", "/testimonials"]);
const SLUG = "[a-z0-9][a-z0-9-]{0,199}";
const PUBLIC_PATHS = [
  new RegExp(`^/brand/${SLUG}$`),
  new RegExp(`^/category/${SLUG}(?:/${SLUG})*$`),
  new RegExp(`^/pages/${SLUG}$`),
  new RegExp(`^/product/${SLUG}$`),
];

/** Only public content routes can be invalidated; query strings and encoded path tricks are rejected. */
export function isRevalidatablePath(path: unknown): path is string {
  return typeof path === "string" && path.length <= 300 && (FIXED_PATHS.has(path) || PUBLIC_PATHS.some((pattern) => pattern.test(path)));
}
