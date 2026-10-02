"use client";

import Link from "next/link";
import { ArrowLeftRight, Clock3, Eye, Heart, Package, ShoppingCart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { money, exVat } from "@/lib/catalogue";
import { AddToBasketButton, WishlistButton } from "@/components/interactive";
import { useHref } from "@/lib/design-context";
import { useCompare } from "@/lib/basket";
import { openQuickView } from "@/lib/quickview";
import { BorderBeam } from "@/components/ui/border-beam";

function DealCountdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  if (!remaining) return null;
  const seconds = Math.floor(remaining / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const label = days > 0
    ? `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`
    : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;

  return <div className="category-deal-countdown"><Clock3 size={14} /><span>Offer ends in</span><time dateTime={endsAt}>{label}</time></div>;
}

export default function CategoryProductCard({ product: p, showDealTimer = false }: { product: Product; showDealTimer?: boolean }) {
  const href = useHref();
  const compare = useCompare();
  return <article className="category-product">
    <BorderBeam colorFrom="#e2231a" colorTo="#ff8a80" size={90} duration={7} borderWidth={1.5} />
    <div className="category-product-visual">
      {p.was && p.was > p.price ? <span className="category-product-badge">Save {money(p.was - p.price)}</span> : p.isNew ? <span className="category-product-badge">New</span> : null}
      <WishlistButton product={p} className="category-wishlist" aria-label={`Save ${p.name} to wishlist`}><Heart size={17} /></WishlistButton>
      <Link href={href.product(p.slug)} aria-label={p.name}>
        {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt={p.name} loading="lazy" width={280} height={260} />
        ) : <div className="category-image-placeholder"><Package size={52} /><span>Image unavailable</span></div>}
      </Link>
    </div>
    <div className="category-product-info">
      {p.reviews > 0 ? <div className="category-rating" aria-label={`${p.rating} out of 5, ${p.reviews} reviews`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={17} fill={i < Math.round(p.rating) ? "currentColor" : "none"} />)}<span>({p.reviews})</span></div> : null}
      <h3><Link href={href.product(p.slug)}>{p.name}</Link></h3>
      {Object.keys(p.specs).length > 0 ? <dl className="category-product-specs">{Object.entries(p.specs).slice(0, 3).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl> : null}
      <p className={`category-stock ${p.stockStatus}`}><i />{p.stockStatus === "out" ? "Out of Stock" : p.stockStatus === "low" ? `Low Stock — ${p.stock} left` : `In Stock (${p.stock} available)`}</p>
    </div>
    <div className="category-product-buy">
      {showDealTimer && p.dealEndsAt ? <DealCountdown endsAt={p.dealEndsAt} /> : null}
      <div className="category-product-price"><strong>{money(p.price)}</strong>{p.was && p.was > p.price ? <s>{money(p.was)}</s> : null}</div>
      <div className="category-vat"><span>Inc. 20% VAT</span><b>{exVat(p.price)} ex. VAT</b></div>
      <div className="category-product-actions"><AddToBasketButton product={p} disabled={p.stockStatus === "out"} className="category-add"><ShoppingCart size={18} />{p.stockStatus === "out" ? "Out of stock" : "Quick Add"}</AddToBasketButton><button type="button" aria-label={`Quick view ${p.name}`} className="category-view-product" onClick={() => openQuickView(p.id)}><Eye size={18} /></button></div>
      <button className="category-compare" aria-pressed={compare.has(p.id)} onClick={() => compare.toggle(p)}><ArrowLeftRight size={16} />{compare.has(p.id) ? "Added to compare" : "Compare"}</button>
    </div>
  </article>;
}
