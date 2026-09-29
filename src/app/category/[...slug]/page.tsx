import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { findCategoryByPath } from "@/lib/category-paths";
import { findCategory } from "@/lib/category";
import { CategoryView, canonicalPathFor, carriedQuery, categoryMetadata, loadCategoryDetail, loadTree, type SearchParams } from "../category-view";

// Canonical category pages: /category/pc-components, /category/pc-components/graphics-cards.
type Props = { params: Promise<{ slug: string[] }>; searchParams: Promise<SearchParams> };

const resolve = cache(async (slugs: string[], query: SearchParams) => {
  const tree = await loadTree();
  const match = findCategoryByPath(tree, slugs);
  if (!match) {
    // A known category reached by the wrong path (e.g. /category/graphics-cards, or after it moved to another parent).
    const moved = findCategory(tree, slugs[slugs.length - 1]);
    if (moved) permanentRedirect(`${await canonicalPathFor(moved)}${carriedQuery(query, [])}`);
    notFound();
  }
  return { category: await loadCategoryDetail(match.category), parent: match.parent, canonical: await canonicalPathFor(match.category) };
});

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { category, canonical } = await resolve(slug, query);
  return categoryMetadata({ category, query, canonical });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { category, parent, canonical } = await resolve(slug, query);
  return <CategoryView category={category} parent={parent} query={query} canonical={canonical} />;
}
