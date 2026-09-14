"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Grid2X2, List, Package, SlidersHorizontal, X } from "lucide-react";
import { parts } from "@/designs/highstreet";
import { useCategoryProducts } from "@/lib/use-category-products";
import { useApi } from "@/lib/use-api";
import type { ApiCategory, ListMeta, ProductListParams } from "@/lib/api";
import { money } from "@/lib/catalogue";
import type { Product } from "@/lib/types";
import { useHref } from "@/lib/design-context";
import { Icon } from "@/components/Icon";
import { plainText } from "@/lib/category";
import CategoryProductCard from "@/components/pages/CategoryProductCard";

export default function CategoryPage({ category, tree, initialMin, initialMax, initialSort, deals, initialProducts, benefits }: {
  benefits: { id: number; label: string; icon: string | null }[];
  initialProducts: { items: Product[]; meta: ListMeta } | null;
  category: ApiCategory | null; tree: ApiCategory[]; initialMin: string; initialMax: string; initialSort: string; deals: boolean;
}) {
  const { Header, Footer, Crumbs } = parts;
  const href = useHref();
  const [brands, setBrands] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<ProductListParams["sort"]>(initialSort === "price-asc" ? "price_asc" : initialSort === "price-desc" ? "price_desc" : "newest");
  const validPrice = (value: string) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 ? value : "";
  const [priceMin, setPriceMin] = useState(validPrice(initialMin));
  const [priceMax, setPriceMax] = useState(validPrice(initialMax));
  const [stock, setStock] = useState(false);
  const [perPage, setPerPage] = useState(12);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const label = category?.pageHeader || category?.title || (deals ? "Today's Best Deals" : "All products");
  const baseQuery = new URLSearchParams();
  if (category) baseQuery.set("category", category.slug);
  if (deals) baseQuery.set("onSale", "true");
  const facetsRes = useApi<{ items: Product[]; meta: ListMeta }>(`/api/products?${baseQuery}&perPage=1`);
  const query = new URLSearchParams(baseQuery);
  if (brands.length) query.set("brand", brands.join(","));
  if (Object.keys(specs).length) query.set("specs", JSON.stringify(specs));
  if (priceMin) query.set("priceMin", priceMin);
  if (priceMax) query.set("priceMax", priceMax);
  if (stock) query.set("inStock", "true");
  query.set("sort", sort || "newest");
  query.set("perPage", String(perPage));
  const results = useCategoryProducts(query.toString(), initialProducts);
  const sentinel = useRef<HTMLDivElement>(null);
  const { loadMore, loading, error, hasMore } = results;
  useEffect(() => {
    const target = sentinel.current;
    if (!target || loading || error || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { rootMargin: "1000px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, loading, error, hasMore]);
  const shown = results.data?.items ?? [];
  const total = results.data?.meta.total ?? 0;
  const facets = facetsRes.data?.meta.facets;
  const maxPrice = Math.ceil(facets?.priceMax ?? 0);
  const children = category?.children ?? [];
  const parent = tree.find((node) => node.id === category?.parentId);
  const reset = () => { setBrands([]); setSpecs({}); setPriceMin(""); setPriceMax(""); setStock(false); };
  const filtered = brands.length > 0 || Object.keys(specs).length > 0 || priceMin !== "" || priceMax !== "" || stock;

  const activeFilters = [
    ...brands.map((slug) => ({
      key: `brand:${slug}`, label: `Brand: ${facets?.brands.find((brand) => brand.slug === slug)?.title || slug}`,
      remove: () => setBrands((current) => current.filter((brand) => brand !== slug)),
    })),
    ...Object.entries(specs).flatMap(([title, values]) => values.map((value) => ({
      key: `spec:${title}:${value}`, label: `${title.replace(/([a-z])([A-Z])/g, "$1 $2")}: ${value}`,
      remove: () => setSpecs((current) => {
        const next = { ...current };
        const remaining = (next[title] ?? []).filter((item) => item !== value);
        if (remaining.length) next[title] = remaining;
        else delete next[title];
        return next;
      }),
    }))),
    ...(priceMin !== "" || priceMax !== "" ? [{
      key: "price", label: priceMin !== "" && priceMax !== "" ? `Price: ${money(Number(priceMin))}–${money(Number(priceMax))}` : priceMin !== "" ? `Price: from ${money(Number(priceMin))}` : `Price: up to ${money(Number(priceMax))}`,
      remove: () => { setPriceMin(""); setPriceMax(""); },
    }] : []),
    ...(stock ? [{ key: "stock", label: "In Stock Only", remove: () => setStock(false) }] : []),
  ];

  return <>
    <Header />
    <div className="category-page">
      <Crumbs items={[{ label: "Home", href: href.home() }, ...(parent ? [{ label: parent.title, href: href.category({ cat: parent.slug }) }] : []), { label: category?.title || label }]} />
      <section className="category-heading"><div className="category-wrap category-heading-layout"><div>
        <div className="category-title"><h1>{label}</h1>{facetsRes.data ? <span>{facetsRes.data.meta.total.toLocaleString("en-GB")} Models</span> : null}</div>
        {category?.description ? <p>{plainText(category.description)}</p> : null}
      </div>{benefits.length ? <div className="category-benefits">{benefits.map((benefit) => <div key={benefit.id}>{benefit.icon ? <Icon id={benefit.icon} w={21} /> : <Package size={21} />}<span>{benefit.label}</span></div>)}</div> : null}</div></section>
      {children.length > 0 ? <section className="category-subcategories"><div className="category-wrap">
        <div className="category-section-label"><h2>Shop by {category?.title} Subcategory</h2><a href="#category-results">View all products <ArrowRight size={16} /></a></div>
        <div className="category-subcategory-grid">{children.map((child) => <Link key={child.id} href={href.category({ cat: child.slug })} className="category-subcategory">
          {child.thumbnailImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={child.thumbnailImage} alt={child.thumbnailImageAlt || ""} width={32} height={32} />
          ) : <Package size={23} />}
          <strong>{child.title}</strong><span>{child.productCount} Models</span>
        </Link>)}</div>
      </div></section> : null}
      <div className="category-catalogue" id="category-results"><div className="category-wrap category-layout">
        <button className="category-mobile-filter" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="category-filters"><SlidersHorizontal size={18} /> Refine results</button>
        <aside id="category-filters" className={`category-sidebar${filtersOpen ? " is-open" : ""}`}>
          <div className="category-refine"><h2>Refine Results</h2><button onClick={reset}>Reset</button></div>
          <fieldset><legend>Manufacturer</legend>{facets?.brands.map((brand) => <label key={brand.slug}><input type="checkbox" checked={brands.includes(brand.slug)} onChange={() => { setBrands(brands.includes(brand.slug) ? brands.filter((b) => b !== brand.slug) : [...brands, brand.slug]); }} /><span>{brand.title}</span><small>{brand.count}</small></label>)}{!facets?.brands.length ? <p className="category-muted">{facetsRes.loading ? "Loading…" : "No manufacturers"}</p> : null}</fieldset>
          <fieldset><legend>Price Range (£)</legend>
            <div className="category-price-inputs"><input aria-label="Minimum price" type="number" min="0" max={priceMax || undefined} placeholder="Min" value={priceMin} onChange={(event) => { setPriceMin(event.target.value); }} /><span>–</span><input aria-label="Maximum price" type="number" min={priceMin || "0"} placeholder="Max" value={priceMax} onChange={(event) => { setPriceMax(event.target.value); }} /></div>
            {maxPrice > 0 ? <><input aria-label="Maximum price slider" className="category-range" type="range" min="0" max={maxPrice} value={priceMax || maxPrice} onChange={(event) => { setPriceMax(event.target.value); }} /><small>Up to {money(Number(priceMax || maxPrice))}</small></> : null}
          </fieldset>
          {(facets?.specifications ?? []).filter((spec) => !["brand", "category"].includes(spec.title.toLowerCase())).map((spec) => <div className="category-spec-filter" key={spec.title}><p className="category-spec-filter-title">{spec.title.replace(/([a-z])([A-Z])/g, "$1 $2")}</p><fieldset aria-label={spec.title}>{spec.values.map(({ value, count }) => <label key={value}><input type="checkbox" checked={specs[spec.title]?.includes(value) ?? false} onChange={() => { const next = { ...specs }; const selected = next[spec.title] ?? []; const values = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]; if (values.length) next[spec.title] = values; else delete next[spec.title]; setSpecs(next); }} /><span>{value}</span><small>{count}</small></label>)}</fieldset></div>)}
          <fieldset><legend>Availability</legend><label><input type="checkbox" checked={stock} onChange={(event) => { setStock(event.target.checked); }} /><span>In Stock Only</span></label></fieldset>
        </aside>
        <section className="category-results" aria-label="Products" aria-busy={results.loading}>
          <div className="category-controls">
          <div className="category-toolbar">
            <p aria-live="polite" aria-atomic="true" aria-busy={results.loading}>{!results.data && results.loading ? "Loading products…" : <>Showing <b>{shown.length ? 1 : 0}–{shown.length}</b> of <strong>{total}</strong> Products</>}</p>
            <label className="category-sort">Sort:<select value={sort} onChange={(event) => { setSort(event.target.value as ProductListParams["sort"]); }}><option value="newest">Newest arrivals</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name_asc">Name: A–Z</option><option value="name_desc">Name: Z–A</option></select></label>
            <div className="category-page-size"><span>Show:</span>{[12, 24, 48].map((size) => <button key={size} aria-pressed={perPage === size} onClick={() => { setPerPage(size); }}>{size}</button>)}</div>
            <div className="category-view"><button aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={18} /></button><button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={18} /></button></div>
          </div>
          {filtered ? <div className="category-active-filters" aria-label="Active filters">
            <span className="category-active-label">Active:</span>
            {activeFilters.map((filter) => <button key={filter.key} className="category-filter-chip" aria-label={`Remove ${filter.label} filter`} onClick={() => { filter.remove(); }}><span>{filter.label}</span><X size={12} aria-hidden="true" /></button>)}
            <button className="category-clear-filters" onClick={reset}>Clear all</button>
          </div> : null}
          </div>
          <div className={`category-products ${view === "list" ? "is-list" : ""}`}>
            {shown.map((product) => <CategoryProductCard key={product.id} product={product} />)}
            {results.loading ? Array.from({ length: perPage }, (_, index) => <div key={`skeleton-${index}`} className="category-product category-product-skeleton" aria-hidden="true">
              <div className="category-product-visual skeleton-block" />
              <div className="category-product-info"><div className="skeleton-block skeleton-title" /><div className="skeleton-block skeleton-line" /><div className="skeleton-block skeleton-specs" /></div>
              <div className="category-product-buy"><div className="skeleton-block skeleton-price" /><div className="skeleton-block skeleton-button" /></div>
            </div>) : null}
          </div>
          {results.loading ? <span className="category-loading-status" role="status">Loading products…</span> : null}
          {results.error ? <div className="category-empty" role="alert"><h2>Products could not be loaded</h2><p>Your current results are still available. Please try again.</p><button onClick={results.retry}>Retry</button></div> : !results.loading && !shown.length ? <div className="category-empty"><h2>No products found</h2><p>Try adjusting your filters.</p>{filtered ? <button onClick={reset}>Clear filters</button> : null}</div> : null}
          <div ref={sentinel} className="category-load-more">
            {results.hasMore && !results.error ? <button disabled={results.loading} onClick={results.loadMore}>{results.loading ? "Loading more products…" : "Load more products"}</button> : null}
          </div>
        </section>
      </div></div>
      {category?.additionalDescription || category?.faqs?.length ? <section className="category-wrap category-details">
        {category.additionalDescription ? <p>{plainText(category.additionalDescription)}</p> : null}
        {category.faqs?.length ? <><h2>Frequently asked questions</h2>{category.faqs.map((faq, i) => <details key={i}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</> : null}
      </section> : null}
    </div>
    <Footer />
  </>;
}
