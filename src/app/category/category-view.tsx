import type { Metadata } from "next";
import { cache } from "react";
import CategoryPage from "@/components/pages/CategoryPage";
import { fetchCategoryTree, fetchCategoryBySlug, fetchProducts, fetchHome, type ApiCategory, type ProductListParams } from "@/lib/api";
import { buildCategoryPaths, CATEGORY_ROOT } from "@/lib/category-paths";
import { plainText } from "@/lib/category";

// Shared by /category (all products, search), /category/[...slug] and /deals: each route only decides
// which category (if any) it shows and its canonical path; rendering and SEO live here.

export type SearchParams = Record<string, string | string[] | undefined>;
export const single = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

export const loadTree = cache(() => fetchCategoryTree());

/** The tree node merged with its full detail (SEO fields, FAQs, description). */
export const loadCategoryDetail = cache(async (node: ApiCategory) => {
  const detail = await fetchCategoryBySlug(node.slug);
  return detail ? { ...node, ...detail, children: node.children } : node;
});

export async function canonicalPathFor(category: ApiCategory): Promise<string> {
  return buildCategoryPaths(await loadTree())[category.slug.toLowerCase()] ?? CATEGORY_ROOT;
}

/** Query string for a redirect, dropping the keys the new URL already expresses. */
export function carriedQuery(query: SearchParams, drop: string[]): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (!drop.includes(key) && typeof value === "string") params.set(key, value);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const siteOrigin = cache(async () => {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL).origin;
  return "http://localhost:3002";
});

function parseSchema(value?: string | null): unknown {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

type ViewOptions = { category: ApiCategory | null; parent?: ApiCategory | null; query: SearchParams; canonical: string; deals?: boolean };

export async function categoryMetadata({ category, query, canonical, deals = false }: ViewOptions): Promise<Metadata> {
  const q = single(query.q);
  const title = category?.metaTitle || category?.pageHeader || category?.title || (q ? `Search results for "${q}"` : deals ? "Today's Best Deals" : "All products");
  const description = category?.metaDescription || plainText(category?.description);
  // Filtered/searched variants of a page are not separate pages for search engines.
  const filtered = Boolean(q || (!deals && single(query.deals)));
  return {
    metadataBase: new URL(await siteOrigin()),
    title, description, keywords: category?.metaKeywords || undefined,
    alternates: { canonical },
    robots: { index: category?.isIndexable !== false && !filtered, follow: true },
    openGraph: { type: "website", title: category?.ogTitle || title, description: category?.ogDescription || description, url: canonical,
      images: category?.ogImage ? [{ url: category.ogImage, alt: category.ogImageAlt || title }] : [] },
    twitter: { card: category?.twitterCard === "SUMMARY" ? "summary" : "summary_large_image", title: category?.twitterTitle || title, description: category?.twitterDescription || description,
      images: category?.twitterImage ? [category.twitterImage] : [] },
  };
}

export async function CategoryView({ category, parent = null, query, canonical, deals = false }: ViewOptions) {
  const tree = await loadTree().catch(() => [] as ApiCategory[]);
  const q = single(query.q);
  const onSale = deals || single(query.deals) === "1";
  const initialParams: ProductListParams = {
    category: category?.slug, perPage: 12,
    q: q || undefined,
    onSale: onSale || undefined,
    sort: single(query.sort) === "price-asc" ? "price_asc" : single(query.sort) === "price-desc" ? "price_desc" : "newest",
  };
  for (const [urlKey, apiKey] of [["min", "priceMin"], ["max", "priceMax"]] as const) {
    const value = single(query[urlKey]);
    if (value && Number.isFinite(Number(value)) && Number(value) >= 0) initialParams[apiKey] = Number(value);
  }
  const facetParams: ProductListParams = {
    category: category?.slug,
    q: q || undefined,
    onSale: onSale || undefined,
    perPage: 1,
  };
  const [initialProducts, initialFacets, home, origin] = await Promise.all([
    fetchProducts(initialParams).catch(() => null),
    fetchProducts(facetParams).catch(() => null),
    fetchHome().catch(() => null),
    siteOrigin(),
  ]);
  const pageUrl = new URL(canonical, origin).href;
  const schema = category?.schemaType === "CUSTOM" ? parseSchema(category.customSchema) : {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: category?.pageHeader || category?.title || (deals ? "Today's Best Deals" : "All products"),
    mainEntity: initialProducts ? { "@type": "ItemList", numberOfItems: initialProducts.meta.total,
      itemListElement: initialProducts.items.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.name, url: new URL(`/product/${encodeURIComponent(product.slug)}`, origin).href })) } : undefined,
    description: plainText(category?.description), url: pageUrl,
  };
  const faqSchema = parseSchema(category?.faqSchema) || (category?.faqs?.length ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: category.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  } : null);
  const crumbs = [
    { name: "Home", item: `${origin}/` },
    ...(parent ? [{ name: parent.title, item: new URL(await canonicalPathFor(parent), origin).href }] : []),
    { name: category?.title || (deals ? "Deals" : "All products"), item: pageUrl },
  ];
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })) };
  return <>
    {[schema, faqSchema, breadcrumbs].filter(Boolean).map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }} />)}
    <CategoryPage key={`${canonical}?${JSON.stringify(query)}`} initialProducts={initialProducts} initialFacets={initialFacets?.meta ?? null} benefits={home?.hero.badges.slice(0, 3) ?? []} category={category} tree={tree} initialMin={single(query.min)} initialMax={single(query.max)} initialSort={single(query.sort)} deals={onSale} initialQuery={q} />
  </>;
}
