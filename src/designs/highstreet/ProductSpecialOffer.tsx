"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Package, ShoppingCart, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import { WishlistButton } from "@/components/interactive";
import { useCartDrawer } from "@/components/CartDrawer";
import { Cart } from "@/lib/cart";

export default function ProductSpecialOffer({ product }: { product: Product }) {
  const href = useHref();
  const openCart = useCartDrawer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = product.was ? Math.round((product.was - product.price) / product.was * 100) : 0;
  async function add() {
    if (busy || product.defaultVariantId === null) return;
    setBusy(true);
    setError("");
    try {
      await Cart.add(product.defaultVariantId, 1);
      openCart();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not add this product. Please try again.");
    } finally { setBusy(false); }
  }
  return <aside className="offer product-special-offer" aria-label="Special offer">
    <div className="offer-head"><b>Special offer</b><p>Save on this discounted product.</p></div>
    <div className="offer-body">
      {saving > 0 ? <span className="flag">-{saving}%</span> : null}
      <WishlistButton product={product} className="wish" aria-label={`Save ${product.name} to wishlist`}><Heart size={17} /></WishlistButton>
      <Link href={href.product(product.slug)} className="offer-fig" aria-label={product.name}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} width={230} height={180} loading="lazy" />
        ) : <span className="product-offer-placeholder"><Package size={48} strokeWidth={1} /><span>Image unavailable</span></span>}
      </Link>
      {product.reviews > 0 ? <div className="product-offer-rating"><span>{Array.from({ length: 5 }, (_, index) => <Star size={12} key={index} fill={index < Math.round(product.rating) ? "currentColor" : "none"} />)}</span>{product.rating.toFixed(1)} ({product.reviews.toLocaleString("en-GB")})</div> : null}
      <h3><Link href={href.product(product.slug)}>{product.name}</Link></h3>
      <div className="product-offer-price"><b>{money(product.price)}</b>{product.was ? <s>{money(product.was)}</s> : null}</div>
      <div className="offer-meta"><span>Available <b>{product.stock}</b></span><span>In stock</span></div>
      <button className="product-add-button" disabled={busy || product.defaultVariantId === null || product.stock <= 0} onClick={() => void add()}><ShoppingCart size={15} />{busy ? "Adding…" : "Add to basket"}</button>
      {error ? <p className="product-purchase-error" role="alert">{error}</p> : null}
    </div>
  </aside>;
}
