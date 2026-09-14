"use client";

import { useEffect, useRef } from "react";
import { byId, money, exVat, stars, stockText } from "@/lib/catalogue";
import { Icon, ProductVisual } from "@/components/Icon";
import { AddToBasketButton, WishlistButton, CompareButton, QtyStepper } from "@/components/interactive";
import { useWishlist, useCompare } from "@/lib/basket";
import { useHref } from "@/lib/design-context";
import { useQuickViewId, closeQuickView } from "@/lib/quickview";

export default function QuickView() {
  const id = useQuickViewId();
  const href = useHref();
  const qtyRef = useRef<HTMLInputElement>(null);
  const { has: hasWish } = useWishlist();
  const { has: hasCompare } = useCompare();

  useEffect(() => {
    if (id == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQuickView();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [id]);

  if (id == null) return null;
  const p = byId(id);
  if (!p) return null;
  const st = stockText(p);
  const stockTextStyle = st.cls === "in" ? undefined : { color: st.cls === "low" ? "var(--amber)" : "var(--deal)" };
  const stockDotStyle = st.cls === "in" ? undefined : { background: st.cls === "low" ? "var(--amber)" : "var(--deal)" };

  return (
    <div className="qv-overlay" role="dialog" aria-modal="true" aria-label={`Quick view — ${p.name}`} onClick={closeQuickView}>
      <div className="qv-panel" onClick={(e) => e.stopPropagation()}>
        <button className="qv-close" onClick={closeQuickView} aria-label="Close quick view">
          ×
        </button>
        <div className="qv-grid">
          <div className="qv-fig">
            {p.was ? <span className="flag">Save {money(p.was - p.price)}</span> : null}
            <ProductVisual productId={p.id} iconId={p.icon} w={220} h={170} />
          </div>
          <div className="qv-info">
            <div className="brandrow">
              <a href={href.brand(p.brandSlug)}>{p.brand}</a>
              <span>{p.sku}</span>
            </div>
            <h2>{p.name}</h2>
            <div className="stars">
              <span className="s">{stars(p.rating)}</span>
              <span>
                {p.rating} ({p.reviews.toLocaleString("en-GB")} reviews)
              </span>
            </div>
            <ul className="qv-kv">
              {Object.entries(p.specs)
                .slice(0, 6)
                .map(([k, v]) => (
                  <li key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </li>
                ))}
            </ul>
            <div className="price" style={{ marginTop: 4 }}>
              <b>{money(p.price)}</b>
              {p.was ? (
                <>
                  <s>{money(p.was)}</s>
                  <span className="save">-{Math.round(((p.was - p.price) / p.was) * 100)}%</span>
                </>
              ) : null}
            </div>
            <div className="vat">{exVat(p.price)} ex. VAT</div>
            <div className="stock">
              <i style={stockDotStyle} />
              <span style={stockTextStyle}>{st.text}</span>
            </div>
            <div className="qv-buyrow">
              <QtyStepper inputRef={qtyRef} />
              <AddToBasketButton product={p} qtyInputRef={qtyRef} className="add" style={{ flex: 1 }}>
                <Icon id="i-bag" w={16} />
                {st.cls === "out" ? "Pre-order" : "Add to basket"}
              </AddToBasketButton>
            </div>
            <div className="qv-secrow">
              <WishlistButton product={p} className="qv-secbtn">
                <Icon id="i-heart" w={15} />
                {hasWish(p.id) ? "Saved" : "Wishlist"}
              </WishlistButton>
              <CompareButton product={p} className="qv-secbtn">
                <Icon id="i-scale" w={15} />
                {hasCompare(p.id) ? "Comparing" : "Compare"}
              </CompareButton>
              <a href={href.product(p.slug)} className="qv-secbtn">
                Full details <Icon id="i-arr" w={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
