"use client";

import { useState } from "react";
import Link from "next/link";
import { stars, money } from "@/lib/catalogue";
import { useApi } from "@/lib/use-api";
import { findCategory } from "@/lib/category";
import { ApiBrand, ApiCategory, ApiFaqCategory, ApiHomeBundle, ApiHomepageSectionType, ApiTestimonial, HomeBundle } from "@/lib/api";
import { Product } from "@/lib/types";
import { Icon, ProductVisual } from "@/components/Icon";
import { AddToBasketButton, WishlistButton } from "@/components/interactive";
import { Backlight } from "@/components/ui/backlight";
import { BorderBeam } from "@/components/ui/border-beam";
import { useHref } from "@/lib/design-context";
import { Href } from "@/lib/urls";
import { useCountdown } from "@/lib/countdown";
import Header from "./Header";
import Footer from "./Footer";
import ProductCard from "./ProductCard";
import BrandCard from "./BrandCard";
import Hero, { HeroSideCard } from "./Hero";
import {
  GAMING_CHIPS,
  NETWORK_CHIPS,
  ACCESSORY_CHIPS,
  LAPTOP_CARDS,
  NEED_CARDS,
  RIGS,
  GUIDES,
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

function bannerHref(banner: ApiHomeBundle["banners"][number], href: Href): string {
  if (banner.linkType === "PRODUCT" && banner.product) return href.product(banner.product.slug);
  if (banner.linkType === "CATEGORY" && banner.category) return href.category({ cat: banner.category.title });
  if (banner.linkType === "BRAND" && banner.brand) return href.brand(banner.brand.title);
  return banner.customUrl ?? href.home();
}

function SpecialOfferCard() {
  const href = useHref();
  const t = useCountdown();
  const offerRes = useApi<{ items: Product[] }>("/api/products?onSale=true&sort=discount_desc&perPage=1");
  const p = offerRes.data?.items[0];
  if (!p || !p.was) return null;
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

  const brandsRes = useApi<{ items: ApiBrand[] }>("/api/brands");
  const brandList = (brandsRes.data?.items ?? []).slice(0, 8).map((b) => ({
    brand: b.title, slug: b.slug, count: b.productCount ?? 0, rating: 0, min: b.priceFrom ?? 0, deals: 0,
    note: b.description || b.shortDescription || `${b.productCount ?? 0} lines in the catalogue.`,
  }));

  const homeRes = useApi<{ home: HomeBundle }>("/api/home");
  const dealsRes = useApi<{ items: Product[] }>("/api/products?onSale=true&perPage=8");
  const deals = dealsRes.data?.items ?? [];

  // Which of the admin-composed sections are visible, and in what order -
  // set from ukshop-admin's Homepage page. The six marketing sections below
  // (category showcase through the SEO/special-offer split) aren't part of
  // that system yet and always render, in their current fixed order.
  const sections = homeRes.data?.home.homepageSections ?? [];
  const sectionTypes = new Set(sections.map((section) => section.type));
  const featuredSlug = sections.find((section) => section.type === "FEATURED_PRODUCTS")?.config.slug;
  const featured = typeof featuredSlug === "string" ? homeRes.data?.home.featuredSections.find((section) => section.slug === featuredSlug) : undefined;
  const bannerPosition = sections.find((section) => section.type === "BANNERS")?.config.position;
  const positionedBanners = typeof bannerPosition === "string" ? (homeRes.data?.home.banners ?? []).filter((banner) => banner.position === bannerPosition) : [];
  const heroCards = sections.find((section) => section.type === "HERO")?.config.cards;
  const heroSideCards: HeroSideCard[] = Array.isArray(heroCards)
    ? heroCards.map((card) => ({
        kicker: typeof card?.kicker === "string" ? card.kicker : "",
        heading: typeof card?.heading === "string" ? card.heading : "",
        description: typeof card?.description === "string" ? card.description : "",
        ctaLabel: typeof card?.ctaLabel === "string" ? card.ctaLabel : "",
        href: typeof card?.href === "string" ? card.href : "/",
        image: typeof card?.image === "string" ? card.image : null,
      }))
    : [];
  const newsletterConfig = sections.find((section) => section.type === "NEWSLETTER")?.config ?? {};
  const newsletterHeading = typeof newsletterConfig.heading === "string" ? newsletterConfig.heading : "Get restock alerts & deal notifications";
  const newsletterBody = typeof newsletterConfig.body === "string" ? newsletterConfig.body : "One email a week, mostly about stock drops and price cuts. No spam.";
  const dealsConfig = sections.find((section) => section.type === "DEALS")?.config ?? {};
  const dealsHeading = typeof dealsConfig.heading === "string" ? dealsConfig.heading : "Today's Best Deals";
  const dealsBody = typeof dealsConfig.body === "string" ? dealsConfig.body : `${deals.length} lines reduced across components, storage and displays — sorted by the biggest saving first.`;
  const dealsCountdown = useCountdown(typeof dealsConfig.endsAt === "string" ? dealsConfig.endsAt : null);

  const testimonialsRes = useApi<{ items: ApiTestimonial[] }>(sectionTypes.has("TESTIMONIALS") ? "/api/testimonials" : null);
  const faqsRes = useApi<{ items: ApiFaqCategory[] }>(sectionTypes.has("FAQS") ? "/api/faqs" : null);
  const homepageFaqs = (faqsRes.data?.items ?? []).flatMap((category) => category.faqs);

  const ARRIVAL_TAB_CATEGORY: Record<string, string | undefined> = {
    All: undefined,
    Computers: "computers",
    Components: "pc-components",
    Laptops: "laptops",
    Gaming: "gaming-pcs",
    Peripherals: "peripherals",
  };
  const [arrivalTab, setArrivalTab] = useState("All");
  const arrivalsCategory = ARRIVAL_TAB_CATEGORY[arrivalTab];
  const arrivalsRes = useApi<{ items: Product[] }>(
    `/api/products?sort=newest&perPage=8${arrivalsCategory ? `&category=${arrivalsCategory}` : ""}`,
  );
  const arrivals = arrivalsRes.data?.items ?? [];

  const categoriesRes = useApi<{ items: ApiCategory[] }>("/api/categories");
  const categoryTiles = (categoriesRes.data?.items ?? [])
    .filter((c) => c.showOnHomepage)
    .map((c) => ({
      label: c.title,
      desc: c.description ? c.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : `Shop ${c.title.toLowerCase()}.`,
      href: { cat: c.title },
      count: c.productCount,
      slug: c.slug,
      image: c.thumbnailImage,
    }));

  function renderSection(section: { id: number; type: ApiHomepageSectionType }) {
    switch (section.type) {
      case "HERO":
        return <Hero key={section.id} slides={homeRes.data?.home.hero.slides ?? []} sideCards={heroSideCards} />;

      case "TRUST_STRIP": {
        const badges = homeRes.data?.home.hero.badges ?? [];
        if (!badges.length) return null;
        return (
          <div className="bene" key={section.id}>
            <div className="wrap">
              {badges.map((badge) => (
                <div className="b" key={badge.id}>
                  <span className="ic">
                    <Icon id={badge.icon ?? "i-shield"} w={20} />
                  </span>
                  <span>
                    <b>{badge.label}</b>
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "DEALS":
        if (!deals.length) return null;
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <Backlight blur={18} className="deals-backlight">
                <Link className="deals" href={href.category({ deals: 1 })}>
                  <div>
                    <h2>{dealsHeading}</h2>
                    <p>{dealsBody}</p>
                  </div>
                  <div className="timer">
                    {[[dealsCountdown.d, "Days"], [dealsCountdown.h, "Hours"], [dealsCountdown.m, "Mins"], [dealsCountdown.s, "Secs"]].map(([v, label]) => (
                      <div key={label}>
                        <b>{v}</b>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <BorderBeam className="deals-border-beam" size={160} duration={9} colorFrom="#e8b8b5" colorTo="#ffffff" borderWidth={1.5} />
                </Link>
              </Backlight>
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
        );

      case "FEATURED_PRODUCTS":
        if (!featured?.products.length) return null;
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="head">
                <div>
                  <h2>{featured.title}</h2>
                  <p>Popular with UK customers, ranked by units sold.</p>
                </div>
                <Link href={href.category({ sort: "best" })}>
                  View all <Icon id="i-arr" w={15} />
                </Link>
              </div>
              <div className="rail">
                {featured.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        );

      case "NEW_ARRIVALS":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
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
        );

      case "BRANDS":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
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
        );

      case "BANNERS":
        if (!positionedBanners.length) return null;
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="bizsplit">
                {positionedBanners.slice(0, 2).map((banner) => (
                  <Link className="bx biz" href={bannerHref(banner, href)} key={banner.id}>
                    <h3>{banner.title}</h3>
                    <span className="btn">
                      Shop now <Icon id="i-arr" w={16} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case "TESTIMONIALS": {
        const items = testimonialsRes.data?.items ?? [];
        if (!items.length) return null;
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
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
                  {items.map((r) => (
                    <div className="revcard" key={r.name}>
                      <span className="s">{"★".repeat(r.stars)}</span>
                      <p>&ldquo;{r.quote}&rdquo;</p>
                      <b>{r.name}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "FAQS":
        if (!homepageFaqs.length) return null;
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="head">
                <div>
                  <h2>Frequently asked questions</h2>
                </div>
              </div>
              <div className="faqlist">
                {homepageFaqs.map((f) => (
                  <details className="faqitem" key={f.id}>
                    <summary>
                      {f.question}
                      <Icon id="i-plus" w={13} h={13} />
                    </summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        );

      case "NEWSLETTER":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="newsletter">
                <div>
                  <h3>{newsletterHeading}</h3>
                  <p>{newsletterBody}</p>
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
        );

      case "CATEGORY_SHOWCASE":
        if (!categoryTiles.length) return null;
        return (
          <section key={section.id}>
            <div className="wrap">
              <div className="head">
                <div>
                  <h2>Shop by category</h2>
                  <p>{categoryTiles.length} departments, one catalogue — from single components to complete systems.</p>
                </div>
              </div>
              <div className="cats">
                {categoryTiles.map((c) => (
                  <Link
                    className="cat"
                    href={href.category(c.href)}
                    key={c.slug}
                    style={{ backgroundImage: `url(${c.image ?? `https://picsum.photos/seed/ukcs-cat-${c.slug}/380/280`})` }}
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
        );

      case "SHOP_BY_NEED":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
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
        );

      case "GAMING_SHOWCASE":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
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
              <div className="cat-chips" style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--c-line)" }}>
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
        );

      case "LAPTOP_SHOWCASE":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
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
                      {findCategory(categoriesRes.data?.items ?? [], c.sub)?.productCount ?? 0} products <Icon id="i-arr" w={12} h={12} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case "BUYING_GUIDES":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
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
        );

      case "SEO_INTRO":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
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
        );

      default:
        return null;
    }
  }

  return (
    <>
      <Header />

      {sections.map((section) => renderSection(section))}

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

      <Footer />
    </>
  );
}
