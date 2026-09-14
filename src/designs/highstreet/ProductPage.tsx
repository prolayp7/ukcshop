"use client";

import { useParams, notFound } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useApi } from "@/lib/use-api";
import { ApiProductBase, PaginationMeta } from "@/lib/api";
import { Product } from "@/lib/types";
import { money, exVat, stars, stockText } from "@/lib/catalogue";
import { Recent, useCompare, useRecentIds } from "@/lib/basket";
import { Icon, ProductVisual } from "@/components/Icon";
import { AddToBasketButton, QtyStepper } from "@/components/interactive";
import { useHref } from "@/lib/design-context";
import { theme } from "@/lib/theme.config";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";
import ProductCard from "./ProductCard";

const REVIEWS = [
  {
    who: "Daniel H.",
    v: true,
    r: 5,
    t: "Dropped straight in, no fuss",
    b: "Ordered Tuesday afternoon, arrived Wednesday morning. Idles silently and the packaging was genuinely good — double boxed with foam ends.",
  },
  {
    who: "Priya S.",
    v: true,
    r: 5,
    t: "Exactly as specified",
    b: "Spec sheet on the listing matched the product to the letter, which is more than I can say for the marketplace I used before.",
  },
  {
    who: "Mark T.",
    v: false,
    r: 4,
    t: "Very good, one small niggle",
    b: "No complaints about performance. Would have liked the mounting hardware to include the older bracket, but that's on the manufacturer.",
  },
];
const DIST = [72, 19, 6, 2, 1];

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const slug = params.id;
  const href = useHref();
  const qtyRef = useRef<HTMLInputElement>(null);
  const { has: hasCompare, toggle: toggleCompare } = useCompare();
  useRecentIds(); // kept live so basket/recently-viewed state stays consistent; see Day 4 note below

  const detail = useApi<{ product: Product; api: ApiProductBase }>(`/api/products/${encodeURIComponent(slug)}`);
  const categorySlug = detail.data?.api.category.slug ?? null;

  const relatedRes = useApi<{ items: Product[] }>(categorySlug ? `/api/products?category=${encodeURIComponent(categorySlug)}&perPage=9` : null);
  const compatibleRes = useApi<{ items: Product[] }>(detail.data ? `/api/products/${encodeURIComponent(slug)}/compatible?limit=4` : null);
  const recommendedRes = useApi<{ items: Product[]; meta: PaginationMeta }>(detail.data ? `/api/products?sort=newest&perPage=9` : null);

  const p = detail.data?.product;

  const related = useMemo(() => (relatedRes.data?.items ?? []).filter((x) => x.id !== p?.id).slice(0, 4), [relatedRes.data, p?.id]);
  const alsoBought = compatibleRes.data?.items ?? [];
  const recommended = useMemo(() => (recommendedRes.data?.items ?? []).filter((x) => x.id !== p?.id).slice(0, 4), [recommendedRes.data, p?.id]);
  // Recently-viewed lookup isn't wired to live data in this pass - it needs
  // basket.ts's Recent store to move from tracking numeric ids to slugs,
  // which is Day 4's job (it owns the whole basket/localStorage data layer).
  const recentlyViewed: Product[] = [];

  useEffect(() => {
    if (p) Recent.push(p.id);
  }, [p]);

  if (detail.error) notFound();
  if (!p) return <div className="wrap" style={{ padding: "60px 0", textAlign: "center", color: "var(--body)" }}>Loading…</div>;

  const st = stockText(p);
  const keys = Object.keys(p.specs);

  return (
    <>
      <Header />
      <Crumbs
        items={[
          { label: "Home", href: href.home() },
          { label: p.category, href: href.category({ cat: p.category }) },
          { label: p.name },
        ]}
      />
      <div className="wrap">
        <div className="pd">
          <div className="gal">
            <div className="main">
              {p.was ? <span className="flag">Save {money(p.was - p.price)}</span> : null}
              <ProductVisual productId={p.id} iconId={p.icon} w={290} h={220} />
            </div>
            <div className="thumbs">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={i === 0 ? "on" : ""}>
                  <ProductVisual productId={p.id} iconId={p.icon} w={44} h={34} />
                </span>
              ))}
            </div>
          </div>
          <div className="pinfo">
            <div className="brandline">
              <a href={href.brand(p.brandSlug)}>{p.brand}</a>
              <span style={{ color: "#b3b6bd" }}>·</span>
              <span style={{ fontSize: 12.5, color: "var(--body)" }}>{p.subcategory}</span>
            </div>
            <h1>{p.name}</h1>
            <div className="rate">
              <span className="s">{stars(p.rating)}</span>
              <b>{p.rating}</b>
              <span>·</span>
              <a href="#reviews">{p.reviews.toLocaleString("en-GB")} reviews</a>
            </div>
            <div className="ids">
              <span>
                SKU <b>{p.sku}</b>
              </span>
              <span>
                MPN <b>{p.mpn}</b>
              </span>
              <span>
                EAN <b>{p.ean}</b>
              </span>
            </div>
            <ul className="keyspec">
              {keys.slice(0, 6).map((k) => (
                <li key={k}>
                  <span>{k}</span>
                  <b>{p.specs[k]}</b>
                </li>
              ))}
            </ul>
            <a href="#spec" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--blue)" }}>
              See the full specification <Icon id="i-arr" w={14} />
            </a>
          </div>
          <aside className="buybox">
            <div className="price">
              <b>{money(p.price)}</b>
              {p.was ? <s>{money(p.was)}</s> : null}
            </div>
            <div className="vat">
              {exVat(p.price)} ex. VAT{p.was ? ` · you save ${money(p.was - p.price)}` : ""}
            </div>
            <div className="stock">
              <i style={st.cls === "in" ? undefined : { background: "var(--amber)" }} />
              <span style={st.cls === "in" ? undefined : { color: "var(--amber)" }}>{st.text}</span>
            </div>
            <QtyStepper inputRef={qtyRef} />
            <AddToBasketButton product={p} qtyInputRef={qtyRef} className="add">
              <Icon id="i-bag" w={16} />
              {st.cls === "out" ? "Pre-order" : "Add to basket"}
            </AddToBasketButton>
            <button
              className="alt"
              onClick={() => toggleCompare(p)}
              style={{ width: "100%", background: "none", border: 0, cursor: "pointer", font: "inherit" }}
            >
              {hasCompare(p.id) ? "Remove from compare" : "Add to wishlist"}
            </button>
            <ul className="perks">
              <li>
                <Icon id="i-truck" w={15} />
                <span>Free next-day delivery, order before 17:00</span>
              </li>
              <li>
                <Icon id="i-shield" w={15} />
                <span>{p.specs.Warranty || "Manufacturer warranty"} · UK returns within 30 days</span>
              </li>
              <li>
                <Icon id="i-card" w={15} />
                <span>0% finance from {money(p.price / 12)}/month</span>
              </li>
              <li>
                <Icon id="i-wrench" w={15} />
                <span>Fitting available at our Manchester workshop</span>
              </li>
            </ul>
          </aside>
        </div>

        <div className="tabbar">
          <button className="on" data-tab="spec" onClick={(e) => switchTab(e, "spec")}>
            Specification
          </button>
          <button data-tab="reviews" onClick={(e) => switchTab(e, "reviews")}>
            Reviews ({p.reviews.toLocaleString("en-GB")})
          </button>
          <button data-tab="delivery" onClick={(e) => switchTab(e, "delivery")}>
            Delivery &amp; returns
          </button>
        </div>
        <div className="tabpane on" id="spec">
          <table className="spectable">
            <tbody>
              {keys.map((k) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{p.specs[k]}</td>
                </tr>
              ))}
              <tr>
                <th>Brand</th>
                <td>
                  <a href={href.brand(p.brandSlug)} style={{ color: "var(--blue)", fontWeight: 600 }}>
                    {p.brand}
                  </a>
                </td>
              </tr>
              <tr>
                <th>Manufacturer part no.</th>
                <td>{p.mpn}</td>
              </tr>
              <tr>
                <th>EAN</th>
                <td>{p.ean}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="tabpane" id="reviews">
          <div className="rvsum">
            <div className="rvbig">
              <b>{p.rating}</b>
              <span className="s">{stars(p.rating)}</span>
              <span>{p.reviews.toLocaleString("en-GB")} verified reviews</span>
            </div>
            <div className="rvbars">
              {DIST.map((v, i) => (
                <div key={i}>
                  <span>{5 - i} star</span>
                  <span className="bar">
                    <i style={{ width: `${v}%` }} />
                  </span>
                  <span>{v}%</span>
                </div>
              ))}
            </div>
          </div>
          {REVIEWS.map((r) => (
            <div className="rv" key={r.who}>
              <div className="top">
                <span className="who">
                  {r.who}
                  {r.v ? <em>VERIFIED BUYER</em> : null}
                </span>
                <span className="date">March 2026</span>
              </div>
              <div style={{ marginBottom: 6 }}>
                <span className="s">{stars(r.r)}</span> <b style={{ fontSize: 13.5 }}>{r.t}</b>
              </div>
              <p>{r.b}</p>
            </div>
          ))}
        </div>
        <div className="tabpane" id="delivery">
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>
            Free next-day delivery on orders over £{theme.features.freeDeliveryThresholdGbp}, despatched the same day when ordered before 17:00
            Monday to Friday. Saturday delivery is available at checkout for £{theme.features.saturdayDeliveryGbp}.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--body)" }}>
            Returns accepted within 30 days in original packaging. Faulty items are handled under our RMA process — we collect, test and replace,
            and you are not charged carriage either way.
          </p>
        </div>
      </div>

      <Rail title="Related products" sub={`Alternatives in ${p.subcategory}, at a similar price.`} items={related} link={{ href: href.category({ sub: p.subcategory }), label: "See all " + p.subcategory }} />
      <Rail title="Frequently bought together" sub="Parts our customers add alongside this one — compatibility checked." items={alsoBought} />
      <Rail title="Recommended for you" sub="Popular right now across the catalogue." items={recommended} />
      {recentlyViewed.length ? <Rail title="Recently viewed" items={recentlyViewed.slice(0, 4)} /> : null}
      <Footer />
    </>
  );
}

function switchTab(e: React.MouseEvent<HTMLButtonElement>, tab: string) {
  const bar = e.currentTarget.parentElement!;
  bar.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
  e.currentTarget.classList.add("on");
  const wrap = bar.parentElement!;
  wrap.querySelectorAll(".tabpane").forEach((p) => p.classList.remove("on"));
  wrap.querySelector(`#${tab}`)?.classList.add("on");
}

function Rail({ title, sub, items, link }: { title: string; sub?: string; items: Product[]; link?: { href: string; label: string } }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="wrap">
        <div className="head">
          <div>
            <h2>{title}</h2>
            {sub ? <p>{sub}</p> : null}
          </div>
          {link ? (
            <a href={link.href}>
              {link.label} <Icon id="i-arr" w={15} />
            </a>
          ) : null}
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
