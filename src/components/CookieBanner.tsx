"use client";

import { useEffect, useState } from "react";
import { DesignMeta } from "@/lib/designs";

const KEY = "ukcs.consent";
const EVENT = "ukcs:consent-changed";

export function consentGiven(): boolean {
  if (typeof window === "undefined") return true; // avoid a server/client flash
  try {
    return window.localStorage.getItem(KEY) !== null;
  } catch {
    return true;
  }
}
function setConsent(value: "all" | "essential") {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Ported from js/shop.js's injectConsentBanner — neutral, self-contained
 * styling matching the static site, shown until the visitor picks either
 * option. `design` is accepted for future use (a "Manage preferences" link
 * once a design's cookie-policy page exists), unused for now. */
export default function CookieBanner({ design }: { design: DesignMeta }) {
  const [given, setGiven] = useState(true); // default true so SSR/first paint never flashes the banner

  useEffect(() => {
    const timer = window.setTimeout(() => setGiven(consentGiven()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (given) return null;

  return (
    <div
      aria-label={`${design.name} cookie preferences`}
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9997,
        background: "#111",
        color: "#fff",
        borderRadius: 12,
        boxShadow: "0 20px 50px -20px rgba(0,0,0,.55)",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 18,
        font: "14px/1.5 system-ui, sans-serif",
        maxWidth: 820,
        margin: "0 auto",
        flexWrap: "wrap",
      }}
    >
      <p style={{ margin: 0, flex: 1, minWidth: 220, color: "#d4d4d8" }}>
        We use cookies to run this site and, with your permission, to understand how it is used.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            setConsent("essential");
            setGiven(true);
          }}
          style={{
            borderRadius: 7,
            padding: "9px 16px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,.3)",
            background: "none",
            color: "#fff",
            fontFamily: "inherit",
          }}
        >
          Reject non-essential
        </button>
        <button
          type="button"
          onClick={() => {
            setConsent("all");
            setGiven(true);
          }}
          style={{
            borderRadius: 7,
            padding: "9px 16px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            border: "1px solid #fff",
            background: "#fff",
            color: "#111",
            fontFamily: "inherit",
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
