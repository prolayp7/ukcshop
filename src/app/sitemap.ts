import type { MetadataRoute } from "next";
import { fetchProducts, type ApiCategory } from "@/lib/api";
import { buildCategoryPaths } from "@/lib/category-paths";
import { loadTree, siteOrigin } from "./category/category-view";

// Regenerated at most hourly; lists the pages search engines should index, at their canonical URLs.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const url = (path: string) => new URL(path, origin).href;
  const tree = await loadTree().catch(() => [] as ApiCategory[]);
  const paths = buildCategoryPaths(tree);

  const categories: MetadataRoute.Sitemap = [];
  const walk = (nodes: ApiCategory[]) => nodes.forEach((category) => {
    if (category.isIndexable !== false) categories.push({ url: url(paths[category.slug.toLowerCase()]), changeFrequency: "daily", priority: 0.8 });
    walk(category.children ?? []);
  });
  walk(tree);

  // The API caps pages at 100 products.
  const products: MetadataRoute.Sitemap = [];
  for (let page = 1; ; page++) {
    const result = await fetchProducts({ page, perPage: 100 }).catch(() => null);
    if (!result) break;
    products.push(...result.items.map((product) => ({ url: url(`/product/${encodeURIComponent(product.slug)}`), changeFrequency: "weekly" as const, priority: 0.6 })));
    if (page >= result.meta.totalPages) break;
  }

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/category"), changeFrequency: "daily", priority: 0.7 },
    { url: url("/deals"), changeFrequency: "daily", priority: 0.7 },
    { url: url("/brands"), changeFrequency: "weekly", priority: 0.5 },
    ...categories,
    ...products,
  ];
}
