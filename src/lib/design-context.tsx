"use client";

import { createContext, useContext, useMemo } from "react";
import { makeHref, Href } from "./urls";

const SlugContext = createContext<string | null>(null);

export function DesignSlugProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <SlugContext.Provider value={slug}>{children}</SlugContext.Provider>;
}

export function useDesignSlug(): string {
  const slug = useContext(SlugContext);
  if (slug === null) throw new Error("useDesignSlug() called outside the storefront layout");
  return slug;
}

/** The common case — a component just wants to build a link. */
export function useHref(): Href {
  const slug = useDesignSlug();
  return useMemo(() => makeHref(slug), [slug]);
}
