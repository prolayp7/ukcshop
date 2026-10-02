import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import ProductPage from "@/designs/highstreet/ProductPage";
import { fetchCompatibleProducts, fetchProductBySlug, fetchProducts, fetchReviews } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 86400;
export function generateStaticParams() { return []; }

const loadProduct = cache((slug: string) => fetchProductBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await loadProduct(id);
  if (!result) return { title: "Product not found" };
  const { product, api } = result;
  const description = api.shortDescription || api.description || undefined;
  return {
    title: product.name,
    ...(description ? { description } : {}),
    alternates: { canonical: `/product/${encodeURIComponent(product.slug)}` },
    openGraph: {
      type: "website",
      title: product.name,
      ...(description ? { description } : {}),
      ...(product.image ? { images: [product.image] } : {}),
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const initialProduct = await loadProduct(id);
  if (!initialProduct) notFound();

  const category = initialProduct.api.category.slug;
  const [related, compatible, recommended, reviews] = await Promise.all([
    fetchProducts({ category, perPage: 9 }).catch(() => null),
    fetchCompatibleProducts(id, category, 4).catch(() => []),
    fetchProducts({ sort: "newest", perPage: 9 }).catch(() => null),
    fetchReviews(initialProduct.product.id, 1, 6).catch(() => null),
  ]);

  return (
    <ProductPage
      slug={id}
      initialProduct={initialProduct}
      initialRelated={related?.items ?? []}
      initialCompatible={compatible}
      initialRecommended={recommended?.items ?? []}
      initialReviews={reviews}
    />
  );
}
