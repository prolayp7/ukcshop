export interface DesignMeta {
  /** Numbering that maps to /styles/{id}.css - the file this repo actually
   * ships is 01.css, ported unrenamed from the static prototypes. */
  id: string;
  /** Route segment this design lives under, e.g. /highstreet/... . */
  slug: string;
  name: string;
  tagline: string;
  extendedPagesRolledOut: boolean;
  fontHref: string;
}

// Registry ported from ukshop-store/src/lib/designs.ts, trimmed to the one
// live design and renamed 01-highstreet -> highstreet: the "01-" numbering
// only earns its keep when comparing multiple design directions side by
// side (ukshop-store/sdshop-store ship 7), and is just noise for a site
// that only ever renders one. If a second design goes live here later, add
// it as its own DESIGN_IMPLS/DESIGNS entry rather than reintroducing the
// numbering scheme.
export const DESIGNS: DesignMeta[] = [
  {
    id: "01",
    slug: "highstreet",
    name: "Highstreet",
    tagline: "Mainstream UK e-tail, widest appeal",
    extendedPagesRolledOut: true,
    fontHref: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },
];

export function designBySlug(slug: string): DesignMeta | undefined {
  return DESIGNS.find((d) => d.slug === slug);
}
export function isDesignSlug(slug: string): boolean {
  return DESIGNS.some((d) => d.slug === slug);
}

export const HIGHSTREET_DESIGN: DesignMeta = DESIGNS[0];

/**
 * The design this build renders, picked at build time via THEME. Falls
 * back to the first registered design for an unset or unknown value -
 * there's only ever one deployed design per client build.
 */
export function getActiveDesign(): DesignMeta {
  return designBySlug(process.env.THEME ?? "") ?? DESIGNS[0];
}
