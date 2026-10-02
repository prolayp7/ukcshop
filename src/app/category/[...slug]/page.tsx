import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { findCategoryByPath } from "@/lib/category-paths";
import { findCategory } from "@/lib/category";
import { CategoryView, canonicalPathFor, categoryMetadata, loadCategoryDetail, loadTree } from "../category-view";

// Canonical category pages: /category/pc-components, /category/pc-components/graphics-cards.
export const revalidate = 86400;
export function generateStaticParams() { return []; }

type Props = { params: Promise<{ slug: string[] }> };

const resolve = cache(async (slugs: string[]) => {
  const tree = await loadTree();
  const match = findCategoryByPath(tree, slugs);
  if (!match) {
    // A known category reached by the wrong path (e.g. /category/graphics-cards, or after it moved to another parent).
    const moved = findCategory(tree, slugs[slugs.length - 1]);
    if (moved) permanentRedirect(await canonicalPathFor(moved));
    notFound();
  }
  return { category: await loadCategoryDetail(match.category), parent: match.parent, canonical: await canonicalPathFor(match.category) };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { category, canonical } = await resolve(slug);
  return categoryMetadata({ category, query: {}, canonical });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { category, parent, canonical } = await resolve(slug);
  return <CategoryView category={category} parent={parent} query={{}} canonical={canonical} />;
}
