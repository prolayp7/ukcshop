"use client";

import { createContext, useContext, useMemo } from "react";
import { makeHref, Href } from "./urls";
import type { CategoryPaths } from "./category-paths";
import type { ApiCategory, ApiGeneralSettings, FooterColumn, FooterContent, HeaderNavItem } from "./api";

const SlugContext = createContext<string | null>(null);
// Category title/slug -> canonical path, loaded server-side in the root layout so links render correctly in the first HTML.
const CategoryPathsContext = createContext<CategoryPaths>({});
const StorefrontChromeContext = createContext<{ nav: HeaderNavItem[] | null; categories: ApiCategory[]; settings: ApiGeneralSettings; footerMenu: FooterColumn[]; footerContent: FooterContent | null }>({ nav: null, categories: [], settings: {}, footerMenu: [], footerContent: null });

export function DesignSlugProvider({ slug, categoryPaths = {}, headerNav = null, categories = [], settings = {}, footerMenu = [], footerContent = null, children }: { slug: string; categoryPaths?: CategoryPaths; headerNav?: HeaderNavItem[] | null; categories?: ApiCategory[]; settings?: ApiGeneralSettings; footerMenu?: FooterColumn[]; footerContent?: FooterContent | null; children: React.ReactNode }) {
  return <SlugContext.Provider value={slug}><CategoryPathsContext.Provider value={categoryPaths}><StorefrontChromeContext.Provider value={{ nav: headerNav, categories, settings, footerMenu, footerContent }}>{children}</StorefrontChromeContext.Provider></CategoryPathsContext.Provider></SlugContext.Provider>;
}

export function useInitialStorefrontChrome() {
  return useContext(StorefrontChromeContext);
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
