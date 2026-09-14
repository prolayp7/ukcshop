"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CAT_ORDER } from "@/lib/types";
import { tree, brands as allBrands, PRODUCTS, money, slugify } from "@/lib/catalogue";
import { Icon, ProductVisual } from "@/components/Icon";
import { BasketCount, BasketTotal } from "@/components/BasketBadge";
import { CartTrigger } from "@/components/CartDrawer";
import { useHref } from "@/lib/design-context";
import { useApi } from "@/lib/use-api";
import { ApiGeneralSettings } from "@/lib/api";
import { useWishlist, useCompare } from "@/lib/basket";
import { useCustomerAuth } from "@/lib/storefront-client";
import { MEGA_PROMO, GAMING_MEGA } from "@/lib/homepage-content";
import { theme } from "@/lib/theme.config";
import QuickView from "./QuickView";

/** Real top-level categories get a data-driven mega menu straight from the
 * catalogue, so it can never drift from what's actually stocked. */
const MEGA_ICON: Record<string, string> = {
  "PC Components": "i-gpu",
  Computers: "i-pc",
  Laptops: "i-lap",
  Peripherals: "i-mon",
  Networking: "i-net",
  Accessories: "i-cable",
};

function haystack(p: (typeof PRODUCTS)[number]): string {
  return [p.name, p.brand, p.sku, p.mpn, p.category, p.subcategory].join(" ").toLowerCase();
}

export default function Header() {
  const href = useHref();
  const settingsRes = useApi<{ data: ApiGeneralSettings }>("/api/settings/general");
  const settings = settingsRes.data?.data ?? {};
  const router = useRouter();
  const t = tree();
  const brandList = allBrands();
  const { count: wishCount } = useWishlist();
  const { count: cmpCount } = useCompare();
  const { customer, isLoggedIn } = useCustomerAuth();
  const navRef = useRef<HTMLElement>(null);

  const [q, setQ] = useState("");
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

  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return null;
    const prods = PRODUCTS.filter((p) => haystack(p).includes(s))
      .slice()
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
    const cats = Array.from(new Set(PRODUCTS.map((p) => p.subcategory))).filter((c) => c.toLowerCase().includes(s)).slice(0, 3);
    const brandHits = brandList.map((b) => b.brand).filter((b) => b.toLowerCase().includes(s)).slice(0, 4);
    return { prods, cats, brandHits };
  }, [q, brandList]);

  function runSearch(query: string) {
    setOpen(false);
    if (!query.trim()) return;
    router.push(href.category({ sub: query }));
  }

  return (
    <>
      <div className="util">
        <div className="wrap">
          <a href="#">Track my order</a>
          <a href="#">Business &amp; Education</a>
          <a href="#">Trade accounts</a>
          <div className="hints">
            <b>Popular:</b>
            <a href="#">RTX 5080</a>
            <a href="#">DDR5 32GB</a>
            <a href="#">9800X3D</a>
            <a href="#">1440p 240Hz</a>
          </div>
          <div className="sep">
            <span>
              <strong>{PRODUCTS.length}</strong> products in stock
            </span>
            <a href="#">Help centre</a>
            <a href="#">£ GBP · Inc. VAT</a>
          </div>
        </div>
      </div>
      <header className="mast">
        <div className="wrap">
          <Link className="logo" href={href.home()}>
            <Image className="mark" src={settings.logo || "/images/logo/rigforge-mark.png"} alt={theme.brand.name} width={694} height={512} priority />
          </Link>
          <div className="searchbox">
            <form
              className="search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(q.trim());
              }}
            >
              <select aria-label="Search category">
                <option>All categories</option>
                {CAT_ORDER.map((c) => (
                  <option key={c}>{c}</option>
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
                          <Link href={href.brand(slugify(b))} key={b} className="sugg-tag" onMouseDown={(e) => e.preventDefault()}>
                            {b}
                          </Link>
                        ))}
                      </>
                    ) : null}
                  </div>
                ) : null}
                {!suggestions.prods.length && !suggestions.cats.length && !suggestions.brandHits.length ? (
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
              <span className="ic">
                <Icon id="i-user" w={22} />
              </span>
              <span>
                <span className="lbl">{isLoggedIn ? customer!.firstName : "Sign in"}</span>
                <span className="val">My account</span>
              </span>
            </Link>
            <CartTrigger className="act" ariaLabel="Open basket">
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
          {t.map((node) => (
            <div className={`has-mega${openMega === node.category ? " is-open" : ""}`} key={node.category} onMouseEnter={() => setOpenMega(node.category)}>
              <Link className="top" href={href.category({ cat: node.category })} aria-expanded={openMega === node.category} aria-controls={`mega-${node.category.replace(/\s+/g, "-").toLowerCase()}`} onFocus={() => setOpenMega(node.category)}>
                <Icon id={MEGA_ICON[node.category] || "i-gpu"} w={14} h={14} />
                {node.category} <Icon className="mega-chevron" id="i-chev" w={14} />
              </Link>
              <div className="mega" id={`mega-${node.category.replace(/\s+/g, "-").toLowerCase()}`} aria-hidden={openMega !== node.category}>
                <div className="wrap">
                  <div className="mega-main">
                    <div className="mega-head">
                      <div><span>Shop department</span><h3>{node.category}</h3></div>
                      <Link href={href.category({ cat: node.category })} onClick={() => setOpenMega(null)}>View all <Icon id="i-arr" w={13} /></Link>
                    </div>
                    <div className="megagrid">
                      {node.subs.map((s) => (
                        <Link className="mega-item" href={href.category({ sub: s })} key={s} onClick={() => setOpenMega(null)}>
                          <span className="mega-item-icon"><Icon id={MEGA_ICON[node.category] || "i-gpu"} w={18} h={18} /></span>
                          <span><b>{s}</b><em>Browse {s.toLowerCase()}</em></span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  {MEGA_PROMO[node.category] ? (
                    <Link className="promo" href={href.category(MEGA_PROMO[node.category].href)} onClick={() => setOpenMega(null)}>
                      <span>Featured</span>
                      <p>{MEGA_PROMO[node.category].label}</p>
                      <em>{MEGA_PROMO[node.category].sub}</em>
                      <b>
                        Shop now <Icon id="i-arr" w={14} />
                      </b>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          <div className={`has-mega${openMega === "Gaming" ? " is-open" : ""}`} onMouseEnter={() => setOpenMega("Gaming")}>
            <Link className="top hot" href={href.category({ sub: "Gaming PCs" })} aria-expanded={openMega === "Gaming"} aria-controls="mega-gaming" onFocus={() => setOpenMega("Gaming")}>
              Gaming <Icon className="mega-chevron" id="i-chev" w={14} />
            </Link>
            <div className="mega" id="mega-gaming" aria-hidden={openMega !== "Gaming"}>
              <div className="wrap">
                <div className="mega-main">
                  <div className="mega-head">
                    <div><span>Play your way</span><h3>Gaming</h3></div>
                    <Link href={href.category({ sub: "Gaming PCs" })} onClick={() => setOpenMega(null)}>View all <Icon id="i-arr" w={13} /></Link>
                  </div>
                  <div className="megagrid megagrid-labeled">
                    {GAMING_MEGA.map((col) => (
                      <div key={col.heading}>
                        <h4>{col.heading}</h4>
                        {col.subs.map((s) => (
                          <Link href={href.category({ sub: s })} key={s} onClick={() => setOpenMega(null)}>{s}</Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <Link className="promo" href={href.category({ cat: "PC Components" })} onClick={() => setOpenMega(null)}>
                  <span>Featured</span>
                  <p>Level up your gaming</p>
                  <em>Prebuilt rigs, tested and benchmarked before they ship.</em>
                  <b>
                    Explore gaming <Icon id="i-arr" w={14} />
                  </b>
                </Link>
              </div>
            </div>
          </div>

          <Link className="top" href={href.brands()}>
            Brands
          </Link>
          <Link className="top hot" href={href.category({ deals: 1 })}>
            Deals
          </Link>
          <div className="right">
            <Icon id="i-truck" w={16} />
            <span>
              Order within <b>4h 12m</b> for next-day delivery
            </span>
          </div>
        </div>
      </nav>
      <QuickView />
    </>
  );
}
