import { Product, BrandSummary, Crumb } from "./types";

export interface SectionProps {
  title: string;
  sub?: string | null;
  items: Product[];
  link?: { href: string; label: string };
}

/** The contract every design's chrome/card set implements — mirrors the
 * static prototypes' `DesignX.parts` object exactly, just as components
 * instead of string-returning functions. Shared page templates (category,
 * product, basket, checkout, account, brand, brands) render against this
 * contract so one template serves all seven designs. */
export interface DesignParts {
  Header: React.ComponentType;
  Footer: React.ComponentType;
  Crumbs: React.ComponentType<{ items: Crumb[] }>;
  ProductCard: React.ComponentType<{ product: Product }>;
  BrandCard: React.ComponentType<{ brand: BrandSummary }>;
  Section: React.ComponentType<SectionProps>;
}
