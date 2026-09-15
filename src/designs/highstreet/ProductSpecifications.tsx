"use client";

import { useRef, useState } from "react";
import { Copy, FileText, Gauge, Search, Tag } from "lucide-react";
import type { Product } from "@/lib/types";

export default function ProductSpecifications({ product, brandHref }: { product: Product; brandHref: string }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const sheet = useRef<HTMLDivElement>(null);
  const groups = [
    { title: "Technical Specifications", icon: Gauge, rows: Object.entries(product.specs).map(([label, value]) => ({ label, value: Array.isArray(value) ? value.join(", ") : String(value ?? ""), href: undefined as string | undefined })) },
    { title: "Product Identification", icon: Tag, rows: [
      { label: "Brand", value: product.brand, href: brandHref },
      { label: "Manufacturer part no.", value: product.mpn },
      { label: "EAN", value: product.ean },
    ] },
  ].map((group) => ({ ...group, rows: group.rows.filter((row) => row.value) })).filter((group) => group.rows.length);
  const search = query.trim().toLowerCase();
  const filtered = groups.map((group) => ({ ...group, rows: group.rows.filter((row) => `${group.title} ${row.label} ${row.value}`.toLowerCase().includes(search)) })).filter((group) => group.rows.length);

  async function copySpecs() {
    try {
      await navigator.clipboard.writeText([product.name, ...groups.map((group) => `${group.title}\n${group.rows.map((row) => `${row.label}: ${row.value}`).join("\n")}`)].join("\n\n"));
      setMessage("Specifications copied.");
    } catch {
      setMessage("Could not copy. Please select and copy the specifications manually.");
    }
  }

  function printSpecs() {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0";
    frame.title = "Product specification PDF";
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    const target = frame.contentWindow;
    if (!doc || !target || !sheet.current) {
      frame.remove();
      setMessage("Unable to open the print dialog. Please try again.");
      return;
    }
    doc.title = `${product.name} — Specifications`;
    const style = doc.createElement("style");
    style.textContent = "body{font:12px sans-serif;color:#08131b;padding:24px}h1{font-size:22px}h3{font-size:16px;margin-top:28px}table{width:100%;border-collapse:collapse}th,td{padding:10px 0;border-bottom:1px solid #d7dee7;text-align:left}th{font-weight:400;width:50%}td{text-align:right}a{color:inherit;text-decoration:none}svg{display:none}section{break-inside:avoid}";
    doc.head.appendChild(style);
    const heading = doc.createElement("h1");
    heading.textContent = product.name;
    doc.body.append(heading, sheet.current.cloneNode(true));
    target.addEventListener("afterprint", () => frame.remove(), { once: true });
    target.focus();
    target.print();
  }

  return (
    <section className="product-specifications" aria-labelledby="product-spec-title">
      <div className="product-spec-header">
        <div><p className="product-spec-eyebrow">Product data sheet</p><h2 id="product-spec-title">Full Technical Specifications</h2></div>
        <div className="product-spec-actions">
          <button type="button" onClick={copySpecs} disabled={!groups.length}><Copy size={14} aria-hidden="true" />Copy Specs</button>
          <button type="button" onClick={printSpecs} disabled={!filtered.length} title="Open the print dialog and choose Save as PDF"><FileText size={14} aria-hidden="true" />Print / Save PDF</button>
        </div>
      </div>
      <label className="product-spec-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Filter specifications" placeholder="Filter specs (e.g., 'memory', 'socket', 'weight')…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <p className="product-spec-status" role="status">{message}</p>
      <div ref={sheet} className="product-spec-groups">
        {filtered.map(({ title, icon: GroupIcon, rows }) => (
          <section className="product-spec-group" key={title}>
            <h3><GroupIcon size={19} aria-hidden="true" />{title}</h3>
            <table aria-label={title}><tbody>{rows.map(({ label, value, href }) => <tr key={label}><th scope="row">{label}</th><td>{href ? <a href={href}>{value}</a> : value}</td></tr>)}</tbody></table>
          </section>
        ))}
      </div>
      {!filtered.length && <p className="product-spec-empty">{groups.length ? "No specifications match your search." : "Specifications are not available for this product yet."}</p>}
    </section>
  );
}
