export type StockStatus = "in" | "low" | "out";

export interface Product {
  image?: string | null;
  id: number;
  /** SEO-friendly lookup key used for /product/[slug] routes and API calls. */
  slug: string;
  /** The variant a cart/wishlist "add" should use when nothing more
   * specific has been picked (no variant-picker UI exists yet) - null for
   * a product with no purchasable variant. */
  defaultVariantId: number | null;
  sku: string;
  mpn: string;
  ean: string;
  name: string;
  brand: string;
  /** URL-routing key for the brand, distinct from the display name above. */
  brandSlug: string;
  category: string;
  subcategory: string;
  price: number;
  was: number | null;
  rating: number;
  reviews: number;
  stock: number;
  stockStatus: StockStatus;
  sold: number;
  added: string;
  isNew: boolean;
  icon: string;
  specs: Record<string, string>;
  attrs: Record<string, unknown>;
  inBox: string[];
}

export interface Crumb {
  label: string;
  href?: string;
}

export interface BrandSummary {
  brand: string;
  slug: string;
  count: number;
  rating: number;
  min: number;
  deals: number;
  note: string;
}

export interface CategoryTreeNode {
  category: string;
  count: number;
  subs: string[];
}

export const CAT_ORDER = [
  "PC Components",
  "Computers",
  "Laptops",
  "Peripherals",
  "Networking",
  "Accessories",
] as const;

export type Category = (typeof CAT_ORDER)[number];
