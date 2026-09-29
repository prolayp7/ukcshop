"use client";

import { createContext, useContext, useMemo } from "react";
import { makeHref, Href } from "./urls";
import type { CategoryPaths } from "./category-paths";

const SlugContext = createContext<string | null>(null);
// Category title/slug -> canonical path, loaded server-side in the root layout so links render correctly in the first HTML.
const CategoryPathsContext = createContext<CategoryPaths>({});

export function DesignSlugProvider({ slug, categoryPaths = {}, children }: { slug: string; categoryPaths?: CategoryPaths; children: React.ReactNode }) {
  return <SlugContext.Provider value={slug}><CategoryPathsContext.Provider value={categoryPaths}>{children}</CategoryPathsContext.Provider></SlugContext.Provider>;
}

export function useDesignSlug(): string {
  const slug = useContext(SlugContext);
  if (slug === null) throw new Error("useDesignSlug() called outside the storefront layout");
  return slug;
}

/** The common case — a component just wants to build a link. */
export function useHref(): Href {
  const slug = useDesignSlug();
  const categoryPaths = useContext(CategoryPathsContext);
  return useMemo(() => makeHref(slug, categoryPaths), [slug, categoryPaths]);
}
