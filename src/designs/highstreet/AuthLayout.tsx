"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Heart, Home, Package, Search, ShieldCheck, ShoppingCart, Star, Truck, Undo2, type LucideIcon } from "lucide-react";
import { useHref } from "@/lib/design-context";
import { useApi } from "@/lib/use-api";
import { money } from "@/lib/catalogue";
import type { Product } from "@/lib/types";
import type { RegisterPageContent } from "@/lib/api";
import { AddToBasketButton } from "@/components/interactive";
import Header from "./Header";
import Footer from "./Footer";
import styles from "./auth.module.css";

// Icon names the admin can pick for the registration benefits row (REGISTER_PAGE_ICONS in the API).
const BENEFIT_ICONS: Record<string, LucideIcon> = { package: Package, heart: Heart, search: Search, truck: Truck, shield: ShieldCheck, cpu: Cpu, star: Star, undo: Undo2 };
const SIGN_IN_BENEFITS = [
  { icon: "package", title: "Your orders", text: "All in one place" },
  { icon: "heart", title: "Your wishlist", text: "Save your favourites" },
  { icon: "search", title: "Find your parts", text: "Search by specification" },
];
const SIGN_IN_SHOWCASE = { title: "Your next upgrade starts here", description: "Explore PC components, laptops and peripherals for work, play and everything in between." };

export default function AuthLayout({ children, registration = false, pageTitle, content }: { children: ReactNode; registration?: boolean; pageTitle?: string; content?: RegisterPageContent | null }) {
  const href = useHref();
  // Registration sections are admin-managed and hidden when switched off or when the settings are unavailable.
  const benefits = registration ? (content?.benefits.enabled ? content.benefits.items : []) : SIGN_IN_BENEFITS;
  const showcase = registration ? (content?.showcase.enabled ? content.showcase : null) : SIGN_IN_SHOWCASE;
  return <>
    <Header />
    <div className={styles.page}>
      <div className={styles.breadcrumb}><nav className="wrap" aria-label="Breadcrumb">
        <Link href={href.home()} aria-label="Home"><Home size={16} /></Link><span aria-hidden="true">/</span>
        <span aria-current="page">{pageTitle ?? (registration ? "Create account" : "Sign in")}</span>
      </nav></div>
      <div className={`wrap ${styles.layout} ${showcase ? "" : styles.single}`}>
        <div>
          <section className={styles.panel} aria-labelledby="auth-heading">{children}</section>
          {benefits.length > 0 && <div className={styles.benefits}>
            {benefits.map((benefit, index) => { const Icon = BENEFIT_ICONS[benefit.icon] ?? Package; return <div key={index}><Icon size={20} /><strong>{benefit.title}</strong>{benefit.text && <span>{benefit.text}</span>}</div>; })}
          </div>}
        </div>
        {showcase && <AuthShowcase title={showcase.title} description={showcase.description} />}
      </div>
    </div>
    <Footer />
  </>;
}

function AuthShowcase({ title, description }: { title: string; description: string }) {
  const href = useHref();
  const { data, loading, error } = useApi<{ items: Product[] }>("/api/products/recommended?limit=4");
  const products = data?.items ?? [];
  return <aside className={styles.showcase} aria-label="Explore computer products">
    <header className={styles.showcaseHeader}>
      <h2><Cpu size={25} />{title}</h2>
      {description && <p>{description}</p>}
      <nav aria-label="Explore product categories">
        {["PC Components", "Laptops", "Peripherals", "Networking"].map(cat => <Link key={cat} href={href.category({ cat })}>{cat}</Link>)}
      </nav>
    </header>
    <div className={styles.showcaseTitle}><h3>Recommended products</h3><Link href={href.category()}>Shop all <ArrowRight size={14} /></Link></div>
    {loading ? <p className={styles.empty} role="status">Loading recommendations…</p> : products.length ? <div className={styles.products}>
      {products.map(product => <article key={product.id} className={styles.product}>
        <Link href={href.product(product.slug)} className={styles.productImage} aria-label={product.name}>
          <ProductThumbnail key={product.image} image={product.image} />
        </Link>
        <div className={styles.productInfo}>
          <small>{product.brand} · {product.sku}</small>
          <h3><Link href={href.product(product.slug)}>{product.name}</Link></h3>
          {product.reviews > 0 && <p className={styles.rating}><Star size={13} fill="currentColor" />{product.rating.toFixed(1)} <span>({product.reviews} reviews)</span></p>}
          <dl>{Object.entries(product.specs).slice(0, 3).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <div className={styles.productPrice}><strong>{money(product.price)}</strong>{product.was && product.was > product.price ? <s>{money(product.was)}</s> : null}</div>
          <p className={styles.stock}>{product.stockStatus === "out" ? "Out of stock" : product.stockStatus === "low" ? "Low stock" : "In stock"}</p>
          <AddToBasketButton product={product} disabled={product.stockStatus === "out"} className={styles.basket} aria-label={`Add ${product.name} to basket`}><ShoppingCart size={15} />Add to basket</AddToBasketButton>
        </div>
      </article>)}
    </div> : <div className={styles.empty}><p>{error ? "Recommendations are unavailable right now." : "Explore the catalogue to find your next upgrade."}</p><Link href={href.category()}>Browse all products <ArrowRight size={15} /></Link></div>}
    <div className={styles.memberNote}><Heart size={25} /><div><h3>A shortlist for your next setup</h3><p>Save the products you’re considering to your wishlist, compare specifications and come back when you’re ready.</p><Link href={href.category({ deals: 1 })}>Explore deals &amp; offers <ArrowRight size={15} /></Link></div></div>
    <div className={styles.service}><span><Cpu size={17} />Components &amp; complete PCs</span><span><Search size={17} />Search by SKU or part number</span></div>
  </aside>;
}

function ProductThumbnail({ image }: { image?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return <span className={styles.imageFallback}><Package size={38} strokeWidth={1.25} /><span>Image unavailable</span></span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
