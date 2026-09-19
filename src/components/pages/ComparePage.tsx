"use client";

import { useState } from "react";
import { BadgeCheck, Download, Share2, Sparkles, Trash2 } from "lucide-react";
import { DesignParts } from "@/lib/parts";
import { Compare, COMPARE_MAX, useCompare } from "@/lib/basket";
import { money, stars, stockText } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import { AddToBasketButton } from "@/components/interactive";
import { ProductVisual } from "@/components/Icon";
import { toast } from "@/lib/notifications";
import { Product } from "@/lib/types";

/** Rows every comparison shows regardless of category. */
const CORE_ROWS = ["Brand", "Price", "Rating", "Availability"];

function rawValue(row: string, p: Product): string | number {
  if (row === "Brand") return p.brand;
  if (row === "Price") return p.price;
  if (row === "Rating") return p.rating;
  if (row === "Availability") return p.stockStatus;
  return p.specs[row] ?? "";
}
function allSame(values: Array<string | number>) {
  return values.every((v) => v === values[0]);
}

export default function ComparePage({ parts }: { parts: DesignParts }) {
  const { Header, Footer, Crumbs } = parts;
  const href = useHref();
  const { products } = useCompare();
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [hideIdentical, setHideIdentical] = useState(false);

  const specKeys: string[] = [];
  products.forEach((p) => {
    Object.keys(p.specs).forEach((k) => {
      if (specKeys.indexOf(k) === -1) specKeys.push(k);
    });
  });
  const rows = [...CORE_ROWS, ...specKeys]
    .map((row) => ({ row, same: allSame(products.map((p) => rawValue(row, p))) }))
    .filter(({ same }) => !hideIdentical || !same);

  const commonCategory = products.length > 0 && products.every((p) => p.category === products[0].category) ? products[0].category : null;

  async function shareMatrix() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Comparison link copied to clipboard.");
    } catch {
      toast.error("Could not copy the link. Please copy it from the address bar.");
    }
  }

  function exportCsv() {
    const csvRows = [["", ...products.map((p) => p.name)], ...rows.map(({ row }) => [row, ...products.map((p) => String(rawValue(row, p) || "—"))])];
    const csv = csvRows.map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-comparison.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, ...(commonCategory ? [{ label: commonCategory, href: href.category({ cat: commonCategory }) }] : []), { label: "Product comparison" }]} />
      <div className="wrap">
        <div className="cmp-head">
          {products.length > 0 && (
            <div className="cmp-badges">
              <span className="cmp-badge cmp-badge-accent">
                <Sparkles size={12} />
                Spec comparison
              </span>
              <span className="cmp-badge cmp-badge-pos">
                {products.length} of {COMPARE_MAX} slots filled
              </span>
            </div>
          )}
          <div className="cmp-headrow">
            <div>
              <h1>{commonCategory ? `Comparison matrix — ${commonCategory}` : "Compare products"}</h1>
              <p>
                {products.length
                  ? `Side-by-side specifications, pricing and availability to help you choose the right ${commonCategory ? commonCategory.toLowerCase() : "product"}.`
                  : "Add products to compare their specifications side by side."}
              </p>
            </div>
            {products.length > 0 && (
              <div className="cmp-headactions">
                <button type="button" className="cmp-btn" onClick={() => void shareMatrix()}>
                  <Share2 size={14} />
                  Share matrix
                </button>
                <button type="button" className="cmp-btn" onClick={exportCsv}>
                  <Download size={14} />
                  Export CSV
                </button>
                <button type="button" className="cmp-btn cmp-btn-danger" onClick={() => Compare.clear()}>
                  <Trash2 size={14} />
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="cmp-empty">
            <h3>Nothing to compare yet</h3>
            <p>Use the compare checkbox on any product card, then come back here to see them side by side.</p>
            <a className="cmp-empty-cta" href={href.home()}>
              Continue shopping
            </a>
          </div>
        ) : (
          <>
            <div className="cmp-toolbar">
              <label className="cmp-toggle">
                <input type="checkbox" checked={highlightDiff} onChange={(e) => setHighlightDiff(e.target.checked)} />
                <span className="cmp-switch" />
                Highlight differences
              </label>
              <label className="cmp-toggle">
                <input type="checkbox" checked={hideIdentical} onChange={(e) => setHideIdentical(e.target.checked)} />
                <span className="cmp-switch" />
                Hide identical rows
              </label>
              <span className="cmp-verified">
                <BadgeCheck size={14} />
                Specifications verified against manufacturer datasheets
              </span>
            </div>

            <div className="cmp-benchhead">
              <h2>Product benchmarks</h2>
              <span>
                {products.length} {products.length === 1 ? "product" : "products"} under comparison
              </span>
            </div>
            <div className="cmp-cards">
              {products.map((p) => (
                <div className="cmp-card" key={p.id}>
                  <button className="cmp-rm" onClick={() => Compare.remove(p.id)} aria-label={`Remove ${p.name} from compare`}>
                    ×
                  </button>
                  <a href={href.product(p.slug)} className="cmp-fig">
                    <ProductVisual productId={p.id} iconId={p.icon} w={72} h={54} />
                  </a>
                  <span className="cmp-brand">{p.brand}</span>
                  <a href={href.product(p.slug)} className="cmp-name">
                    {p.name}
                  </a>
                  <div className="cmp-cardprice">
                    <b>{money(p.price)}</b>
                    {p.was ? <s>{money(p.was)}</s> : null}
                  </div>
                  <div className="cmp-actions">
                    <AddToBasketButton product={p} className="cmp-add">
                      Add to basket
                    </AddToBasketButton>
                    <a href={href.product(p.slug)} className="cmp-view">
                      View product
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="cmp-tablewrap">
              <table className="cmp-table">
                <thead>
                  <tr>
                    <th className="cmp-rowlabel" />
                    {products.map((p) => (
                      <th key={p.id} className="cmp-col">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ row, same }) => (
                    <tr key={row} className={highlightDiff && !same ? "cmp-rowdiff" : undefined}>
                      <th className="cmp-rowlabel">{row}</th>
                      {products.map((p) => {
                        const st = stockText(p);
                        return (
                          <td key={p.id}>
                            {row === "Brand" && <a href={href.brand(p.brandSlug)}>{p.brand}</a>}
                            {row === "Price" && (
                              <>
                                <b className="cmp-price">{money(p.price)}</b>
                                {p.was ? <s className="cmp-was">{money(p.was)}</s> : null}
                              </>
                            )}
                            {row === "Rating" && (
                              <>
                                <span className="cmp-stars">{stars(p.rating)}</span> {p.rating} ({p.reviews.toLocaleString("en-GB")})
                              </>
                            )}
                            {row === "Availability" && <span className={`cmp-stock ${st.cls}`}>{st.text}</span>}
                            {!CORE_ROWS.includes(row) && (p.specs[row] ?? <span className="cmp-na">—</span>)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
