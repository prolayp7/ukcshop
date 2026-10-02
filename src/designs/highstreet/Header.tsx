"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CAT_ORDER, type Product } from "@/lib/types";
import { money, CURRENCY, CURRENCY_SYMBOL } from "@/lib/catalogue";
import { Icon, ProductVisual } from "@/components/Icon";
import { BasketCount, BasketTotal } from "@/components/BasketBadge";
import { CartTrigger } from "@/components/CartDrawer";
import { useHref, useInitialStorefrontChrome } from "@/lib/design-context";
import { useApi } from "@/lib/use-api";
import { type ApiCategory, type ApiBrand, type ListMeta, type TopBarContent } from "@/lib/api";
import { useWishlist, useCompare } from "@/lib/basket";
import { useCustomerAuth } from "@/lib/storefront-client";
import { theme } from "@/lib/theme.config";
import QuickView from "./QuickView";
import FloatingShopActions from "@/components/FloatingShopActions";

/** Icons for the category-tree fallback navigation (the admin menu sets its own). */
/** Quick searches in the top bar; each runs a normal product search. */
// Built-in top bar, shown until Admin -> Storefront -> Top bar loads (or if the API is unreachable).
const DEFAULT_TOP_BAR: TopBarContent = {
  enabled: true,
  trackOrder: { enabled: true, label: "Track my order" },
  popular: { enabled: true, label: "Popular:", terms: ["RTX 4070", "Ryzen 7", "DDR5", "NVMe"] },
  showStockCount: true,
  help: { enabled: true, label: "Help centre", href: "/faqs" },
  showCurrency: true,
};

const MEGA_ICON: Record<string, string> = {
  "PC Components": "i-gpu",
  Computers: "i-pc",
  Laptops: "i-lap",
  Peripherals: "i-mon",
  Networking: "i-net",
  Accessories: "i-cable",
};

export default function Header() {
  const href = useHref();
  const { nav: initialHeaderNav, categories: initialCategories, settings } = useInitialStorefrontChrome();
  const router = useRouter();
  const statsRes = useApi<{ meta: ListMeta }>("/api/products?perPage=1");
  const topBar = useApi<{ data: TopBarContent }>("/api/settings/top-bar").data?.data ?? DEFAULT_TOP_BAR;
  const { count: wishCount } = useWishlist();
  const { count: cmpCount } = useCompare();
  const { customer, isLoggedIn } = useCustomerAuth();
  const accountInitials = customer
    ? [customer.firstName.trim()[0], customer.lastName.trim()[0]].filter(Boolean).join("") || customer.email[0]
    : "";
  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const search = searchRef.current;
    const nav = navRef.current;
    if (!search || !nav) return;
    const alignMenu = () => {
      const bounds = search.getBoundingClientRect();
      nav.style.setProperty("--mega-center", `${bounds.left + bounds.width / 2 - nav.getBoundingClientRect().left}px`);
      nav.style.setProperty("--mega-width", `${bounds.width}px`);
    };
    const observer = new ResizeObserver(alignMenu);
    observer.observe(search);
    observer.observe(nav);
    window.addEventListener("resize", alignMenu);
    alignMenu();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", alignMenu);
    };
  }, []);

  const [q, setQ] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMega(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMega(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounced so every keystroke doesn't fire a request; product suggestions come
  // from the real catalogue search (same tokenized/synonym matching as the full
  // results page) rather than the small local mock list, which couldn't find a
  // match for anything not phrased exactly like its own fake data.
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => clearTimeout(timer);
  }, [q]);
  // Fetched once (small, slow-changing lists) rather than per keystroke, then
  // filtered client-side — same live source the category/brand pages use.
  const categoriesRes = useApi<{ items: ApiCategory[] }>("/api/categories", { items: initialCategories }, { skipInitialFetch: true });
  const categorySlug = searchCategory
    ? categoriesRes.data?.items.flatMap((category) => [category, ...category.children]).find((category) => category.title === searchCategory)?.slug
    : undefined;
  const searchRes = useApi<{ items: Product[] }>(debouncedQ.length >= 2
    ? `/api/products?q=${encodeURIComponent(debouncedQ)}${categorySlug ? `&category=${encodeURIComponent(categorySlug)}` : ""}&perPage=5`
    : null);
  const brandsRes = useApi<{ items: ApiBrand[] }>("/api/brands");
  // The admin-managed menu is loaded and tagged in the root server layout; an empty/unavailable menu
  // falls back to the same category tree without waiting for a browser request.
  const nav = useMemo(() => {
    if (initialHeaderNav) return initialHeaderNav;
    return initialCategories.map((c) => ({
      label: c.title,
      href: href.category({ cat: c.title }),
      icon: MEGA_ICON[c.title] || "i-gpu",
      highlight: false,
      panel: c.children.length ? { kind: "auto" as const, eyebrow: "Shop department", links: c.children.map((child) => ({ label: child.title, href: href.category({ sub: child.title }) })), promo: null } : null,
    }));
  }, [initialHeaderNav, initialCategories, href]);
  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return null;
    const categories = categoriesRes.data?.items ?? [];
    const cats = Array.from(new Set(categories.flatMap((c) => [c.title, ...c.children.map((child) => child.title)])))
      .filter((title) => title.toLowerCase().includes(s))
      .slice(0, 3);
    const brandHits = (brandsRes.data?.items ?? [])
      .filter((b) => b.title.toLowerCase().includes(s))
      .slice(0, 4);
    return { prods: searchRes.data?.items ?? [], cats, brandHits, loading: searchRes.loading };
  }, [q, categoriesRes.data, brandsRes.data, searchRes.data, searchRes.loading]);

  function runSearch(query: string) {
    setOpen(false);
    if (!query.trim()) return;
    router.push(href.category({ ...(searchCategory ? { cat: searchCategory } : {}), q: query }));
  }

  return (
    <>
      {topBar.enabled ? (
        <div className="util">
          <div className="wrap">
            {/* Empty placeholders keep the three-column layout when a part is switched off. */}
            {topBar.trackOrder.enabled && topBar.trackOrder.label ? <Link href={href.account({ tab: "orders" })}>{topBar.trackOrder.label}</Link> : <span />}
            {topBar.popular.enabled && topBar.popular.terms.length ? (
              <div className="hints">
                {topBar.popular.label ? <b>{topBar.popular.label}</b> : null}
                {topBar.popular.terms.map((term) => <Link key={term} href={href.category({ q: term })}>{term}</Link>)}
              </div>
            ) : <span />}
            <div className="sep">
              {topBar.showStockCount && statsRes.data ? (
                <span>
                  <strong>{statsRes.data.meta.total}</strong> products in stock
                </span>
              ) : (
                <span />
              )}
              {topBar.help.enabled && topBar.help.label && topBar.help.href ? <Link href={topBar.help.href}>{topBar.help.label}</Link> : null}
              {topBar.showCurrency ? <span>{CURRENCY_SYMBOL} {CURRENCY} · Inc. VAT</span> : null}
            </div>
          </div>
        </div>
      ) : null}
      <header className="mast">
        <div className="wrap">
          <Link className="logo" href={href.home()}>
            <Image className="mark" src={settings.logo || "/images/logo/rigforge-mark.png"} alt={theme.brand.name} width={694} height={512} priority />
          </Link>
          <div className="searchbox" ref={searchRef}>
            <form
              className="search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(q.trim());
              }}
            >
              <select aria-label="Search category" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
                <option value="">All categories</option>
                {CAT_ORDER.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Search by name, SKU, MPN, brand or specification…"
              />
              <button type="submit">
                <Icon id="i-search" w={17} />
                Search
              </button>
            </form>
            {open && suggestions ? (
              <div className="sugg">
                {suggestions.prods.length ? (
                  <div className="sugg-col">
                    <div className="sugg-h">Products</div>
                    {suggestions.prods.map((p) => (
                      <Link key={p.id} href={href.product(p.slug)} className="sugg-p" onMouseDown={(e) => e.preventDefault()}>
                        <ProductVisual productId={p.id} iconId={p.icon} w={34} h={26} />
                        <span className="sugg-ptx">
                          <b>{p.name}</b>
                          <span>{p.brand}</span>
                        </span>
                        <span className="sugg-price">{money(p.price)}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
                {suggestions.cats.length || suggestions.brandHits.length ? (
                  <div className="sugg-side">
                    {suggestions.cats.length ? (
                      <>
                        <div className="sugg-h">Categories</div>
                        {suggestions.cats.map((c) => (
                          <Link href={href.category({ sub: c })} key={c} className="sugg-tag" onMouseDown={(e) => e.preventDefault()}>
                            {c}
                          </Link>
                        ))}
                      </>
                    ) : null}
                    {suggestions.brandHits.length ? (
                      <>
                        <div className="sugg-h">Brands</div>
                        {suggestions.brandHits.map((b) => (
                          <Link href={href.brand(b.slug)} key={b.slug} className="sugg-tag" onMouseDown={(e) => e.preventDefault()}>
                            {b.title}
                          </Link>
                        ))}
                      </>
                    ) : null}
                  </div>
                ) : null}
                {suggestions.loading && !suggestions.prods.length ? (
                  <div className="sugg-empty">Searching…</div>
                ) : !suggestions.prods.length && !suggestions.cats.length && !suggestions.brandHits.length ? (
                  <div className="sugg-empty">No matches — press Enter to search the full catalogue anyway.</div>
                ) : (
                  <button type="button" className="sugg-all" onMouseDown={(e) => e.preventDefault()} onClick={() => runSearch(q)}>
                    View all results for &ldquo;{q}&rdquo; <Icon id="i-arr" w={13} />
                  </button>
                )}
              </div>
            ) : null}
          </div>
          <div className="mast-actions">
            <Link className="act" href={href.compare()} aria-label="Compare products">
              <span className="ic">
                <Icon id="i-compare" w={22} />
                {cmpCount ? <span className="badge">{cmpCount}</span> : null}
              </span>
              <span>
                <span className="lbl">Products</span>
                <span className="val">Compare</span>
              </span>
            </Link>
            <Link className="act" href={href.account({ tab: "wishlist" })} aria-label="Wishlist">
              <span className="ic">
                <Icon id="i-heart" w={22} />
                {wishCount ? <span className="badge">{wishCount}</span> : null}
              </span>
              <span>
                <span className="lbl">Saved</span>
                <span className="val">Wishlist</span>
              </span>
            </Link>
            <Link className="act" href={isLoggedIn ? href.account() : href.login()} aria-label="My account">
              <span className={`ic${isLoggedIn ? " account-initials" : ""}`} aria-hidden="true">
                {isLoggedIn ? accountInitials : <Icon id="i-user" w={22} />}
              </span>
              <span>
                <span className="lbl">{isLoggedIn ? customer?.firstName : "Sign in"}</span>
                <span className="val">My account</span>
              </span>
            </Link>
            <CartTrigger className="act header-basket" ariaLabel="Open basket">
              <span className="ic">
                <Icon id="i-bag" w={22} />
                <span className="badge basket-badge"><BasketCount /></span>
              </span>
              <span>
                <span className="lbl">Basket</span>
                <span className="val">
                  <BasketTotal />
                </span>
              </span>
            </CartTrigger>
          </div>
        </div>
      </header>
      <nav className="nav" ref={navRef} aria-label="Primary navigation" onMouseLeave={() => setOpenMega(null)} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpenMega(null);
      }}>
        <div className="wrap">
          {nav.map((item) => {
            const topClass = `top${item.highlight ? " hot" : ""}`;
            const icon = item.icon ? <Icon id={item.icon} w={14} h={14} /> : null;
            if (!item.panel) return <Link className={topClass} href={item.href} key={item.label}>{icon}{item.label}</Link>;
            const panel = item.panel;
            const panelId = `mega-${item.label.replace(/\W+/g, "-").toLowerCase()}`;
            const close = () => setOpenMega(null);
            return (
              <div className={`has-mega${openMega === item.label ? " is-open" : ""}`} key={item.label} onMouseEnter={() => setOpenMega(item.label)}>
                <Link className={topClass} href={item.href} aria-expanded={openMega === item.label} aria-controls={panelId} onFocus={() => setOpenMega(item.label)}>
                  {icon}
                  {item.label} <Icon className="mega-chevron" id="i-chev" w={14} />
                </Link>
                <div className="mega" id={panelId} aria-hidden={openMega !== item.label}>
                  <div className="wrap">
                    <div className="mega-main">
                      <div className="mega-head">
                        <div>{panel.eyebrow ? <span>{panel.eyebrow}</span> : null}<h3>{item.label}</h3></div>
                        <Link href={item.href} onClick={close}>View all <Icon id="i-arr" w={13} /></Link>
                      </div>
                      {panel.kind === "auto" ? (
                        <div className="megagrid">
                          {panel.links.map((link) => (
                            <Link className="mega-item" href={link.href} key={link.href} onClick={close}>
                              <span className="mega-item-icon"><Icon id={item.icon || "i-gpu"} w={18} h={18} /></span>
                              <span><b>{link.label}</b><em>Browse {link.label.toLowerCase()}</em></span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="megagrid megagrid-labeled">
                          {panel.columns.map((column, index) => (
                            <div key={index}>
                              {column.title ? <h4>{column.title}</h4> : null}
                              {column.links.map((link) => <Link href={link.href} key={`${link.label}-${link.href}`} onClick={close}>{link.label}</Link>)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {panel.promo ? (
                      <Link className="promo" href={panel.promo.href} onClick={close}>
                        <span>Featured</span>
                        <p>{panel.promo.title}</p>
                        {panel.promo.text ? <em>{panel.promo.text}</em> : null}
                        <b>
                          {panel.promo.cta} <Icon id="i-arr" w={14} />
                        </b>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="right">
            <Icon id="i-truck" w={16} />
            <span>
              Order within <b>4h 12m</b> for next-day delivery
            </span>
          </div>
        </div>
      </nav>
      <QuickView />
      <FloatingShopActions />
    </>
  );
}
