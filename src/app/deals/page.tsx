import type { Metadata } from "next";
import { CategoryView, categoryMetadata } from "../category/category-view";

// Every product currently on sale; replaces /category?deals=1 (which redirects here).
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return categoryMetadata({ category: null, query: {}, canonical: "/deals", deals: true });
}

export default function Page() {
  return <CategoryView category={null} query={{}} canonical="/deals" deals />;
}
