import type { ApiCategory } from "./api";

/** Category page URLs are nested slug paths: /category/pc-components/graphics-cards. */
export const CATEGORY_ROOT = "/category";

/** Lower-cased title or slug -> canonical path. Lets callers that only know a category's title
 * (hardcoded homepage/footer links, admin content) link straight to the canonical URL. */
export type CategoryPaths = Record<string, string>;

export function buildCategoryPaths(tree: ApiCategory[]): CategoryPaths {
  const paths: CategoryPaths = {};
  const walk = (nodes: ApiCategory[], prefix: string) => {
    for (const category of nodes) {
      const path = `${prefix}/${category.slug}`;
      // First match wins if two categories share a title (or, in different branches, a slug).
      paths[category.slug.toLowerCase()] ??= path;
      paths[category.title.toLowerCase()] ??= path;
      walk(category.children ?? [], path);
    }
  };
  walk(tree, CATEGORY_ROOT);
  return paths;
}

/** Resolves /category/<a>/<b> segment by segment, so the same slug under two parents never collides. */
export function findCategoryByPath(tree: ApiCategory[], slugs: string[]): { category: ApiCategory; parent: ApiCategory | null } | null {
  let nodes = tree;
  let parent: ApiCategory | null = null;
  let category: ApiCategory | null = null;
  for (const slug of slugs) {
    const next = nodes.find((node) => node.slug === slug.toLowerCase());
    if (!next) return null;
    parent = category;
    category = next;
    nodes = next.children ?? [];
  }
  return category ? { category, parent } : null;
}

/** Rewrites a stored legacy category link (/category?cat=Title, ?sub=, ?deals=1) to its canonical URL, so
 * admin-entered links skip the redirect hop. Anything else passes through unchanged. */
export function canonicalCategoryHref(href: string, paths: CategoryPaths): string {
  if (!href.startsWith(`${CATEGORY_ROOT}?`)) return href;
  const params = new URLSearchParams(href.slice(CATEGORY_ROOT.length + 1));
  const withRest = (path: string) => { const rest = params.toString(); return rest ? `${path}?${rest}` : path; };
  const name = params.get("sub") || params.get("cat");
  if (name) {
    const path = paths[name.toLowerCase()];
    if (!path) return href;
    params.delete("cat"); params.delete("sub");
    return withRest(path);
  }
  if (params.get("deals") === "1") { params.delete("deals"); return withRest("/deals"); }
  return href;
}
