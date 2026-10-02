import { Suspense } from "react";
import type { Metadata } from "next";
import Home from "@/designs/highstreet/Home";
import {
  fetchBrands,
  fetchCategoryTree,
  fetchFaqs,
  fetchGeneralSettings,
  fetchHome,
  fetchProducts,
  fetchReviewSummary,
  fetchTestimonials,
  type ApiGeneralSettings,
} from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchGeneralSettings().catch(() => ({}) as ApiGeneralSettings);
  const ogTitle = settings.ogTitle || settings.metaTitle;
  const ogDescription = settings.ogDescription || settings.metaDescription;
  const twitterTitle = settings.twitterTitle || ogTitle;
  const twitterDescription = settings.twitterDescription || ogDescription;
  return {
    // Omitting a key (rather than setting it to `undefined`) is required for
    // Next's metadata merge to fall through to the root layout's default -
    // an explicit `undefined` value is still treated as "provided" and wipes
    // the inherited value instead of inheriting it.
    ...(settings.metaTitle ? { title: settings.metaTitle } : {}),
    openGraph: {
      ...(ogTitle ? { title: ogTitle } : {}),
      ...(ogDescription ? { description: ogDescription } : {}),
      ...(settings.ogImage ? { images: [settings.ogImage] } : {}),
    },
    twitter: {
      ...(settings.twitterCard ? { card: settings.twitterCard as "summary" | "summary_large_image" } : {}),
      ...(settings.twitterSite ? { site: settings.twitterSite } : {}),
      ...(settings.twitterCreator ? { creator: settings.twitterCreator } : {}),
      ...(twitterTitle ? { title: twitterTitle } : {}),
      ...(twitterDescription ? { description: twitterDescription } : {}),
      ...(settings.twitterImage ? { images: [settings.twitterImage] } : {}),
    },
  };
}

export default async function Page() {
  const [settings, brands, home, deals, offer, testimonials, faqs, reviewSummary, arrivals, categories] = await Promise.all([
    fetchGeneralSettings().catch(() => ({}) as ApiGeneralSettings),
    fetchBrands().catch(() => null),
    fetchHome().catch(() => null),
    fetchProducts({ onSale: true, perPage: 8 }).catch(() => null),
    fetchProducts({ onSale: true, sort: "discount_desc", perPage: 1 }).catch(() => null),
    fetchTestimonials().catch(() => null),
    fetchFaqs().catch(() => null),
    fetchReviewSummary().catch(() => null),
    fetchProducts({ sort: "newest", perPage: 8 }).catch(() => null),
    fetchCategoryTree().catch(() => null),
  ]);
  return (
    <Suspense>
      <Home initialData={{
        brands: brands ?? [],
        home,
        deals: deals?.items ?? [],
        offer: offer?.items ?? [],
        testimonials: testimonials ?? [],
        faqs: faqs ?? [],
        reviewSummary,
        arrivals: arrivals?.items ?? [],
        categories: categories ?? [],
      }} />
      {settings.schemaJsonLd ? <script type="application/ld+json">{settings.schemaJsonLd}</script> : null}
    </Suspense>
  );
}
