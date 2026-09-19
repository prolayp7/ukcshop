"use client";

import { useMemo } from "react";
import { useApi } from "@/lib/use-api";
import { ApiBrand } from "@/lib/api";
import { Product, BrandSummary } from "@/lib/types";
import { useHref } from "@/lib/design-context";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";
import BrandCard from "./BrandCard";
import ProductCard from "./ProductCard";

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function toSummary(b: ApiBrand): BrandSummary {
  return { brand: b.title, slug: b.slug, count: b.productCount ?? 0, rating: 0, min: b.priceFrom ?? 0, deals: 0, note: b.description || b.shortDescription || `${b.productCount ?? 0} lines in the catalogue.` };
}

export default function BrandsPage() {
  const href = useHref();
  const brandsRes = useApi<{ items: ApiBrand[] }>("/api/brands");
  const recommendedRes = useApi<{ items: Product[] }>("/api/products?sort=newest&perPage=4");

  const all = useMemo(() => (brandsRes.data?.items ?? []).map(toSummary), [brandsRes.data]);
  const totalProducts = useMemo(() => all.reduce((sum, b) => sum + b.count, 0), [all]);
  const featured = useMemo(() => all.slice().sort((a, b) => b.count - a.count).slice(0, 8), [all]);
  const letters = useMemo(() => {
    const m: Record<string, BrandSummary[]> = {};
    all.forEach((b) => {
      const L = b.brand[0]?.toUpperCase() ?? "#";
      (m[L] = m[L] || []).push(b);
    });
    return m;
  }, [all]);
  const keys = Object.keys(letters).sort();

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "Brands" }]} />
      <div className="wrap">
        <div className="head" style={{ marginTop: 6 }}>
          <div>
            <h2 style={{ fontSize: 29 }}>All brands</h2>
            <p>
              {all.length} manufacturers, {totalProducts.toLocaleString("en-GB")} products. Every brand page lists live stock, current
              offers and new arrivals.
            </p>
          </div>
        </div>
        <div className="alpha">
          {ALPHA.map((L) =>
            letters[L] ? (
              <a href={`#L${L}`} key={L}>
                {L}
              </a>
            ) : (
              <a className="dim" key={L}>
                {L}
              </a>
            ),
          )}
        </div>
      </div>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Featured brands</h2>
              <p>Our deepest ranges, by number of lines stocked.</p>
            </div>
          </div>
          <div className="bgrid">
            {featured.map((b) => (
              <BrandCard key={b.slug} brand={b} />
            ))}
          </div>
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Browse A&ndash;Z</h2>
            </div>
          </div>
          {keys.map((L) => (
            <div className="azblock" id={`L${L}`} key={L}>
              <div className="L">{L}</div>
              <div className="azlist">
                {letters[L].map((b) => (
                  <a href={href.brand(b.slug)} key={b.slug}>
                    {b.brand}
                    <span>{b.count}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      {(recommendedRes.data?.items ?? []).length ? (
        <section>
          <div className="wrap">
            <div className="head">
              <div>
                <h2>Recommended for you</h2>
                <p>Popular across the brands you have been browsing.</p>
              </div>
            </div>
            <div className="rail">
              {(recommendedRes.data?.items ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <Footer />
    </>
  );
}
