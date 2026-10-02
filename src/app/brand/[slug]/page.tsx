import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import BrandPage from "@/designs/highstreet/BrandPage";
import { fetchBrandBySlug, fetchBrands, fetchProducts } from "@/lib/api";
import { plainText } from "@/lib/category";
import { siteOrigin } from "@/app/category/category-view";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 86400;
export function generateStaticParams() { return []; }

const loadBrand = cache((slug: string) => fetchBrandBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await loadBrand(slug);
  if (!brand) return { title: "Brand not found" };
  const title = brand.metaTitle?.trim() || brand.title;
  const description = brand.metaDescription?.trim() || plainText(brand.shortDescription || brand.description) || undefined;
  const canonical = `/brand/${encodeURIComponent(brand.slug)}`;
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      ...(description ? { description } : {}),
      url: canonical,
      ...(brand.logo ? { images: [{ url: brand.logo, alt: brand.logoAlt || brand.title }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      ...(description ? { description } : {}),
      ...(brand.logo ? { images: [brand.logo] } : {}),
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const brand = await loadBrand(slug);
  if (!brand) notFound();
  const [items, deals, newest, brands, recommended] = await Promise.all([
    fetchProducts({ brand: slug, perPage: 12 }).catch(() => null),
    fetchProducts({ brand: slug, onSale: true, perPage: 8 }).catch(() => null),
    fetchProducts({ brand: slug, sort: "newest", perPage: 4 }).catch(() => null),
    fetchBrands().catch(() => []),
    fetchProducts({ sort: "newest", perPage: 4 }).catch(() => null),
  ]);
  const origin = await siteOrigin();
  const canonical = new URL(`/brand/${encodeURIComponent(brand.slug)}`, origin).href;
  const title = brand.metaTitle?.trim() || brand.title;
  const description = brand.metaDescription?.trim() || plainText(brand.shortDescription || brand.description) || undefined;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: canonical,
      ...(description ? { description } : {}),
      about: {
        "@type": "Brand",
        name: brand.title,
        ...(brand.logo ? { logo: new URL(brand.logo, origin).href } : {}),
      },
      ...(items ? {
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.meta.total,
          itemListElement: items.items.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.name,
            url: new URL(`/product/${encodeURIComponent(product.slug)}`, origin).href,
          })),
        },
      } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: new URL("/", origin).href },
        { "@type": "ListItem", position: 2, name: "Brands", item: new URL("/brands", origin).href },
        { "@type": "ListItem", position: 3, name: brand.title, item: canonical },
      ],
    },
  ];
  return <>
    {structuredData.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}
    <BrandPage slug={slug} initialData={{ brand, items, deals: deals?.items ?? [], newest: newest?.items ?? [], brands, recommended: recommended?.items ?? [] }} />
  </>;
}
