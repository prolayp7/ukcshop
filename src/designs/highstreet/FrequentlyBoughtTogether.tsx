"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Plus, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/catalogue";
import { Cart } from "@/lib/cart";
import { useCartDrawer } from "@/components/CartDrawer";
import { useHref } from "@/lib/design-context";

export default function FrequentlyBoughtTogether({ product, companions, minimum = 1 }: { product: Product; companions: Product[]; minimum?: number }) {
  const href = useHref();
  const openCart = useCartDrawer();
  const [excluded, setExcluded] = useState<number[]>([]);
  const [added, setAdded] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const items = [product, ...companions.filter((item, index, all) => item.id !== product.id && all.findIndex((other) => other.id === item.id) === index && item.stock > 0 && item.defaultVariantId !== null).slice(0, 2)];
  const quantity = (item: Product) => item.id === product.id ? minimum : 1;
  const available = (item: Product) => item.defaultVariantId !== null && item.stock >= quantity(item);
  const selected = items.filter((item) => available(item) && !excluded.includes(item.id));
  const total = selected.reduce((sum, item) => sum + Math.round(item.price * 100) * quantity(item), 0) / 100;
  const regular = selected.reduce((sum, item) => sum + Math.round(Math.max(item.was ?? item.price, item.price) * 100) * quantity(item), 0) / 100;
  const pending = selected.filter((item) => !added.includes(item.id));
  const count = selected.reduce((sum, item) => sum + quantity(item), 0);

  async function addSelected() {
    if (busy || !selected.length) return;
    if (!pending.length) {
      openCart();
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Sequential writes preserve the existing cart and allow safe retries after a partial failure.
      for (const item of pending) {
        await Cart.add(item.defaultVariantId!, quantity(item));
        setAdded((previous) => [...previous, item.id]);
      }
      openCart();
    } catch (failure) {
      setError(`${failure instanceof Error ? failure.message : "Could not add the selected products."} Any items already added are in your basket; retrying will only add the remaining items.`);
    } finally {
      setBusy(false);
    }
  }

  if (items.length < 2) return null;

  return <section className="product-together" aria-labelledby="product-together-title">
    <div className="product-together-heading"><div><p className="product-spec-eyebrow">Complete your setup</p><h2 id="product-together-title">Frequently Bought Together</h2></div>{regular > total && <span className="product-together-saving">Product savings {money(regular - total)}</span>}</div>
    <div className="product-together-layout">
      <div className="product-together-items">{items.map((item, index) => <div className="product-together-slot" key={item.id}>
        {index > 0 && <Plus className="product-together-plus" size={20} aria-hidden="true" />}
        <article className={`product-together-card${excluded.includes(item.id) || !available(item) ? " is-excluded" : ""}`}>
          <div className="product-together-card-top"><input type="checkbox" aria-label={`Include ${item.name}`} checked={available(item) && !excluded.includes(item.id)} disabled={busy || !available(item)} onChange={() => setExcluded((previous) => previous.includes(item.id) ? previous.filter((id) => id !== item.id) : [...previous, item.id])} /><span>{index === 0 ? "Base unit" : item.subcategory}</span></div>
          <Link href={href.product(item.slug)} className="product-together-image" aria-label={item.name}>{item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.name} width={160} height={110} loading="lazy" />
          ) : <Package size={40} aria-hidden="true" />}</Link>
          <h3><Link href={href.product(item.slug)}>{item.name}</Link></h3>
          <p>{quantity(item) > 1 ? `${quantity(item)} × ` : ""}{money(item.price)} <span>inc. VAT</span></p>
          {!available(item) && <small>Unavailable</small>}
          {added.includes(item.id) && <small>Added to basket</small>}
        </article>
      </div>)}</div>
      <div className="product-together-summary"><p className="product-together-label">Combined total</p><div className="product-together-total" aria-live="polite" aria-atomic="true"><strong>{money(total)}</strong><span>inc. VAT</span></div>{regular > total && <><s>Regular total {money(regular)}</s><span className="product-together-saving">Save {money(regular - total)}</span></>}
        <button type="button" className="product-add-button" disabled={busy || !selected.length} onClick={() => void addSelected()}><ShoppingCart size={16} aria-hidden="true" />{busy ? "Adding…" : selected.length && !pending.length ? "View basket" : `Add ${selected.length === items.length ? "all " : ""}${count} item${count === 1 ? "" : "s"} to Basket`}</button>
        <p className="product-together-note">Select the products you need. Includes the configurations shown.</p>
        {error && <p className="product-purchase-error" role="alert">{error}</p>}
      </div>
    </div>
  </section>;
}
