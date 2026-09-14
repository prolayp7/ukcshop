import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import Sprite from "@/components/Sprite";
import BackToTop from "@/components/BackToTop";
import CookieBanner from "@/components/CookieBanner";
import CompareBar from "@/components/CompareBar";
import { CartDrawerProvider } from "@/components/CartDrawer";
import { DesignSlugProvider } from "@/lib/design-context";
import { getActiveDesign } from "@/lib/designs";
import { theme } from "@/lib/theme.config";
import { fetchGeneralSettings, type ApiGeneralSettings } from "@/lib/api";
import "./globals.css";
import "@/components/pages/category.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchGeneralSettings().catch(() => ({}) as ApiGeneralSettings);
  return {
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
  const settings = await fetchGeneralSettings().catch(() => ({}) as ApiGeneralSettings);
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={design.fontHref} rel="stylesheet" />
        <link rel="stylesheet" href={`/styles/${design.id}.css`} />
        <link rel="stylesheet" href="/styles/commerce.css" />
        {design.extendedPagesRolledOut && <link rel="stylesheet" href="/styles/content.css" />}
        {settings.gtmContainerId ? (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtmContainerId}');`}
          </Script>
        ) : null}
        {settings.ga4MeasurementId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga4MeasurementId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${settings.ga4MeasurementId}');`}
            </Script>
          </>
        ) : null}
        {settings.metaPixelId ? (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.metaPixelId}');fbq('track','PageView');`}
          </Script>
        ) : null}
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {settings.gtmContainerId ? (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${settings.gtmContainerId}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="" />
          </noscript>
        ) : null}
        {settings.metaPixelId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <noscript><img height="1" width="1" alt="" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${settings.metaPixelId}&ev=PageView&noscript=1`} /></noscript>
        ) : null}
        <Sprite />
        <DesignSlugProvider slug="">
          <CartDrawerProvider>
            <main id="main-content">{children}</main>
            <BackToTop />
            <CookieBanner design={design} />
            <CompareBar />
          </CartDrawerProvider>
        </DesignSlugProvider>
      </body>
    </html>
  );
}
