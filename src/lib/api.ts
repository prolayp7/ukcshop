/**
 * Server-only client for the UKShop API. UKSHOP_API_URL is deliberately not
 * NEXT_PUBLIC_*, so it never reaches the browser - never import this file
 * from a "use client" component. Mirrors the pattern used in ukshop-admin's
 * src/lib/auth.ts (server-only base URL, no client exposure), adapted here
 * for direct Server Component fetching rather than a Next-API-route proxy,
 * since these are public, read-only catalog/content endpoints with no
 * client-side interactivity or auth cookie involved.
 */
import { Product } from "./types";

function getStorefrontApiUrl(path: string): string {
  const baseUrl = process.env.UKSHOP_API_URL ?? "http://localhost:3000/api/v1";
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

// Admin-uploaded media is stored on the API server and served statically
// from its origin (not under /api/v1) at /uploads/<file> - resolve those
// to absolute URLs the browser can actually fetch. Anything else (e.g. the
// bundled placeholder images under /images/... in this repo's own public/
// folder) is already correct relative to the storefront itself, so it's
// left untouched.
function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/uploads/")) return path;
  const apiOrigin = new URL(process.env.UKSHOP_API_URL ?? "http://localhost:3000/api/v1").origin;
  return `${apiOrigin}${path}`;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Facets {
  specifications: { title: string; values: { value: string; count: number }[] }[];
  categories: { id: number; title: string; slug: string; count: number }[];
  brands: { id: number; title: string; slug: string; count: number }[];
  priceMin: number | null;
  priceMax: number | null;
}

export interface ListMeta extends PaginationMeta {
  facets: Facets;
}

async function apiGet<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const res = await fetch(getStorefrontApiUrl(path), { next: { revalidate: revalidateSeconds } });
  if (!res.ok) {
    throw new Error(`UKShop API request failed: GET ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiGetOrNull<T>(path: string, revalidateSeconds = 60): Promise<T | null> {
  const res = await fetch(getStorefrontApiUrl(path), { next: { revalidate: revalidateSeconds } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`UKShop API request failed: GET ${path} -> ${res.status}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

/* ---------------------------------------------------------------------- */
/* Raw API shapes (only the fields actually consumed are typed)           */
/* ---------------------------------------------------------------------- */

export interface ApiCategoryRef {
  id: number;
  title: string;
  slug: string;
}

export interface ApiCategory extends ApiCategoryRef {
  pageHeader?: string | null;
  additionalDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  isIndexable?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogImageAlt?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  twitterCard?: "SUMMARY" | "SUMMARY_LARGE_IMAGE";
  schemaType?: "AUTOMATIC" | "CUSTOM";
  customSchema?: string | null;
  faqSchema?: string | null;
  faqs?: { question: string; answer: string }[];
  parentId: number | null;
  description: string | null;
  showOnHomepage: boolean;
  productCount: number;
  coverImage: string | null;
  coverImageAlt: string | null;
  thumbnailImage: string | null;
  thumbnailImageAlt: string | null;
  children: ApiCategory[];
}

export interface ApiBrand {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  /** Only present on the list endpoint, not the single-brand lookup. */
  productCount?: number;
  priceFrom?: number | null;
}

interface ApiVariantAttribute {
  attribute: { title: string };
  attributeValue: { value: string };
}

interface ApiVariant {
  id: number;
  title: string;
  price: string;
  salePrice: string | null;
  stockQty: number;
  isDefault: boolean;
  attributes: ApiVariantAttribute[];
  images: { url: string; altText: string | null }[];
}

export interface ApiCompatibility {
  socket: string | null;
  compatibleSockets: string[];
  memoryType: string | null;
  wattageCapacity: number | null;
  wattageRequired: number | null;
}

export interface ApiProductBase {
  id: number;
  slug: string;
  title: string;
  sku: string | null;
  mpn: string | null;
  gtin: string | null;
  upc: string | null;
  shortDescription: string | null;
  description?: string | null;
  minimumOrderQuantity?: number;
  warrantyMonths?: number | null;
  outOfStockLabel?: string | null;
  inStockDeliveryTime?: string | null;
  outOfStockDeliveryTime?: string | null;
  isReturnable?: boolean;
  returnableDays?: number | null;
  category: ApiCategoryRef & { parent: ApiCategoryRef | null };
  brand: ApiCategoryRef | null;
  price: string | null;
  salePrice: string | null;
  inStock: boolean;
  stockQty?: number;
  defaultVariantId?: number | null;
  image?: string | null;
  images?: { url: string; altText: string | null }[];
  createdAt?: string;
  specsSummary?: Record<string, unknown> | null;
  reviewSummary?: { average: number; count: number; distribution?: Record<string, number> };
  faqs?: { id: number; question: string; answer: string }[];
  documents?: { id: number; title: string; url: string }[];
  variants?: ApiVariant[];
  compatibility?: ApiCompatibility | null;
}

export type ApiHomepageSectionType = "HERO" | "TRUST_STRIP" | "DEALS" | "FEATURED_PRODUCTS" | "NEW_ARRIVALS" | "BRANDS" | "TESTIMONIALS" | "FAQS" | "BANNERS" | "NEWSLETTER" | "CATEGORY_SHOWCASE" | "SHOP_BY_NEED" | "GAMING_SHOWCASE" | "LAPTOP_SHOWCASE" | "BUYING_GUIDES" | "SEO_INTRO";

export interface ApiHomeBundle {
  // Ordering/visibility for the sections below, set from the admin panel's
  // Homepage page - already sorted and filtered to visible by the API.
  homepageSections: { id: number; type: ApiHomepageSectionType; config: Record<string, unknown> }[];
  hero: {
    slides: {
      id: number;
      eyebrow: string | null;
      headline: string;
      subheading: string | null;
      image: string | null;
      imagePosition: string | null;
      tone: "VIOLET" | "ELECTRIC" | "CYAN" | "CRIMSON";
      ctaLabel: string | null;
      ctaUrl: string | null;
      secondaryCtaLabel: string | null;
      secondaryCtaUrl: string | null;
    }[];
    badges: { id: number; label: string; icon: string | null }[];
  };
  banners: { id: number; title: string; slug: string; position: string; linkType: string; customUrl: string | null; product: ApiCategoryRef | null; category: ApiCategoryRef | null; brand: ApiCategoryRef | null }[];
  featuredSections: { id: number; title: string; slug: string; sectionType: string; products: ApiProductBase[] }[];
}

export interface ApiPage {
  slug: string;
  title: string;
  contentBlocks: unknown;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface ApiFaqCategory {
  id: number;
  name: string;
  faqs: { id: number; question: string; answer: string }[];
}

export interface ApiTestimonial {
  id: number;
  name: string;
  title: string | null;
  quote: string;
  stars: number;
}

/* ---------------------------------------------------------------------- */
/* Adapter: real API product shape -> ukcshop's existing flat Product     */
/* type, so every downstream component (product cards, related rails,    */
/* basket line rendering) keeps working unchanged. Some mock-only fields  */
/* (icon, exact "sold" counts) have no real-schema equivalent and         */
/* gracefully degrade - see docs/6-day-completion-plan.md Day 3 notes.    */
/* ---------------------------------------------------------------------- */

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export function toProduct(api: ApiProductBase): Product {
  const price = api.price !== null ? Number(api.price) : 0;
  const sale = api.salePrice !== null ? Number(api.salePrice) : null;
  const createdAt = api.createdAt ?? new Date(0).toISOString();
  const stockQty = api.variants
    ? api.variants.reduce((sum, v) => sum + v.stockQty, 0)
    : (api.stockQty ?? (api.inStock ? Infinity : 0));

  return {
    id: api.id,
    image: resolveMediaUrl(productImage(api)),
    slug: api.slug,
    defaultVariantId: api.defaultVariantId ?? null,
    sku: api.sku ?? "",
    mpn: api.mpn ?? "",
    ean: api.gtin ?? api.upc ?? "",
    name: api.title,
    brand: api.brand?.title ?? "Unbranded",
    brandSlug: api.brand?.slug ?? "",
    // real schema: leaf category (e.g. "Graphics Cards") + its parent (e.g.
    // "PC Components") maps directly onto the mock's category/subcategory pair
    category: api.category.parent?.title ?? api.category.title,
    subcategory: api.category.parent ? api.category.title : api.category.title,
    price: sale ?? price,
    was: sale !== null ? price : null,
    rating: api.reviewSummary?.average ?? 0,
    reviews: api.reviewSummary?.count ?? 0,
    stock: Number.isFinite(stockQty) ? stockQty : 999,
    stockStatus: stockQty === 0 ? "out" : stockQty <= 5 ? "low" : "in",
    sold: 0, // no real equivalent (would need an orders aggregate per product)
    added: createdAt,
    isNew: Date.now() - new Date(createdAt).getTime() < THIRTY_DAYS_MS,
    icon: "package",
    specs: (api.specsSummary as Record<string, string>) ?? {},
    attrs: {},
    inBox: [],
  };
}

export function productImage(api: ApiProductBase): string | null {
  return api.images?.[0]?.url ?? api.image ?? null;
}

/* ---------------------------------------------------------------------- */
/* Public fetchers                                                        */
/* ---------------------------------------------------------------------- */

function resolveCategoryImages(category: ApiCategory): ApiCategory {
  return {
    ...category,
    ogImage: resolveMediaUrl(category.ogImage),
    twitterImage: resolveMediaUrl(category.twitterImage),
    coverImage: resolveMediaUrl(category.coverImage),
    thumbnailImage: resolveMediaUrl(category.thumbnailImage),
    children: (category.children ?? []).map(resolveCategoryImages),
  };
}

export function fetchCategoryTree(): Promise<ApiCategory[]> {
  return apiGet<{ data: ApiCategory[] }>("categories").then((r) => r.data.map(resolveCategoryImages));
}

export function fetchCategoryBySlug(slug: string) {
  return apiGetOrNull<ApiCategory>(`categories/${encodeURIComponent(slug)}`).then((category) => category ? resolveCategoryImages(category) : null);
}

export function fetchBrands(): Promise<ApiBrand[]> {
  return apiGet<{ data: ApiBrand[] }>("brands").then((r) => r.data);
}

export function fetchBrandBySlug(slug: string) {
  return apiGetOrNull<ApiBrand>(`brands/${encodeURIComponent(slug)}`);
}

export interface ProductListParams {
  q?: string;
  category?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc" | "discount_desc";
  onSale?: boolean;
  inStock?: boolean;
  specs?: string;
  page?: number;
  perPage?: number;
  /** Fetch this exact, ordered set of product ids instead of filtering. */
  ids?: number[];
}

export async function fetchProducts(params: ProductListParams = {}): Promise<{ items: Product[]; meta: ListMeta }> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    query.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const qs = query.toString();
  const res = await apiGet<{ data: ApiProductBase[]; meta: ListMeta }>(`products${qs ? `?${qs}` : ""}`);
  return { items: res.data.map(toProduct), meta: res.meta };
}

export async function fetchRecommendedProducts(limit = 4): Promise<Product[]> {
  const res = await apiGet<{ data: ApiProductBase[] }>(`products/recommended?limit=${limit}`);
  return res.data.map(toProduct);
}

export async function fetchProductBySlug(slug: string): Promise<{ product: Product; api: ApiProductBase } | null> {
  const api = await apiGetOrNull<ApiProductBase>(`products/${encodeURIComponent(slug)}`);
  if (!api) return null;
  const resolved = {
    ...api,
    documents: api.documents?.map((document) => ({ ...document, url: resolveMediaUrl(document.url) || document.url })),
    images: api.images?.map((image) => ({ ...image, url: resolveMediaUrl(image.url) || image.url })),
    variants: api.variants?.map((variant) => ({ ...variant, images: (variant.images ?? []).map((image) => ({ ...image, url: resolveMediaUrl(image.url) || image.url })) })),
  };
  return { product: toProduct(resolved), api: resolved };
}

export interface ApiReview {
  id: number;
  uuid: string;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewerName: string;
  createdAt: string;
  orderItemId: number | null;
}

export async function fetchReviews(productId: number, page = 1, perPage = 20): Promise<{ items: ApiReview[]; meta: PaginationMeta }> {
  const res = await apiGet<{ data: ApiReview[]; meta: PaginationMeta }>(`reviews?productId=${productId}&page=${page}&perPage=${perPage}`, 30);
  return { items: res.data, meta: res.meta };
}

export async function fetchCompatibleProducts(slug: string, category?: string, limit = 4): Promise<Product[]> {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  query.set("limit", String(limit));
  const res = await apiGet<{ data: ApiProductBase[] }>(`products/${encodeURIComponent(slug)}/compatible?${query.toString()}`);
  return res.data.map(toProduct);
}

export interface HomeBundle extends Omit<ApiHomeBundle, "featuredSections"> {
  featuredSections: { id: number; title: string; slug: string; sectionType: string; products: Product[] }[];
}

export async function fetchHome(): Promise<HomeBundle> {
  const home = await apiGet<{ data: ApiHomeBundle }>("home").then((r) => r.data);
  return {
    ...home,
    hero: { ...home.hero, slides: home.hero.slides.map((slide) => ({ ...slide, image: resolveMediaUrl(slide.image) })) },
    // Hero side cards' images live in the HERO section's freeform config JSON
    // (see ukshop-admin's Homepage page), so they need the same /uploads ->
    // absolute-URL treatment as slide images, done here rather than per-card
    // in the "use client" Home component, which can't see UKSHOP_API_URL.
    homepageSections: home.homepageSections.map((section) => {
      if (section.type !== "HERO" || !Array.isArray(section.config.cards)) return section;
      const cards = (section.config.cards as { image?: string | null }[]).map((card) => ({ ...card, image: resolveMediaUrl(card.image) }));
      return { ...section, config: { ...section.config, cards } };
    }),
    featuredSections: home.featuredSections.map((section) => ({ ...section, products: section.products.map(toProduct) })),
  };
}


export function fetchPageBySlug(slug: string) {
  return apiGetOrNull<ApiPage>(`pages/${encodeURIComponent(slug)}`);
}

export function fetchFaqs() {
  return apiGet<{ data: ApiFaqCategory[] }>("faqs").then((r) => r.data);
}

export function fetchTestimonials() {
  return apiGet<{ data: ApiTestimonial[] }>("testimonials").then((r) => r.data);
}

// Site-wide config authored in ukshop-admin's Settings > General tab. Every
// field is optional - the value is `{}` until an admin fills the form in, so
// callers fall back to hardcoded defaults (theme.config.ts) for anything unset.
export interface ApiGeneralSettings {
  logo?: string; favicon?: string;
  companyAddress?: string; supportPhone1?: string; supportPhone2?: string; supportEmail?: string;
  socialFacebook?: string; socialInstagram?: string; socialTwitter?: string; socialYoutube?: string;
  latitude?: string; longitude?: string;
  copyright?: string; vatNumber?: string; openingHours?: string; newsletterFromEmail?: string;
  metaTitle?: string; metaKeywords?: string; metaDescription?: string;
  googleSiteVerification?: string; bingSiteVerification?: string; googleBusinessProfile?: string;
  ga4MeasurementId?: string; gtmContainerId?: string; metaPixelId?: string;
  ogTitle?: string; ogDescription?: string; ogImage?: string;
  twitterCard?: string; twitterSite?: string; twitterCreator?: string;
  twitterTitle?: string; twitterDescription?: string; twitterImage?: string;
  schemaJsonLd?: string;
}

export async function fetchGeneralSettings(): Promise<ApiGeneralSettings> {
  const settings = await apiGet<{ data: ApiGeneralSettings }>("settings/general").then((r) => r.data);
  return { ...settings, logo: resolveMediaUrl(settings.logo) ?? undefined, favicon: resolveMediaUrl(settings.favicon) ?? undefined, ogImage: resolveMediaUrl(settings.ogImage) ?? undefined, twitterImage: resolveMediaUrl(settings.twitterImage) ?? undefined };
}
