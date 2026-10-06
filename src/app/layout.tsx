import type { Metadata } from "next";
import type { ReactNode } from "react";
import Sprite from "@/components/Sprite";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import StoreToaster from "@/components/StoreToaster";
import BackToTop from "@/components/BackToTop";
import CookieBanner from "@/components/CookieBanner";
import CompareBar from "@/components/CompareBar";
import { CartDrawerProvider } from "@/components/CartDrawer";
import { DesignSlugProvider } from "@/lib/design-context";
import { getActiveDesign } from "@/lib/designs";
import { theme } from "@/lib/theme.config";
import { fetchCategoryTree, fetchFooterContent, fetchFooterMenu, fetchGeneralSettings, fetchHeaderNav, type ApiGeneralSettings } from "@/lib/api";
import { buildCategoryPaths } from "@/lib/category-paths";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import "./globals.css";
import "@/components/pages/category.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchGeneralSettings().catch(() => ({}) as ApiGeneralSettings);
  return {
    // Resolves the same-origin /uploads/* image URLs in social-share tags; set SITE_URL in production.
    ...(process.env.SITE_URL ? { metadataBase: new URL(process.env.SITE_URL) } : {}),
    title: {
      default: theme.brand.name,
      template: `%s | ${theme.brand.name}`,
    },
    description: settings.metaDescription || "Find computer components, systems, laptops and accessories by name, SKU, part number or specification.",
    keywords: settings.metaKeywords || undefined,
    icons: settings.favicon ? { icon: settings.favicon } : undefined,
    verification: {
      google: settings.googleSiteVerification || undefined,
      other: settings.bingSiteVerification ? { "msvalidate.01": settings.bingSiteVerification } : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const design = getActiveDesign();
  const [settings, categoryTree] = await Promise.all([
    fetchGeneralSettings().catch(() => ({}) as ApiGeneralSettings),
    fetchCategoryTree().catch(() => []),
  ]);
  const [headerNav, footerMenu, footerContent] = await Promise.all([
    fetchHeaderNav(categoryTree).catch(() => null),
    fetchFooterMenu(categoryTree).catch(() => []),
    fetchFooterContent(),
  ]);
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={design.fontHref} rel="stylesheet" />
        <link rel="stylesheet" href={`/styles/${design.id}.css`} />
        <link rel="stylesheet" href="/styles/commerce.css" />
        {design.extendedPagesRolledOut && <link rel="stylesheet" href="/styles/content.css" />}
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {/* Analytics/marketing tags wait for cookie consent (no <noscript> fallbacks: they could not). */}
        <AnalyticsScripts gtmId={settings.gtmContainerId} ga4Id={settings.ga4MeasurementId} pixelId={settings.metaPixelId} />
        <Sprite />
        <DesignSlugProvider slug="" categoryPaths={buildCategoryPaths(categoryTree)} headerNav={headerNav} categories={categoryTree} settings={settings} footerMenu={footerMenu} footerContent={footerContent}>
          <CartDrawerProvider>
            <main id="main-content">{children}</main>
            <StoreToaster />
            <BackToTop />
            <CookieBanner design={design} />
            <CompareBar />
            <MobileBottomNav categories={categoryTree} />
          </CartDrawerProvider>
        </DesignSlugProvider>
      </body>
    </html>
  );
}
