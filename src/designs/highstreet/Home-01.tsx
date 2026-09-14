"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PRODUCTS, brands as allBrands, countIn, specialOffer, stars, money } from "@/lib/catalogue";
import { Icon, ProductVisual } from "@/components/Icon";
import { AddToBasketButton, WishlistButton } from "@/components/interactive";
import { useHref } from "@/lib/design-context";
import { useCountdown } from "@/lib/countdown";
import Header from "./Header";
import Footer from "./Footer";
import ProductCard from "./ProductCard";
import BrandCard from "./BrandCard";
import {
  GAMING_CHIPS,
  NETWORK_CHIPS,
  ACCESSORY_CHIPS,
  LAPTOP_CARDS,
  NEED_CARDS,
  RIGS,
  GUIDES,
  TECH_HUB,
  REVIEWS,
  FAQS,
  SEO_COPY_TITLE,
  SEO_COPY,
} from "@/lib/homepage-content";

const CAT_ICON: Record<string, string> = {
  Computers: "i-pc",
  Components: "i-gpu",
  Laptops: "i-lap",
  Gaming: "i-headset",
  Monitors: "i-mon",
  Peripherals: "i-kb",
  Networking: "i-net",
  Accessories: "i-cable",
  Deals: "i-card",
};

function newArrivalsFilter(tab: string) {
  if (tab === "Computers") return (p: (typeof PRODUCTS)[number]) => p.category === "Computers";
  if (tab === "Components") return (p: (typeof PRODUCTS)[number]) => p.category === "PC Components";
  if (tab === "Laptops") return (p: (typeof PRODUCTS)[number]) => p.category === "Laptops";
  if (tab === "Gaming") return (p: (typeof PRODUCTS)[number]) => GAMING_CHIPS.indexOf(p.subcategory) > -1;
  if (tab === "Peripherals") return (p: (typeof PRODUCTS)[number]) => p.category === "Peripherals";
  return () => true;
}

function SpecialOfferCard() {
  const href = useHref();
  const t = useCountdown();
  const p = specialOffer();
  const pct = Math.round(((p.was! - p.price) / p.was!) * 100);
  const soldPct = Math.round((p.sold / (p.sold + p.stock)) * 100);

  return (
    <div className="offer">
      <div className="offer-head">
        <div>
          <b>Special offer</b>
          <p>Ends this week — reduced until Sunday midnight.</p>
        </div>
        <div className="offer-clock">
          {[
            ["Days", t.d],
            ["Hrs", t.h],
            ["Min", t.m],
            ["Sec", t.s],
          ].map(([label, v]) => (
            <div key={label}>
              <b>{v}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="offer-body">
        <span className="flag">-{pct}%</span>
        <WishlistButton product={p} className="wish">
          <Icon id="i-heart" w={19} />
        </WishlistButton>
        <Link href={href.product(p.slug)} className="offer-fig">
          <ProductVisual productId={p.id} iconId={p.icon} w={150} h={110} />
        </Link>
        <div className="stars">
          <span className="s">{stars(p.rating)}</span>
          <span>
            {p.rating} ({p.reviews.toLocaleString("en-GB")})
          </span>
        </div>
        <h3>
          <Link href={href.product(p.slug)}>{p.name}</Link>
        </h3>
        <div className="price">
          <b>{money(p.price)}</b>
          <s>{money(p.was!)}</s>
        </div>
        <div className="offer-delivery">Free next-day delivery, order before 17:00</div>
        <div className="offer-stock">
          <i style={{ width: `${soldPct}%` }} />
        </div>
        <div className="offer-meta">
          <span>
            Available <b>{p.stock}</b>
          </span>
          <span>
            Sold <b>{p.sold}</b>
          </span>
        </div>
        <AddToBasketButton product={p} className="add" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>
          <Icon id="i-bag" w={16} />
          Add to basket
        </AddToBasketButton>
      </div>
    </div>
  );
}

export default function Home() {
  const href = useHref();

  const best = PRODUCTS.slice().sort((a, b) => b.sold - a.sold).slice(0, 8);
  const deals = PRODUCTS.filter((p) => p.was)
    .slice()
    .sort((a, b) => (b.was! - b.price) / b.was! - (a.was! - a.price) / a.was!)
    .slice(0, 8);
  const brandList = allBrands().slice(0, 8);

  const [arrivalTab, setArrivalTab] = useState("All");
  const arrivals = useMemo(
    () =>
      PRODUCTS.filter(newArrivalsFilter(arrivalTab))
        .slice()
        .sort((a, b) => (a.added === b.added ? a.id - b.id : a.added < b.added ? 1 : -1))
        .slice(0, 8),
    [arrivalTab],
  );

  const categoryTiles = [
    { label: "Computers", desc: "Gaming, business, workstations and mini PCs.", href: { cat: "Computers" }, count: PRODUCTS.filter((p) => p.category === "Computers").length },
    { label: "Components", desc: "CPUs, GPUs, motherboards and more.", href: { cat: "PC Components" }, count: PRODUCTS.filter((p) => p.category === "PC Components").length },
    { label: "Laptops", desc: "Gaming, business, student and refurbished.", href: { cat: "Laptops" }, count: PRODUCTS.filter((p) => p.category === "Laptops").length },
    { label: "Gaming", desc: "Rigs, laptops and gear for every frame rate.", href: { sub: "Gaming PCs" }, count: countIn("Gaming PCs") },
    { label: "Monitors", desc: "1080p to 4K, 60Hz to 240Hz.", href: { sub: "Monitors" }, count: countIn("Monitors") },
    { label: "Peripherals", desc: "Keyboards, mice, headsets and webcams.", href: { cat: "Peripherals" }, count: PRODUCTS.filter((p) => p.category === "Peripherals").length },
    { label: "Networking", desc: "Routers, mesh Wi-Fi and switches.", href: { cat: "Networking" }, count: PRODUCTS.filter((p) => p.category === "Networking").length },
    { label: "Accessories", desc: "Cables, hubs, docks and chargers.", href: { cat: "Accessories" }, count: PRODUCTS.filter((p) => p.category === "Accessories").length },
    { label: "Deals", desc: "Reduced prices across the catalogue.", href: { deals: 1 }, count: PRODUCTS.filter((p) => p.was).length },
  ];

  return (
    <>
      <Header />

      <div className="hero">
       
        <div className="hero-frame">
          <div className="grid">
            <div className="slide">
              <div className="txt">
                <div className="txt-inner">
                  <span className="tag">New in · Blackwell series</span>
                  <p className="slide-lead">GeForce RTX 5080 cards, in stock today</p>
                  <p>Sixteen models from PNY, ASUS, MSI and Gigabyte — all despatched same day from our Manchester warehouse.</p>
                  <div className="hero-actions">
                    <Link className="btn btn-p" href={href.category({ cat: "PC Components" })}>
                      Shop graphics cards <Icon id="i-arr" w={16} />
                    </Link>
                    <Link className="btn btn-g" href={href.category({ sub: "Graphics Cards" })}>
                      Compare specs
                    </Link>
                    <div className="dots" aria-label="Hero slide 1 of 4">
                      <i className="on" />
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="side">
              <Link className="scard" href={href.category({ deals: 1 })}>
                <div>
                  <span className="k">Save up to £220</span>
                  <h3>Weekend component deals</h3>
                  <p>CPUs, memory kits and NVMe drives reduced until Sunday midnight.</p>
                </div>
                <span className="go">
                  See all deals <Icon id="i-arr" w={14} />
                </span>
              </Link>
              <a className="scard" href="#">
                <div>
                  <span className="k" style={{ color: "var(--blue)" }}>
                    Free build service
                  </span>
                  <h3>Custom PC configurator</h3>
                  <p>Pick parts with live compatibility checks and wattage estimates.</p>
                </div>
                <span className="go">
                  Start a build <Icon id="i-arr" w={14} />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bene">
        <div className="wrap">
          <div className="b">
            <span className="ic">
              <Icon id="i-truck" w={20} />
            </span>
            <span>
              <b>Free next-day delivery</b>
              <span>On orders over £75</span>
            </span>
          </div>
          <div className="b">
            <span className="ic">
              <Icon id="i-shield" w={20} />
            </span>
            <span>
              <b>3-year UK warranty</b>
              <span>On all own-build systems</span>
            </span>
          </div>
          <div className="b">
            <span className="ic">
              <Icon id="i-card" w={20} />
            </span>
            <span>
              <b>0% finance available</b>
              <span>12 months, orders £600+</span>
            </span>
          </div>
          <div className="b">
            <span className="ic">
              <Icon id="i-wrench" w={20} />
            </span>
            <span>
              <b>In-house technicians</b>
              <span>Build, repair and upgrades</span>
            </span>
          </div>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Shop by category</h2>
              <p>Nine departments, one catalogue — from single components to complete systems.</p>
            </div>
          </div>
          <div className="cats">
            {categoryTiles.map((c) => (
              <Link
                className="cat"
                href={href.category(c.href)}
                key={c.label}
                style={{ backgroundImage: `url(https://picsum.photos/seed/ukcs-cat-${c.label.toLowerCase().replace(/[^a-z]+/g, "-")}/380/280)` }}
              >
                <span className="ic">
                  <Icon id={CAT_ICON[c.label] || "i-gpu"} w={18} h={16} />
                </span>
                <b>{c.label}</b>
                <em>{c.desc}</em>
                <span>
                  {c.count} products <Icon id="i-arr" w={11} h={11} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="deals">
            <div>
              <h2>Today&rsquo;s Best Deals</h2>
              <p>{deals.length} lines reduced across components, storage and displays — sorted by the biggest saving first.</p>
            </div>
            <div className="timer">
              <div>
                <b>01</b>
                <span>Days</span>
              </div>
              <div>
                <b>08</b>
                <span>Hours</span>
              </div>
              <div>
                <b>42</b>
                <span>Mins</span>
              </div>
              <div>
                <b>19</b>
                <span>Secs</span>
              </div>
            </div>
          </div>
          <div className="rail" style={{ marginTop: 16 }}>
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="head" style={{ marginTop: 4, justifyContent: "flex-end" }}>
            <Link href={href.category({ deals: 1 })}>
              View all deals <Icon id="i-arr" w={15} />
            </Link>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Best sellers</h2>
              <p>Popular with UK customers, ranked by units sold.</p>
            </div>
            <Link href={href.category({ sort: "best" })}>
              View all best sellers <Icon id="i-arr" w={15} />
            </Link>
          </div>
          <div className="rail">
            {best.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>New arrivals</h2>
              <p>Just landed — added to the catalogue most recently.</p>
            </div>
            <Link href={href.category({ sort: "newest" })}>
              View all new arrivals <Icon id="i-arr" w={15} />
            </Link>
          </div>
          <div className="cat-chips" style={{ marginBottom: 16 }}>
            {["All", "Computers", "Components", "Laptops", "Gaming", "Peripherals"].map((t) => (
              <button key={t} className={`cat-chip${arrivalTab === t ? " on" : ""}`} onClick={() => setArrivalTab(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="rail">
            {arrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Shop by need</h2>
              <p>Not sure which category you need? Start from what you&rsquo;re actually trying to do.</p>
            </div>
          </div>
          <div className="needgrid">
            {NEED_CARDS.map((c) => (
              <Link className="needcard" href={href.category(c.href)} key={c.key}>
                <h3>{c.title}</h3>
                <p>{c.copy}</p>
                <em>
                  Shop {c.title} <Icon id="i-arr" w={13} />
                </em>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Level up your gaming</h2>
              <p>Three pre-built tiers, each stress-tested for 48 hours before it ships. Customise any part before you check out.</p>
            </div>
            <Link href={href.category({ sub: "Gaming PCs" })}>
              All gaming PCs <Icon id="i-arr" w={15} />
            </Link>
          </div>
          <div className="rigs">
            {RIGS.map((r) => (
              <article className={"rig " + r.cls} key={r.name}>
                <div className="tier">{r.tier}</div>
                <h3>{r.name}</h3>
                <div className="fps">{r.fps}</div>
                <ul>
                  {r.specs.map(([k, v]) => (
                    <li key={k}>
                      <span>{k}</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
                <div className="pr">
                  <b>{r.price}</b>
                  <em>{r.monthly}</em>
                </div>
                <Link className="pick" href={href.category({ sub: "Gaming PCs" })}>
                  View gaming PCs
                </Link>
              </article>
            ))}
          </div>
          <div className="cat-chips" style={{ marginTop: 18 }}>
            {GAMING_CHIPS.map((c) => (
              <Link key={c} className="cat-chip" href={href.category({ sub: c })}>
                {c}
              </Link>
            ))}
            <Link className="cat-chip on" href={href.category({ sub: "Gaming PCs" })}>
              Explore gaming <Icon id="i-arr" w={12} h={12} />
            </Link>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="bizsplit">
            <Link className="bx biz" href={href.category({ sub: "Business PCs" })}>
              <h3>Reliable computers for modern UK businesses</h3>
              <p>Business PCs, workstations, laptops and monitors — with volume pricing on multi-unit orders.</p>
              <span className="btn">
                Shop business computing <Icon id="i-arr" w={16} />
              </span>
            </Link>
            <Link className="bx refurb" href={href.category({ sub: "Refurbished PCs" })}>
              <h3>Smart tech. Better value.</h3>
              <p>Refurbished PCs and laptops — tested, graded and clearly marked, at a lower price than new.</p>
              <span className="btn">
                Shop refurbished <Icon id="i-arr" w={16} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Laptops for work, study &amp; play</h2>
            </div>
            <Link href={href.category({ cat: "Laptops" })}>
              All laptops <Icon id="i-arr" w={15} />
            </Link>
          </div>
          <div className="laprow">
            {LAPTOP_CARDS.map((c) => (
              <Link className="lapcard" href={href.category({ sub: c.sub })} key={c.sub}>
                <h3>{c.title}</h3>
                <p>{c.copy}</p>
                <span>
                  {countIn(c.sub)} products <Icon id="i-arr" w={12} h={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="minisplit">
            <div>
              <h3>Build a better network</h3>
              <p>Routers, mesh Wi-Fi, switches and cabling for a network that keeps up.</p>
              <div className="cat-chips">
                {NETWORK_CHIPS.map((c) => (
                  <Link key={c} className="cat-chip" href={href.category({ sub: c })}>
                    {c}
                  </Link>
                ))}
              </div>
              <Link className="lk" href={href.category({ cat: "Networking" })}>
                Shop networking <Icon id="i-arr" w={15} />
              </Link>
            </div>
            <div>
              <h3>Complete your setup</h3>
              <p>Cables, hubs, docking stations and chargers to finish the job.</p>
              <div className="cat-chips">
                {ACCESSORY_CHIPS.map((c) => (
                  <Link key={c} className="cat-chip" href={href.category({ sub: c })}>
                    {c}
                  </Link>
                ))}
              </div>
              <Link className="lk" href={href.category({ cat: "Accessories" })}>
                Shop accessories <Icon id="i-arr" w={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Shop by brand</h2>
            </div>
            <Link href={href.brands()}>
              All brands <Icon id="i-arr" w={15} />
            </Link>
          </div>
          <div className="bgrid">
            {brandList.map((b) => (
              <BrandCard key={b.brand} brand={b} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="whygrid">
            <div className="whycol">
              <h2>Built by people who build PCs</h2>
              <ul className="whylist">
                <li>
                  <Icon id="i-truck" w={16} /> Fast UK-wide delivery, despatched from Manchester
                </li>
                <li>
                  <Icon id="i-shield" w={16} /> Manufacturer warranty on every product
                </li>
                <li>
                  <Icon id="i-wrench" w={16} /> Every system stress-tested for 48 hours before it ships
                </li>
                <li>
                  <Icon id="i-card" w={16} /> Secure payment and 0% finance on qualifying orders
                </li>
                <li>
                  <Icon id="i-user" w={16} /> Real technical support from people who build PCs
                </li>
              </ul>
            </div>
            <div className="revcol">
              <div className="revscore">
                <b>4.8</b>
                <span className="s">★★★★★</span>
                <span>Based on verified customer reviews</span>
              </div>
              {REVIEWS.map((r) => (
                <div className="revcard" key={r.who}>
                  <span className="s">★★★★★</span>
                  <p>&ldquo;{r.body}&rdquo;</p>
                  <b>{r.who}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Not sure what you need? Start here.</h2>
              <p>Computer buying guides</p>
            </div>
            <a href="#">
              View all guides <Icon id="i-arr" w={15} />
            </a>
          </div>
          <div className="guidegrid">
            {GUIDES.map((g) => (
              <a className="guidecard" href="#" key={g.title}>
                <span className="tg">{g.tag}</span>
                <h3>{g.title}</h3>
                <em>
                  Read guide <Icon id="i-arr" w={12} h={12} />
                </em>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Latest from the tech hub</h2>
            </div>
          </div>
          <div className="hubrow">
            {TECH_HUB.map((a) => (
              <a className="hubcard" href="#" key={a.title}>
                <span className="tg">{a.tag}</span>
                <h3>{a.title}</h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="seo-split">
            <div className="seo">
              <h2>{SEO_COPY_TITLE}</h2>
              {SEO_COPY.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <SpecialOfferCard />
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="head">
            <div>
              <h2>Frequently asked questions</h2>
            </div>
          </div>
          <div className="faqlist">
            {FAQS.map((f) => (
              <details className="faqitem" key={f.q}>
                <summary>
                  {f.q}
                  <Icon id="i-plus" w={13} h={13} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="newsletter">
            <div>
              <h3>Get restock alerts &amp; deal notifications</h3>
              <p>One email a week, mostly about stock drops and price cuts. No spam.</p>
            </div>
            <form className="newsform" onSubmit={(e) => e.preventDefault()}>
              <input type="email" required placeholder="you@example.com" aria-label="Email address" />
              <button type="submit" className="btn btn-p">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
