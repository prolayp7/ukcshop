import type { ApiCategory } from "./api";

export function findCategory(tree: ApiCategory[], name: string): ApiCategory | null {
  for (const category of tree) {
    if (category.slug === name || category.title.toLowerCase() === name.toLowerCase()) return category;
    const child = findCategory(category.children, name);
    if (child) return child;
  }
  return null;
}

export function plainText(value?: string | null): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
