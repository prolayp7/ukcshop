import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import BrandPage from "@/designs/highstreet/BrandPage";
import { fetchBrandBySlug, fetchBrands, fetchProducts } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 86400;
export function generateStaticParams() { return []; }

const loadBrand = cache((slug: string) => fetchBrandBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await loadBrand(slug);
  if (!brand) return { title: "Brand not found" };
  const description = brand.description || brand.shortDescription || undefined;
  return {
    title: brand.title,
    ...(description ? { description } : {}),
    alternates: { canonical: `/brand/${encodeURIComponent(slug)}` },
    openGraph: { type: "website", title: brand.title, ...(description ? { description } : {}), ...(brand.logo ? { images: [brand.logo] } : {}) },
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
  return <BrandPage slug={slug} initialData={{ brand, items, deals: deals?.items ?? [], newest: newest?.items ?? [], brands, recommended: recommended?.items ?? [] }} />;
}
