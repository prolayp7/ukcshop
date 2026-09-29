import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { findCategory } from "@/lib/category";
import { CATEGORY_ROOT } from "@/lib/category-paths";
import { CategoryView, canonicalPathFor, carriedQuery, categoryMetadata, loadTree, single, type SearchParams } from "./category-view";

// All products and search results. Legacy links (?cat=Title, ?sub=Title, ?deals=1) - still stored in
// admin content and bookmarks - redirect permanently to the canonical /category/<slugs> and /deals URLs.
type Props = { searchParams: Promise<SearchParams> };

async function redirectLegacy(query: SearchParams) {
  const name = single(query.sub) || single(query.cat);
  if (name) {
    const category = findCategory(await loadTree(), name);
    if (!category) notFound();
    permanentRedirect(`${await canonicalPathFor(category)}${carriedQuery(query, ["cat", "sub"])}`);
  }
  if (single(query.deals) === "1") permanentRedirect(`/deals${carriedQuery(query, ["deals"])}`);
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams;
  await redirectLegacy(query);
  return categoryMetadata({ category: null, query, canonical: CATEGORY_ROOT });
}

export default async function Page({ searchParams }: Props) {
  const query = await searchParams;
  await redirectLegacy(query);
  return <CategoryView category={null} query={query} canonical={CATEGORY_ROOT} />;
}
