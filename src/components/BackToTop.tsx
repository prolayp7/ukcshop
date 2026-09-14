"use client";

import { useEffect, useState } from "react";
import { consentGiven } from "./CookieBanner";

/** Ported from js/shop.js's ensureBackToTop/positionBackToTop — self-contained
 * styling (not themed per design), colored to the RigForge brand red. */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [bottom, setBottom] = useState(92);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    const onConsent = () => setBottom(consentGiven() ? 20 : 92);
    onScroll();
    onConsent();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("ukcs:consent-changed", onConsent);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("ukcs:consent-changed", onConsent);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        right: 20,
        bottom,
        zIndex: 9995,
        width: 46,
        height: 46,
        borderRadius: "50%",
        background: "#e2231a",
        color: "#fff",
        border: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 12px 30px -10px rgba(0,0,0,.5)",
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity .2s, transform .2s, bottom .2s",
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24">
        <use href="#i-arr" transform="rotate(-90 12 12)" />
      </svg>
    </button>
  );
}
