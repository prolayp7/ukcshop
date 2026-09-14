"use client";

import { DesignParts } from "@/lib/parts";
import { Compare, useCompare } from "@/lib/basket";
import { money, stars, stockText } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import { AddToBasketButton } from "@/components/interactive";
import { ProductVisual } from "@/components/Icon";

/** Rows every comparison shows regardless of category. */
const CORE_ROWS = ["Brand", "Price", "Rating", "Availability"];

export default function ComparePage({ parts }: { parts: DesignParts }) {
  const { Header, Footer, Crumbs } = parts;
  const href = useHref();
  const { products } = useCompare();

  const specKeys: string[] = [];
  products.forEach((p) => {
    Object.keys(p.specs).forEach((k) => {
      if (specKeys.indexOf(k) === -1) specKeys.push(k);
    });
  });

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "Compare products" }]} />
      <div className="wrap">
        <div className="cmp-head">
          <h1>Compare products</h1>
          <p>{products.length ? `Comparing ${products.length} of up to 4 products.` : "Add products to compare their specifications side by side."}</p>
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
          <div className="cmp-tablewrap">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th className="cmp-rowlabel" />
                  {products.map((p) => (
                    <th key={p.id} className="cmp-col">
                      <button className="cmp-remove" onClick={() => Compare.remove(p.id)} aria-label={`Remove ${p.name} from compare`}>
                        ×
                      </button>
                      <a href={href.product(p.slug)} className="cmp-fig">
                        <ProductVisual productId={p.id} iconId={p.icon} w={96} h={72} />
                      </a>
                      <a href={href.product(p.slug)} className="cmp-name">
                        {p.name}
                      </a>
                      <div className="cmp-actions">
                        <AddToBasketButton product={p} className="cmp-add">
                          Add to basket
                        </AddToBasketButton>
                        <a href={href.product(p.slug)} className="cmp-view">
                          View product
                        </a>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CORE_ROWS.map((row) => (
                  <tr key={row}>
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
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {specKeys.map((key) => (
                  <tr key={key}>
                    <th className="cmp-rowlabel">{key}</th>
                    {products.map((p) => (
                      <td key={p.id}>{p.specs[key] ?? <span className="cmp-na">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
