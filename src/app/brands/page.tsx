import type { Metadata } from "next";
import BrandsPage from "@/designs/highstreet/BrandsPage";
import { fetchBrands, fetchProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Shop All Brands",
  description: "Browse computer hardware and technology brands available from UK Computer Shop.",
};

export default async function Page() {
  const [brands, recommended] = await Promise.all([
    fetchBrands().catch(() => []),
    fetchProducts({ sort: "newest", perPage: 4 }).catch(() => null),
  ]);
  return <BrandsPage initialBrands={brands} initialRecommended={recommended?.items ?? []} />;
}
