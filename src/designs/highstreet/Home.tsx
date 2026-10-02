"use client";

import { useState } from "react";
import Link from "next/link";
import { stars, money } from "@/lib/catalogue";
import { useApi } from "@/lib/use-api";
import { findCategory } from "@/lib/category";
import type { ApiBrand, ApiCategory, ApiFaqCategory, ApiHomeBundle, ApiHomepageSectionType, ApiTestimonial, HomeBundle } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Icon, ProductVisual } from "@/components/Icon";
import { AddToBasketButton, WishlistButton } from "@/components/interactive";
import { Backlight } from "@/components/ui/backlight";
import { BorderBeam } from "@/components/ui/border-beam";
import { useHref } from "@/lib/design-context";
import { Href } from "@/lib/urls";
import { useCountdown } from "@/lib/countdown";
import Header from "./Header";
import Footer from "./Footer";
import NewsletterForm from "./NewsletterForm";
import ProductCard from "./ProductCard";
import BrandCard from "./BrandCard";
import Hero, { HeroSideCard } from "./Hero";
import {
  GAMING_CHIPS,
  LAPTOP_CARDS,
  NEED_CARDS,
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

/** Default featured-rail subtitle, by how the rail picks its products (Merchandising > Featured sections). */
const FEATURED_SUBTITLE: Record<string, string> = {
  BEST_SELLER: "Popular with UK customers, ranked by units sold.",
  NEWLY_ADDED: "The latest additions to the catalogue.",
  TOP_RATED: "Our highest-rated products.",
  FEATURED: "Hand-picked by our team.",
  MANUAL: "Hand-picked by our team.",
};

type HomeInitialData = {
  brands: ApiBrand[];
  home: HomeBundle | null;
  deals: Product[];
  offer: Product[];
  testimonials: ApiTestimonial[];
  faqs: ApiFaqCategory[];
  reviewSummary: { count: number; average: number | null } | null;
  arrivals: Product[];
  categories: ApiCategory[];
};

type GamingTier = {
  product: Product;
  tier: string;
  fps: string;
  ctaLabel: string;
  specs: { label: string; value: string }[];
};

function configuredGamingTiers(value: unknown): GamingTier[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const product = record.product as Product | undefined;
    if (!product || typeof product.slug !== "string" || typeof product.name !== "string" || typeof product.price !== "number") return [];
    const specs = Array.isArray(record.specs) ? record.specs.flatMap((spec) => {
      if (!spec || typeof spec !== "object" || Array.isArray(spec)) return [];
      const entry = spec as Record<string, unknown>;
      return typeof entry.label === "string" && typeof entry.value === "string" ? [{ label: entry.label, value: entry.value }] : [];
    }) : [];
    return [{
      product,
      tier: typeof record.tier === "string" ? record.tier : "",
      fps: typeof record.fps === "string" ? record.fps : "",
      ctaLabel: typeof record.ctaLabel === "string" && record.ctaLabel.trim() ? record.ctaLabel : "View gaming PC",
      specs,
    }];
  });
}

function SpecialOfferCard({ initialProducts }: { initialProducts: Product[] }) {
  const href = useHref();
  const offerRes = useApi<{ items: Product[] }>("/api/products?onSale=true&sort=discount_desc&perPage=1", { items: initialProducts }, { skipInitialFetch: true });
  const p = offerRes.data?.items[0];
  if (!p || !p.was) return null;
  const pct = Math.round(((p.was! - p.price) / p.was!) * 100);
  const soldPct = Math.round((p.sold / (p.sold + p.stock)) * 100);

  return (
    <div className="offer">
      <div className="offer-head">
        <div>
          <b>Special offer</b>
          {/* No countdown: products carry no sale end date, so any deadline shown here would be invented. */}
          <p>Our biggest saving right now.</p>
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

export default function Home({ initialData }: { initialData: HomeInitialData }) {
  const href = useHref();

  const brandsRes = useApi<{ items: ApiBrand[] }>("/api/brands", { items: initialData.brands }, { skipInitialFetch: true });
  const allBrandList = (brandsRes.data?.items ?? []).map((b) => ({
    brand: b.title, slug: b.slug, count: b.productCount ?? 0, rating: 0, min: b.priceFrom ?? 0, deals: 0,
    note: b.description || b.shortDescription || `${b.productCount ?? 0} lines in the catalogue.`,
    logo: b.logo, logoAlt: b.logoAlt,
  }));

  const homeRes = useApi<{ home: HomeBundle }>("/api/home", initialData.home ? { home: initialData.home } : null, { skipInitialFetch: true });
  const dealsRes = useApi<{ items: Product[] }>("/api/products?onSale=true&perPage=8", { items: initialData.deals }, { skipInitialFetch: true });
  const deals = dealsRes.data?.items ?? [];
  const nextDealEndsAt = deals
    .map((product) => product.dealEndsAt)
    .filter((endsAt): endsAt is string => typeof endsAt === "string" && !Number.isNaN(Date.parse(endsAt)))
    .sort((left, right) => Date.parse(left) - Date.parse(right))[0] ?? null;

  // Which of the admin-composed sections are visible, and in what order -
  // set from ukshop-admin's Homepage page.
  const sections = homeRes.data?.home.homepageSections ?? [];
  const sectionTypes = new Set(sections.map((section) => section.type));
  const configuredBrandSlugs = sections.find((section) => section.type === "BRANDS")?.config.brandSlugs;
  const brandList = (Array.isArray(configuredBrandSlugs)
    ? allBrandList.filter((brand) => configuredBrandSlugs.includes(brand.slug))
    : allBrandList).slice(0, 8);
  const gamingSection = sections.find((section) => section.type === "GAMING_SHOWCASE");
  const gamingTiers = configuredGamingTiers(gamingSection?.config.products);
  const gamingChipSlugs = Array.isArray(gamingSection?.config.chips) ? gamingSection.config.chips.filter((chip): chip is string => typeof chip === "string") : GAMING_CHIPS;
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
  // Each section's heading and body come from Admin > Homepage > Edit content. The API fills in the
  // original copy as defaults; null means "work it out from live data", "" hides the line.
  const sectionText = (section: { config: Record<string, unknown> }, key: "heading" | "body") => {
    const value = section.config[key];
    return typeof value === "string" ? value : null;
  };
  const configCards = (section: { config: Record<string, unknown> }, fallback: Array<{ title: string; copy: string; href: { sub: string } }>) => {
    const rawCards = Array.isArray(section.config.cards) ? section.config.cards : [];
    if (!rawCards.length) {
      return fallback.map((card, index) => ({ ...card, key: `${card.title || "card"}-${index}` }));
    }
    return rawCards.flatMap((card, index) => {
      if (!card || typeof card !== "object") return [];
      const item = card as Record<string, unknown>;
      const fallbackCard = fallback[index] ?? fallback[0];
      const title = typeof item.title === "string" ? item.title : fallbackCard?.title ?? "";
      const copy = typeof item.text === "string" ? item.text : typeof item.copy === "string" ? item.copy : fallbackCard?.copy ?? "";
      const categorySlug = typeof item.categorySlug === "string" ? item.categorySlug : fallbackCard?.href.sub ?? "";
      if (!title && !copy && !categorySlug) return [];
      return [{ key: `${title || fallbackCard?.title || "card"}-${index}`, title, copy, href: { sub: categorySlug || fallbackCard?.href.sub || "" } }];
    });
  };
  const dealsConfig = sections.find((section) => section.type === "DEALS") ?? { config: {} as Record<string, unknown> };
  const dealsHeading = sectionText(dealsConfig, "heading") || "Today's Best Deals";
  const dealsBody = sectionText(dealsConfig, "body") ?? `${deals.length} lines reduced across components, storage and displays — sorted by the biggest saving first.`;
  const dealsCountdown = useCountdown(nextDealEndsAt);

  const testimonialsRes = useApi<{ items: ApiTestimonial[] }>(sectionTypes.has("TESTIMONIALS") ? "/api/testimonials" : null, { items: initialData.testimonials }, { skipInitialFetch: true });
  const faqsRes = useApi<{ items: ApiFaqCategory[] }>(sectionTypes.has("FAQS") ? "/api/faqs" : null, { items: initialData.faqs }, { skipInitialFetch: true });
  // Real store-wide score from approved product reviews; hidden when there are none.
  const reviewSummary = useApi<{ data: { count: number; average: number | null } }>(sectionTypes.has("TESTIMONIALS") ? "/api/reviews/summary" : null, initialData.reviewSummary ? { data: initialData.reviewSummary } : null, { skipInitialFetch: true }).data?.data;
  const faqIds = sections.find((section) => section.type === "FAQS")?.config.faqIds;
  const homepageFaqs = (faqsRes.data?.items ?? [])
    .flatMap((category) => category.faqs)
    .filter((faq) => !Array.isArray(faqIds) || faqIds.includes(faq.id));

  const categoriesRes = useApi<{ items: ApiCategory[] }>("/api/categories", { items: initialData.categories }, { skipInitialFetch: true });
  const configuredArrivalTabs = sections.find((section) => section.type === "NEW_ARRIVALS")?.config.tabs;
  const arrivalTabSlugs = Array.isArray(configuredArrivalTabs)
    ? [...new Set(configuredArrivalTabs.filter((slug): slug is string => typeof slug === "string"))]
    : ["computers", "pc-components", "laptops", "gaming-pcs", "peripherals"];
  const arrivalTabs = [
    { slug: "", title: "All" },
    ...arrivalTabSlugs.flatMap((slug) => {
      const category = findCategory(categoriesRes.data?.items ?? [], slug);
      return category ? [{ slug, title: category.title }] : [];
    }),
  ];
  const [arrivalTab, setArrivalTab] = useState("");
  const arrivalsCategory = arrivalTab || undefined;
  const arrivalsRes = useApi<{ items: Product[] }>(
    `/api/products?sort=newest&perPage=8${arrivalsCategory ? `&category=${arrivalsCategory}` : ""}`,
    { items: initialData.arrivals },
    { skipInitialFetch: true },
  );
  const arrivals = arrivalsRes.data?.items ?? [];

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

  function renderSection(section: { id: number; type: ApiHomepageSectionType; config: Record<string, unknown> }) {
    const heading = sectionText(section, "heading");
    const body = sectionText(section, "body");
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
                    {dealsBody ? <p>{dealsBody}</p> : null}
                  </div>
                  {/* The timer tracks the earliest product-level end date among the displayed deals. */}
                  {dealsCountdown ? (
                    <div className="deals-timer">
                      <span>Next deal ends in</span>
                      <div className="timer">
                        {[[dealsCountdown.d, "Days"], [dealsCountdown.h, "Hours"], [dealsCountdown.m, "Mins"], [dealsCountdown.s, "Secs"]].map(([v, label]) => (
                          <div key={label}>
                            <b>{v}</b>
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
                  <h2>{heading || featured.title}</h2>
                  {(body ?? FEATURED_SUBTITLE[featured.sectionType] ?? FEATURED_SUBTITLE.MANUAL) ? <p>{body ?? FEATURED_SUBTITLE[featured.sectionType] ?? FEATURED_SUBTITLE.MANUAL}</p> : null}
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
                  <h2>{heading}</h2>
                  {body ? <p>{body}</p> : null}
                </div>
                <Link href={href.category({ sort: "newest" })}>
                  View all new arrivals <Icon id="i-arr" w={15} />
                </Link>
              </div>
              <div className="cat-chips" style={{ marginBottom: 16 }}>
                {arrivalTabs.map((tab) => (
                  <button key={tab.slug || "all"} className={`cat-chip${arrivalTab === tab.slug ? " on" : ""}`} onClick={() => setArrivalTab(tab.slug)}>
                    {tab.title}
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
                  <h2>{heading}</h2>
                  {body ? <p>{body}</p> : null}
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
                  <h2>{heading}</h2>
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
                  {reviewSummary?.average ? (
                    <div className="revscore">
                      <b>{reviewSummary.average.toFixed(1)}</b>
                      <span className="s">{stars(reviewSummary.average)}</span>
                      <span>Based on {reviewSummary.count.toLocaleString("en-GB")} customer review{reviewSummary.count === 1 ? "" : "s"}</span>
                    </div>
                  ) : null}
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
                  <h2>{heading}</h2>
                  {body ? <p>{body}</p> : null}
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
                  <h3>{heading}</h3>
                  {body ? <p>{body}</p> : null}
                </div>
                <NewsletterForm />
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
                  <h2>{heading}</h2>
                  {body ? <p>{body.replaceAll("{count}", String(categoryTiles.length))}</p> : null}
                </div>
              </div>
              <div className="cats">
                {categoryTiles.map((c) => (
                  <Link
                    className="cat"
                    href={href.category(c.href)}
                    key={c.slug}
                    style={c.image ? { backgroundImage: `url(${c.image})` } : undefined}
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

      case "SHOP_BY_NEED": {
        const cards = configCards(section, NEED_CARDS.map((card) => ({ ...card, href: { sub: (card.href as { sub?: string }).sub ?? "" } })));
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="head">
                <div>
                  <h2>{heading}</h2>
                  {body ? <p>{body}</p> : null}
                </div>
              </div>
              <div className="needgrid">
                {cards.map((c) => (
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
      }

      case "GAMING_SHOWCASE": {
        if (!gamingTiers.length) return null;
        const chips = gamingChipSlugs.flatMap((slug) => {
          const category = findCategory(categoriesRes.data?.items ?? [], slug);
          return category ? [{ slug, title: category.title }] : [];
        });
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="head">
                <div>
                  <h2>{heading}</h2>
                  {body ? <p>{body}</p> : null}
                </div>
                <Link href={href.category({ sub: "Gaming PCs" })}>
                  All gaming PCs <Icon id="i-arr" w={15} />
                </Link>
              </div>
              <div className="rigs">
                {gamingTiers.map((r, index) => (
                  <article className={`rig ${["a", "b", "c"][index % 3]}`} key={r.product.slug}>
                    <div className="tier">{r.tier}</div>
                    <h3>{r.product.name}</h3>
                    {r.fps ? <div className="fps">{r.fps}</div> : null}
                    <ul>
                      {(r.specs.length ? r.specs : Object.entries(r.product.specs).filter(([, value]) => typeof value === "string").slice(0, 5).map(([label, value]) => ({ label, value }))).map((spec) => (
                        <li key={spec.label}>
                          <span>{spec.label}</span>
                          <span>{spec.value}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pr">
                      <b>{money(r.product.price)}</b>
                      {r.product.was !== null ? <em>{money(r.product.was)}</em> : null}
                    </div>
                    <Link className="pick" href={href.product(r.product.slug)}>
                      {r.ctaLabel}
                    </Link>
                  </article>
                ))}
              </div>
              <div className="cat-chips" style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--c-line)" }}>
                {chips.map((chip) => (
                  <Link key={chip.slug} className="cat-chip" href={href.category({ sub: chip.title })}>
                    {chip.title}
                  </Link>
                ))}
                <Link className="cat-chip on" href={href.category({ sub: "Gaming PCs" })}>
                  Explore gaming <Icon id="i-arr" w={12} h={12} />
                </Link>
              </div>
            </div>
          </section>
        );
      }

      case "LAPTOP_SHOWCASE": {
        const cards = configCards(section, LAPTOP_CARDS.map((card) => ({ ...card, href: { sub: card.sub } })));
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="head">
                <div>
                  <h2>{heading}</h2>
                  {body ? <p>{body}</p> : null}
                </div>
                <Link href={href.category({ cat: "Laptops" })}>
                  All laptops <Icon id="i-arr" w={15} />
                </Link>
              </div>
              <div className="laprow three">
                {cards.map((c) => (
                  <Link className="lapcard" href={href.category(c.href)} key={c.key}>
                    <h3>{c.title}</h3>
                    <p>{c.copy}</p>
                    <span>
                      {findCategory(categoriesRes.data?.items ?? [], c.href.sub)?.productCount ?? 0} products <Icon id="i-arr" w={12} h={12} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "BUYING_GUIDES": {
        const guides = (Array.isArray(section.config.guides) ? section.config.guides : []).flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const guide = item as Record<string, unknown>;
          if (typeof guide.pageSlug !== "string" || typeof guide.title !== "string") return [];
          return [{ title: guide.title, tag: typeof guide.tag === "string" ? guide.tag : "Buying guide", href: `/pages/${encodeURIComponent(guide.pageSlug)}` }];
        });
        if (!guides.length) return null;
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="head">
                <div>
                  <h2>{heading}</h2>
                  {body ? <p>{body}</p> : null}
                </div>
              </div>
              <div className="guidegrid">
                {guides.map((g) => (
                  <Link className="guidecard" href={g.href!} key={g.title}>
                    <span className="tg">{g.tag}</span>
                    <h3>{g.title}</h3>
                    <em>
                      Read guide <Icon id="i-arr" w={12} h={12} />
                    </em>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      }

      // Admin > Homepage (heading/text), items seeded in config: ctaLabel + categorySlug.
      case "BUSINESS_BANNER": {
        const ctaLabel = typeof section.config.ctaLabel === "string" ? section.config.ctaLabel : "";
        const categorySlug = typeof section.config.categorySlug === "string" ? section.config.categorySlug : "";
        if (!heading || !categorySlug) return null;
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="bizsplit single">
                <Link className="bx biz" href={href.category({ sub: categorySlug })}>
                  <h3>{heading}</h3>
                  {body ? <p>{body}</p> : null}
                  {ctaLabel ? (
                    <span className="btn">
                      {ctaLabel} <Icon id="i-arr" w={16} />
                    </span>
                  ) : null}
                </Link>
              </div>
            </div>
          </section>
        );
      }

      // Two columns of category chips (config.columns, seeded); chips for unknown categories are skipped.
      case "CATEGORY_SPLIT": {
        const categories = categoriesRes.data?.items ?? [];
        const columns = (Array.isArray(section.config.columns) ? section.config.columns : []).flatMap((column) => {
          if (!column || typeof column !== "object") return [];
          const c = column as Record<string, unknown>;
          const text = (key: string) => (typeof c[key] === "string" ? (c[key] as string) : "");
          const chips = (Array.isArray(c.chips) ? c.chips : []).flatMap((slug) => {
            const category = typeof slug === "string" ? findCategory(categories, slug) : null;
            return category ? [{ slug: category.slug, title: category.title }] : [];
          });
          return text("heading") ? [{ heading: text("heading"), text: text("text"), linkLabel: text("linkLabel"), categorySlug: text("categorySlug"), chips }] : [];
        });
        if (!columns.length) return null;
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="minisplit">
                {columns.map((column) => (
                  <div key={column.heading}>
                    <h3>{column.heading}</h3>
                    {column.text ? <p>{column.text}</p> : null}
                    {column.chips.length ? (
                      <div className="cat-chips">
                        {column.chips.map((chip) => (
                          <Link key={chip.slug} className="cat-chip" href={href.category({ sub: chip.slug })}>
                            {chip.title}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    {column.linkLabel && column.categorySlug ? (
                      <Link className="lk" href={href.category({ cat: column.categorySlug })}>
                        {column.linkLabel} <Icon id="i-arr" w={15} />
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "SEO_INTRO":
        return (
          <section style={{ paddingTop: 6 }} key={section.id}>
            <div className="wrap">
              <div className="seo-split">
                <div className="seo">
                  <h2>{heading}</h2>
                  {(body ?? "").split(/\n\s*\n/).filter((para) => para.trim()).map((para, i) => (
                    <p key={i}>{para.trim()}</p>
                  ))}
                </div>
                <SpecialOfferCard initialProducts={initialData.offer} />
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

      <Footer />
    </>
  );
}
