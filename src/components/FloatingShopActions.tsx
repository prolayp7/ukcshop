"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist, useCompare } from "@/lib/basket";
import { useHref } from "@/lib/design-context";
import { Heart, ArrowLeftRight, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCartDrawer } from "./CartDrawer";
import { consentGiven } from "./CookieBanner";
import "./floating-basket.css";

export default function FloatingShopActions() {
  const { cart } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const href = useHref();
  const openBasket = useCartDrawer();
  const [headerHidden, setHeaderHidden] = useState(false);
  const [searchHidden, setSearchHidden] = useState(false);
  const [bottom, setBottom] = useState(150);
  const count = (cart?.items ?? []).reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const headerBasket = document.querySelector(".header-basket");
    const headerSearch = document.querySelector('.searchbox input[type="search"]');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const hidden = !entry.isIntersecting && entry.boundingClientRect.bottom <= 48;
        if (entry.target === headerBasket) setHeaderHidden(hidden);
        if (entry.target === headerSearch) setSearchHidden(hidden);
      }
    }, { rootMargin: "-48px 0px 0px 0px" });
    if (headerBasket) observer.observe(headerBasket);
    if (headerSearch) observer.observe(headerSearch);
    const updatePosition = () => setBottom(consentGiven() ? 78 : 150);
    updatePosition();
    window.addEventListener("ukcs:consent-changed", updatePosition);
    return () => {
      observer.disconnect();
      window.removeEventListener("ukcs:consent-changed", updatePosition);
    };
  }, []);

  const showBasket = headerHidden && count > 0;
  const secondaryBottom = bottom + (showBasket ? 58 : 0) + (searchHidden ? 58 : 0);

  function focusSearch() {
    const input = document.querySelector<HTMLInputElement>('.searchbox input[type="search"]');
    if (!input) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    input.focus({ preventScroll: true });
  }

  return <>
    {headerHidden ? <>
      <Link className="floating-basket" style={{ bottom: secondaryBottom }} href={href.account({ tab: "wishlist" })} aria-label={`Wishlist, ${wishlist.count} items`} title="View wishlist">
        <Heart size={21} aria-hidden="true" />
        {wishlist.count > 0 ? <span className="floating-basket-count" aria-hidden="true">{wishlist.count > 99 ? "99+" : wishlist.count}</span> : null}
      </Link>
      <Link className="floating-basket" style={{ bottom: secondaryBottom + 58 }} href={href.compare()} aria-label={`Compare products, ${compare.count} items`} title="Compare products">
        <ArrowLeftRight size={21} aria-hidden="true" />
        {compare.count > 0 ? <span className="floating-basket-count" aria-hidden="true">{compare.count}</span> : null}
      </Link>
    </> : null}
    {searchHidden ? <button className="floating-basket" type="button" style={{ bottom: bottom + (showBasket ? 58 : 0) }} onClick={focusSearch} aria-label="Search products" title="Search products"><Search size={21} aria-hidden="true" /></button> : null}
    {showBasket ? <button className="floating-basket" type="button" style={{ bottom }} onClick={openBasket} aria-label={`Open basket, ${count} item${count === 1 ? "" : "s"}`} aria-haspopup="dialog" title="View your basket">
    <ShoppingBag size={21} aria-hidden="true" />
    <span className="floating-basket-count" aria-hidden="true">{count > 99 ? "99+" : count}</span>
  </button> : null}
  </>;
}
