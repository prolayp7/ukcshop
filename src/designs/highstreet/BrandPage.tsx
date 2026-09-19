"use client";

import { useParams, notFound } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { ApiBrand, ListMeta } from "@/lib/api";
import { Product } from "@/lib/types";
import { money } from "@/lib/catalogue";
import { Icon } from "@/components/Icon";
import { useHref } from "@/lib/design-context";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";
import ProductCard from "./ProductCard";
import BrandCard from "./BrandCard";

function Rail({ title, sub, items }: { title: string; sub?: string; items: Product[] }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="wrap">
        <div className="head">
          <div>
            <h2>{title}</h2>
            {sub ? <p>{sub}</p> : null}
          </div>
        </div>
        <div className="rail">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function BrandPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const href = useHref();

  const brandRes = useApi<{ brand: ApiBrand }>(`/api/brands/${encodeURIComponent(slug)}`);
  const itemsRes = useApi<{ items: Product[]; meta: ListMeta }>(brandRes.data ? `/api/products?brand=${encodeURIComponent(slug)}&perPage=12` : null);
  const dealsRes = useApi<{ items: Product[] }>(brandRes.data ? `/api/products?brand=${encodeURIComponent(slug)}&onSale=true&perPage=8` : null);
  const newestRes = useApi<{ items: Product[] }>(brandRes.data ? `/api/products?brand=${encodeURIComponent(slug)}&sort=newest&perPage=4` : null);
  const brandsRes = useApi<{ items: ApiBrand[] }>("/api/brands");
  const recommendedRes = useApi<{ items: Product[] }>(brandRes.data ? "/api/products?sort=newest&perPage=4" : null);

  if (brandRes.error) notFound();
  const b = brandRes.data?.brand;
  if (!b) return <div className="wrap" style={{ padding: "60px 0", textAlign: "center", color: "var(--body)" }}>Loading…</div>;

  const items = itemsRes.data?.items ?? [];
  const facets = itemsRes.data?.meta.facets;
  const total = itemsRes.data?.meta.total ?? 0;
  const deals = dealsRes.data?.items ?? [];
  const newest = newestRes.data?.items ?? [];
  const siblings = (brandsRes.data?.items ?? []).filter((x) => x.slug !== slug).slice(0, 4);
  const note = b.description || b.shortDescription || `${total} lines in the catalogue.`;

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "Brands", href: href.brands() }, { label: b.title }]} />
      <div className="wrap">
        <div className="bhero" style={{ backgroundImage: `url(https://picsum.photos/seed/ukcs-a-brand-${encodeURIComponent(b.slug)}/1200/700)` }}>
          <div>
            <div className="mark">{b.title.slice(0, 2).toUpperCase()}</div>
            <h1>{b.title}</h1>
            <p>{note}</p>
          </div>
          <div className="bstats">
            <div>
              <b>{total}</b>
              <span>Products</span>
            </div>
            <div>
              <b>{facets?.priceMin !== undefined && facets?.priceMin !== null ? money(facets.priceMin).replace(".00", "") : "—"}</b>
              <span>From</span>
            </div>
            <div>
              <b>{deals.length}</b>
              <span>On offer</span>
            </div>
          </div>
        </div>
        <div className="bchips">
          <a className="on" href="#all">
            All {total}
          </a>
          {(facets?.categories ?? []).map((c) => (
            <a href={href.category({ sub: c.title })} key={c.slug}>
              {c.title}
              <span>{c.count}</span>
            </a>
          ))}
        </div>
      </div>
      <Rail title={`Products from ${b.title}`} sub="The full range, most recently updated first." items={items.slice(0, 4)} />
      {deals.length ? <Rail title={`Current ${b.title} offers`} sub="Reduced right now." items={deals} /> : null}
      {newest.length ? <Rail title={`New from ${b.title}`} sub="Most recently added to the catalogue." items={newest} /> : null}
      <Rail title="Recommended for you" sub={`Other products that pair well with ${b.title} hardware.`} items={recommendedRes.data?.items ?? []} />
      {siblings.length ? (
        <section>
          <div className="wrap">
            <div className="head">
              <div>
                <h2>Other brands you might consider</h2>
                <p>Stocked alongside {b.title}.</p>
              </div>
              <a href={href.brands()}>
                All brands <Icon id="i-arr" w={15} />
              </a>
            </div>
            <div className="bgrid">
              {siblings.map((sib) => (
                <BrandCard
                  key={sib.slug}
                  brand={{ brand: sib.title, slug: sib.slug, count: sib.productCount ?? 0, rating: 0, min: sib.priceFrom ?? 0, deals: 0, note: sib.description || sib.shortDescription || `${sib.productCount ?? 0} lines in the catalogue.` }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <Footer />
    </>
  );
}
