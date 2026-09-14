"use client";

import { DesignParts } from "@/lib/parts";
import { Cart, useCart, CartLine } from "@/lib/cart";
import { useRecentIds } from "@/lib/basket";
import { money, recommended, byId } from "@/lib/catalogue";
import { theme } from "@/lib/theme.config";
import { Product } from "@/lib/types";
import { Icon, ProductVisual } from "@/components/Icon";
import { useHref } from "@/lib/design-context";
import Link from "next/link";

function stockLabel(qty: number): { cls: string; text: string } {
  if (qty <= 0) return { cls: "out", text: "Out of stock" };
  if (qty <= 5) return { cls: "low", text: `Only ${qty} left` };
  return { cls: "in", text: "In stock" };
}

export default function BasketPage({ parts }: { parts: DesignParts }) {
  const { Header, Footer, Crumbs, Section } = parts;
  const href = useHref();
  const { cart, loaded } = useCart();
  const recentIds = useRecentIds();
  const lines = cart?.items ?? [];
  const empty = loaded && lines.length === 0;
  const subtotal = cart?.subtotal ?? 0;
  const toFreeDelivery = Math.max(0, theme.features.freeDeliveryThresholdGbp - subtotal);

  const rec = recommended(4, []);
  const recentlyViewed = recentIds
    .map(byId)
    .filter((p): p is Product => p !== null)
    .slice(0, 4);

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "Basket" }]} />
      <div className="wrap">
        <div className="bk-head">
          <h1>Your basket</h1>
          {empty ? null : (
            <span>
              {lines.reduce((n, l) => n + l.quantity, 0)} item{lines.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {empty ? (
          <div className="bk-empty">
            <Icon id="i-bag" w={34} />
            <h3>Your basket is empty</h3>
            <p>Once you add something it will show here, with delivery worked out at checkout.</p>
            <Link className="bk-cta" href={href.home()}>
              Browse the catalogue
            </Link>
          </div>
        ) : (
          <div className="bk-layout">
            <div className="bk-lines">
              {lines.map((l) => (
                <BasketLineRow key={l.productVariantId} line={l} href={href} />
              ))}
              <Link className="bk-continue" href={href.home()}>
                ← Continue shopping
              </Link>
            </div>
            <aside className="bk-sum">
              <h2>Summary</h2>
              <div className="bk-row">
                <span>Goods total</span>
                <b>{money(subtotal)}</b>
              </div>
              {toFreeDelivery > 0 ? <div className="bk-nudge">Add {money(toFreeDelivery)} more for free delivery</div> : null}
              <div className="bk-vat">Delivery and any coupon are calculated at checkout.</div>
              <Link className="bk-cta" href={href.checkout()}>
                Checkout <Icon id="i-arr" w={15} />
              </Link>
              <div className="bk-pay">
                {theme.paymentMethods.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
              <ul className="bk-perks">
                <li>
                  <Icon id="i-truck" w={14} />
                  <span>Free next-day delivery over £{theme.features.freeDeliveryThresholdGbp}</span>
                </li>
                <li>
                  <Icon id="i-shield" w={14} />
                  <span>30-day returns, UK warranty support</span>
                </li>
                <li>
                  <Icon id="i-card" w={14} />
                  <span>0% finance available at checkout</span>
                </li>
              </ul>
            </aside>
          </div>
        )}
      </div>
      {empty ? <Section title="Recommended for you" sub="Popular right now across the catalogue." items={rec} /> : null}
      {recentlyViewed.length ? <Section title="Recently viewed" items={recentlyViewed} /> : null}
      <Footer />
    </>
  );
}

function BasketLineRow({ line, href }: { line: CartLine; href: ReturnType<typeof useHref> }) {
  const stk = stockLabel(line.variant.stockQty ?? 0);
  const productHref = href.product(line.variant.product.slug);
  const lineTotal = line.unitPrice * line.quantity;
  return (
    <div className="bk-line">
      <Link className="bk-fig" href={productHref}>
        <ProductVisual productId={line.productId} iconId="package" w={86} h={62} />
      </Link>
      <div className="bk-info">
        <h3>
          <Link href={productHref}>{line.variant.product.title}</Link>
        </h3>
        <div className="bk-meta">
          <span>{line.variant.title}</span>
          <span className={`bk-${stk.cls}`}>{stk.text}</span>
        </div>
      </div>
      <div className="bk-qty">
        <button onClick={() => void Cart.setQty(line.productVariantId, line.quantity - 1)}>−</button>
        <input value={line.quantity} inputMode="numeric" readOnly />
        <button onClick={() => void Cart.setQty(line.productVariantId, line.quantity + 1)}>+</button>
      </div>
      <div className="bk-money">
        <b>{money(lineTotal)}</b>
        {line.quantity > 1 ? <span>{money(line.unitPrice)} each</span> : null}
        {line.onSale ? <span className="bk-save">On sale</span> : null}
        <button className="bk-rm" onClick={() => void Cart.remove(line.productVariantId)}>
          Remove
        </button>
      </div>
    </div>
  );
}
