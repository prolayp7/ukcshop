import type { Metadata } from "next";
import { CategoryView, categoryMetadata, type SearchParams } from "../category/category-view";

// Every product currently on sale; replaces /category?deals=1 (which redirects here).
type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return categoryMetadata({ category: null, query: await searchParams, canonical: "/deals", deals: true });
}

export default async function Page({ searchParams }: Props) {
  return <CategoryView category={null} query={await searchParams} canonical="/deals" deals />;
}
