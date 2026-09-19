"use client";

import { useState } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import { Compare, useCompare, COMPARE_MAX } from "@/lib/basket";
import { useHref } from "@/lib/design-context";
import { money } from "@/lib/catalogue";
import { ProductVisual } from "@/components/Icon";

/** Sticky cross-design compare tray — neutral, self-contained styling
 * (not themed per design), matching BackToTop/CookieBanner's convention. */
export default function CompareBar() {
  const { products, count } = useCompare();
  const href = useHref();
  const [minimized, setMinimized] = useState(false);

  if (!count) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label="Expand product comparison tray"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 9990,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#12151c",
          color: "#fff",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 999,
          padding: "10px 16px",
          boxShadow: "0 12px 30px -10px rgba(0,0,0,.5)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <ArrowLeftRight size={15} color="var(--blue)" />
        {count} product{count === 1 ? "" : "s"} to compare
      </button>
    );
  }

  return (
    <div
      id="ukcs-cmp-tray"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9990,
        background: "#12151c",
        color: "#fff",
        borderTop: "1px solid rgba(255,255,255,.12)",
        boxShadow: "0 -12px 30px -10px rgba(0,0,0,.5)",
      }}
    >
      <div
        style={{
          maxWidth: 1514,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          <span
            style={{
              width: 30,
              height: 30,
              flex: "none",
              borderRadius: "50%",
              background: "var(--blue)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {count}
          </span>
          <div>
            <b style={{ display: "block", fontSize: 14, whiteSpace: "nowrap" }}>
              {count} Product{count === 1 ? "" : "s"} Selected for Direct Comparison
            </b>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)" }}>
              Compare specifications, features &amp; prices side by side
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0, overflowX: "auto" }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                color: "#111",
                borderRadius: 8,
                padding: "6px 22px 6px 8px",
                flex: "none",
                width: 200,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  flex: "none",
                  borderRadius: 6,
                  background: "#f2f2f2",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <ProductVisual productId={p.id} iconId={p.icon} w={26} h={20} />
              </span>
              <span style={{ minWidth: 0 }}>
                <b
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    lineHeight: 1.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={p.name}
                >
                  {p.name}
                </b>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>{money(p.price)}</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${p.name} from compare`}
                onClick={() => Compare.remove(p.id)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#111",
                  color: "#fff",
                  border: "2px solid #12151c",
                  fontSize: 11,
                  lineHeight: 1,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
          {Array.from({ length: COMPARE_MAX - count }, (_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                flex: "none",
                width: 130,
                border: "1px dashed rgba(255,255,255,.3)",
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                fontSize: 11.5,
                color: "rgba(255,255,255,.5)",
              }}
            >
              + Add Slot {count + i + 1}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "none" }}>
          <a
            href={href.compare()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--blue)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              padding: "10px 18px",
              borderRadius: 8,
              whiteSpace: "nowrap",
            }}
          >
            <ArrowLeftRight size={15} />
            Compare {count} Model{count === 1 ? "" : "s"}
          </a>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            style={{ color: "rgba(255,255,255,.6)", fontSize: 12.5, cursor: "pointer" }}
          >
            Minimize
          </button>
          <button
            type="button"
            aria-label="Close comparison tray"
            onClick={() => Compare.clear()}
            style={{ color: "rgba(255,255,255,.6)", cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
