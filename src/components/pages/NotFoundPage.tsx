"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Cpu, Headphones, Home, PackageSearch, Search, Shapes } from "lucide-react";
import { useApi } from "@/lib/use-api";
import type { ApiCategory } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useHref } from "@/lib/design-context";
import { money } from "@/lib/catalogue";
import Header from "@/designs/highstreet/Header";
import Footer from "@/designs/highstreet/Footer";
import styles from "./not-found-page.module.css";

const suggestedSearches = ["Graphics cards", "DDR5 memory", "Gaming laptops", "NVMe SSDs", "Power supplies", "Monitors"];

export default function NotFoundPage() {
  const href = useHref();
  const categoriesRes = useApi<{ items: ApiCategory[] }>("/api/categories");
  const productsRes = useApi<{ items: Product[] }>("/api/products?perPage=4");
  const categories = (categoriesRes.data?.items ?? []).slice(0, 4);
  const products = productsRes.data?.items ?? [];

  return <>
    <Header />
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="missing-page-title">
        <div className={styles.diagnostic} aria-hidden="true">
          <svg viewBox="0 0 180 80" fill="none">
            <path d="M25 65 90 14l65 51M45 49l45-35 45 35" stroke="currentColor" strokeWidth="2" opacity=".55" />
            <circle cx="90" cy="14" r="5" fill="currentColor" />
            <path d="m86 41 8 6-7 6 6 5-7 10" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
          <span>DIAGNOSTIC:<br />PAGE_NOT_FOUND</span>
        </div>
        <p className={styles.code}>ERROR CODE: 404 · PAGE UNAVAILABLE</p>
        <h1 id="missing-page-title">Looks like this page is missing from the build.</h1>
        <p className={styles.intro}>The product, specification, or guide you were looking for may have moved. Try a search or head back to the catalogue.</p>
        <div className={styles.searches}><span>POPULAR SEARCHES</span>{suggestedSearches.map((term) => <Link key={term} href={href.category({ q: term })}>{term}</Link>)}</div>
        <div className={styles.actions}>
          <Link className={styles.primary} href={href.home()}><Home size={17} /> Return to storefront</Link>
          <Link className={styles.secondary} href={href.category()}><Shapes size={17} /> Browse categories</Link>
          <Link className={styles.tertiary} href="/faqs"><Headphones size={17} /> Help centre</Link>
        </div>
      </section>

      {categories.length > 0 && <section className={styles.section} aria-labelledby="category-heading">
        <div className={styles.sectionHeading}><div><span>CATALOGUE DIRECTORY</span><h2 id="category-heading">Popular categories</h2></div><p>Pick up where you left off.</p></div>
        <div className={styles.categoryGrid}>{categories.map((category) => <Link className={styles.categoryCard} key={category.slug} href={href.category({ cat: category.title })}>
          <div className={styles.categoryTop}><Cpu size={23} /><span>{category.productCount.toLocaleString()} products</span></div>
          <h3>{category.title}</h3><p>{category.description || `Browse ${category.title.toLowerCase()} and find the right specification for your setup.`}</p>
          <strong>Explore category <ArrowRight size={15} /></strong>
        </Link>)}</div>
      </section>}

      {products.length > 0 && <section className={styles.section} aria-labelledby="product-heading">
        <div className={styles.sectionHeading}><div><span>BACK TO THE CATALOGUE</span><h2 id="product-heading">Products to explore</h2></div><Link href={href.category()}>View all products <ArrowRight size={15} /></Link></div>
        <div className={styles.productGrid}>{products.map((product) => <Link className={styles.productCard} key={product.id} href={href.product(product.slug)}>
          <div className={styles.productImage}>{product.image ? <Image src={product.image} alt="" width={280} height={160} unoptimized /> : <PackageSearch size={42} />}</div>
          <h3>{product.name}</h3><strong>{money(product.price)}</strong><span>View product <ArrowRight size={14} /></span>
        </Link>)}</div>
      </section>}
      {!categoriesRes.loading && !productsRes.loading && !categories.length && !products.length && <div className={styles.fallback}><Search size={20} /><p>The catalogue is temporarily unavailable. You can still return to the storefront or try a search above.</p></div>}
    </div>
    <Footer />
  </>;
}
