"use client";

import Link from "next/link";
import { recommended, money, stars } from "@/lib/catalogue";
import { Icon, ProductVisual } from "@/components/Icon";
import { AddToBasketButton } from "@/components/interactive";
import { useHref } from "@/lib/design-context";

/** Fills the empty gutter beside the auth form with real, buyable products
 * instead of a static banner - keeps purchase intent alive without
 * competing with the sign-in/register task itself. */
export default function AuthPromo() {
  const href = useHref();
  const products = recommended(3);
  if (!products.length) return null;

  return (
    <aside className="auth-promo">
      <div className="auth-promo-head">
        <h2>Trending now</h2>
        <Link href={href.category({ deals: 1 })}>
          See all deals <Icon id="i-arr" w={13} />
        </Link>
      </div>
      <p className="auth-promo-sub">Save your build, track orders and get notified the moment prices drop.</p>
      <ul className="auth-promo-list">
        {products.map((p, i) => (
          <li key={p.id} style={{ animationDelay: `${i * 70}ms` }}>
            <Link href={href.product(p.slug)} className="auth-promo-fig">
              <ProductVisual productId={p.id} iconId={p.icon} w={38} h={30} />
            </Link>
            <div className="auth-promo-info">
              <Link href={href.product(p.slug)}>{p.name}</Link>
              <span className="auth-promo-stars">{stars(p.rating)}</span>
              <div className="auth-promo-price">
                <b>{money(p.price)}</b>
                {p.was ? <s>{money(p.was)}</s> : null}
              </div>
            </div>
            <AddToBasketButton product={p} className="auth-promo-add" aria-label={`Add ${p.name} to basket`}>
              <Icon id="i-bag" w={16} />
            </AddToBasketButton>
          </li>
        ))}
      </ul>
    </aside>
  );
}
