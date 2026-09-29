"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { analyticsConsented, onConsentChange } from "./CookieBanner";

// Tag IDs are interpolated into inline scripts, so only their normal shapes are accepted.
const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/;
const GA4_ID = /^G-[A-Z0-9]{4,16}$/;
const PIXEL_ID = /^\d{6,20}$/;

/** Google Tag Manager, GA4 and the Meta Pixel (IDs from Admin > Settings) load only after the visitor
 * clicks "Accept all" in the cookie banner, as UK PECR requires for non-essential cookies. */
export default function AnalyticsScripts({ gtmId, ga4Id, pixelId }: { gtmId?: string; ga4Id?: string; pixelId?: string }) {
  const [consented, setConsented] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setConsented(analyticsConsented()), 0);
    const unsubscribe = onConsentChange(() => setConsented(analyticsConsented()));
    return () => { window.clearTimeout(timer); unsubscribe(); };
  }, []);
  if (!consented) return null;

  const gtm = gtmId && GTM_ID.test(gtmId) ? gtmId : null;
  const ga4 = ga4Id && GA4_ID.test(ga4Id) ? ga4Id : null;
  const pixel = pixelId && PIXEL_ID.test(pixelId) ? pixelId : null;
  return (
    <>
      {gtm ? (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      ) : null}
      {ga4 ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${ga4}');`}
          </Script>
        </>
      ) : null}
      {pixel ? (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
