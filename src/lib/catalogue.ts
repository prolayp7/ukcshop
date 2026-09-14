import productsData from "@/data/products.json";
import { BrandSummary, CAT_ORDER, CategoryTreeNode, Product } from "./types";

/** Routing-safe key: lowercase, non-alphanumerics collapsed to single hyphens. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Mock catalogue has no real slugs (id/name were used directly as routing
// keys) or a real cart/wishlist variant to add - backfilled here so every
// href.product()/href.brand() call site and AddToBasketButton/WishlistButton
// can use `.slug`/`.brandSlug`/`.defaultVariantId` uniformly, whether the
// product came from the mock (still used by compare/header-search - basket
// and wishlist moved to the live cart/wishlist API in Day 4) or the API.
export const PRODUCTS = (productsData as unknown as Omit<Product, "slug" | "brandSlug" | "defaultVariantId">[]).map((p) => ({
  ...p,
  slug: String(p.id),
  brandSlug: slugify(p.brand),
  defaultVariantId: null,
})) as Product[];

/* Which sub-categories genuinely go together in a basket. Drives the
   "complete the build" rail, which is a different question from "related". */
const COMPLEMENT: Record<string, string[]> = {
  "Graphics Cards": ["Power Supplies", "Monitors", "PC Cases"],
  "CPUs / Processors": ["Motherboards", "CPU Coolers", "RAM / Memory", "Thermal Paste"],
  Motherboards: ["CPUs / Processors", "RAM / Memory", "SSD"],
  "RAM / Memory": ["Motherboards", "CPUs / Processors", "PC Cases"],
  SSD: ["Storage Accessories", "Motherboards", "HDD"],
  HDD: ["Storage Accessories", "SSD"],
  "Power Supplies": ["Cables", "PC Cases", "Graphics Cards"],
  "PC Cases": ["Case Fans", "Power Supplies", "CPU Coolers"],
  "CPU Coolers": ["Thermal Paste", "Case Fans", "PC Cases"],
  "Case Fans": ["PC Cases", "CPU Coolers"],
  "Thermal Paste": ["CPU Coolers", "CPUs / Processors"],
  "Gaming PCs": ["Monitors", "Keyboards", "Mice", "Headsets"],
  "Business PCs": ["Monitors", "Keyboards", "Docking Stations"],
  Workstations: ["Monitors", "Docking Stations", "Storage Accessories"],
  "Mini PCs": ["Monitors", "USB Hubs", "Keyboards"],
  "All-in-One PCs": ["Keyboards", "Mice", "Speakers"],
  "Refurbished PCs": ["Monitors", "Keyboards", "Mice"],
  "Gaming Laptops": ["Headsets", "Mice", "Laptop Chargers", "Docking Stations"],
  "Business Laptops": ["Docking Stations", "Laptop Chargers", "Monitors"],
  "Student Laptops": ["Laptop Chargers", "USB Hubs", "Mice"],
  "Refurbished Laptops": ["Laptop Chargers", "USB Hubs"],
  Monitors: ["Cables", "Docking Stations", "Speakers"],
  Keyboards: ["Mice", "Headsets", "Gaming Accessories"],
  Mice: ["Keyboards", "Gaming Accessories"],
  Headsets: ["Webcams", "Gaming Accessories"],
  Webcams: ["Headsets", "Speakers"],
  Speakers: ["Webcams", "Cables"],
  "Gaming Accessories": ["Keyboards", "Mice", "Headsets"],
  Routers: ["Network Switches", "Ethernet Cables", "Access Points"],
  "Wi-Fi Adapters": ["Routers", "Access Points"],
  "Network Switches": ["Ethernet Cables", "Routers"],
  "Ethernet Cables": ["Network Switches", "Routers"],
  "Access Points": ["Network Switches", "Ethernet Cables"],
  "USB Hubs": ["Cables", "Adapters", "Docking Stations"],
  Cables: ["Adapters", "USB Hubs"],
  Adapters: ["Cables", "USB Hubs"],
  "Laptop Chargers": ["Cables", "USB Hubs"],
  "Docking Stations": ["Cables", "Monitors", "Laptop Chargers"],
  "Storage Accessories": ["SSD", "HDD", "Cables"],
};

const BRAND_NOTE: Record<string, string> = {
  AMD: "Ryzen processors and Radeon graphics. We stock the full AM5 range, and still carry AM4 for upgrades.",
  Intel: "Core and Core Ultra processors, Arc graphics and the NUC mini-PC line.",
  NVIDIA: "GeForce RTX graphics, stocked across Founders and partner-board editions.",
  ASUS: "Motherboards, ROG gaming hardware and displays. One of our deepest ranges.",
  MSI: "Motherboards, graphics cards, monitors and gaming laptops.",
  Corsair: "Memory, power supplies, cooling and peripherals — the enthusiast staple.",
  Samsung: "NVMe and SATA storage, plus the Odyssey display range.",
  Gigabyte: "Motherboards and graphics cards, including the AORUS line.",
  Logitech: "Keyboards, mice and webcams for both desk and battlestation.",
  Seagate: "Desktop, NAS and surveillance hard drives.",
  WD: "Internal and external storage, including the Black and Red Plus ranges.",
  Crucial: "Memory and NVMe storage from Micron, including PCIe 5.0 drives.",
  Kingston: "FURY memory and NV-series NVMe storage.",
  "G.Skill": "Trident Z and Ripjaws memory kits, tuned for EXPO and XMP.",
  Noctua: "Air cooling and fans. Quiet, over-engineered, six-year warranty.",
  "be quiet!": "Power supplies, cases and cooling built around low noise.",
  "Fractal Design": "Scandinavian case design, from the North to the Define range.",
  "Lian Li": "Aluminium cases and the UNI FAN ecosystem.",
  NZXT: "Cases, cooling and pre-built systems with a consistent design language.",
  Dell: "OptiPlex, Latitude and UltraSharp — the business standard.",
  HP: "Elite desktops, Pavilion laptops and business peripherals.",
  Lenovo: "ThinkPad, Legion and IdeaCentre across business and gaming.",
  LG: "UltraGear gaming displays and UltraFine creative panels.",
  "TP-Link": "Routers, switches and adapters for home and small office.",
  Ubiquiti: "UniFi access points and networking for prosumer installs.",
  Keychron: "Mechanical keyboards with QMK/VIA and proper UK ISO layouts.",
  Razer: "Gaming keyboards, mice and headsets.",
  UKCS: "Our own-label systems, cables and build services, assembled in Manchester.",
};

const DDR5_ONLY = ["AM5", "LGA1851"];
const DDR4_ONLY = ["AM4"];
const isCooler = (p: Product) => p.subcategory === "CPU Coolers";
const isRam = (p: Product) => p.subcategory === "RAM / Memory";
const isGpu = (p: Product) => p.subcategory === "Graphics Cards";
const isPsu = (p: Product) => p.subcategory === "Power Supplies";
function memForSocket(sock: string): string | null {
  if (DDR5_ONLY.indexOf(sock) > -1) return "DDR5";
  if (DDR4_ONLY.indexOf(sock) > -1) return "DDR4";
  return null; // LGA1700 ships in both flavours
}
function compatible(a: Product, b: Product): boolean {
  const sa = a.attrs.socket as string | undefined;
  const sb = b.attrs.socket as string | undefined;
  if (sa && sb && sa !== sb) return false; // CPU vs board
  const sock = sa || sb;
  if (sock) {
    if (isCooler(b) || isCooler(a)) {
      const c = isCooler(b) ? b : a;
      const list = c.specs.Sockets || "";
      if (list && list.indexOf(sock) === -1) return false; // cooler mount
    }
    if (isRam(b) || isRam(a)) {
      const r = isRam(b) ? b : a;
      const want = memForSocket(sock);
      if (want && r.attrs.memtype && r.attrs.memtype !== want) return false;
    }
  }
  if ((isGpu(a) && isPsu(b)) || (isGpu(b) && isPsu(a))) {
    const g = isGpu(a) ? a : b;
    const u = isPsu(a) ? a : b;
    const need = parseInt(String(g.specs["PSU required"] || "").replace(/\D/g, ""), 10);
    if (need && (u.attrs.wattage as number) && (u.attrs.wattage as number) < need) return false;
  }
  return true;
}

export function money(n: number): string {
  return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function exVat(n: number): string {
  return money(n / 1.2);
}
export function stars(r: number): string {
  const k = Math.round(r);
  return "★★★★★".slice(0, k) + "☆☆☆☆☆".slice(0, 5 - k);
}
export function uniq<T>(a: T[]): T[] {
  return a.filter((v, i) => a.indexOf(v) === i);
}

export function byId(id: number | string): Product | null {
  const n = Number(id);
  return PRODUCTS.find((p) => p.id === n) ?? null;
}
export function tier(p: Product): number {
  return p.price < 60 ? 0 : p.price < 200 ? 1 : p.price < 600 ? 2 : 3;
}

/** Alternatives to the product you are looking at: same shelf, closest fit. */
export function related(p: Product, n = 4): Product[] {
  const same = PRODUCTS.filter((x) => x.id !== p.id && x.subcategory === p.subcategory);
  const pool =
    same.length >= n
      ? same
      : same.concat(PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category && x.subcategory !== p.subcategory));
  return pool
    .map((x) => {
      let score = 0;
      score -= Math.abs(Math.log((x.price || 1) / (p.price || 1))) * 3; // similar money
      if (x.brand === p.brand) score += 0.8;
      if (x.subcategory === p.subcategory) score += 3;
      score += x.rating - 4;
      if (x.stockStatus === "in") score += 0.5;
      return { p: x, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((o) => o.p);
}

/** Things that finish the job — a different question from "related". */
export function alsoBought(p: Product, n = 4): Product[] {
  const subs = COMPLEMENT[p.subcategory] || [];
  const out: Product[] = [];
  const t = tier(p);
  subs.forEach((sub) => {
    const best = PRODUCTS.filter((x) => x.subcategory === sub && x.id !== p.id && compatible(p, x)).sort((a, b) => {
      const d = Math.abs(tier(a) - t) - Math.abs(tier(b) - t);
      return d !== 0 ? d : b.sold - a.sold;
    })[0];
    if (best && out.indexOf(best) === -1) out.push(best);
  });
  if (out.length < n)
    PRODUCTS.slice()
      .sort((a, b) => b.sold - a.sold)
      .forEach((x) => {
        if (out.length < n && x.id !== p.id && out.indexOf(x) === -1 && x.category === p.category && compatible(p, x)) out.push(x);
      });
  return out.slice(0, n);
}

/**
 * Recommended: leans on what this browser has actually looked at (passed in
 * as `seenIds`, most-recent first, since this module has to stay
 * server-safe and can't read localStorage itself), and falls back to best
 * sellers for a first-time visitor.
 */
export function recommended(n = 4, excludeIds: number[] = [], seenIds: number[] = []): Product[] {
  const ex = excludeIds;
  const weight: Record<string, number> = {};
  seenIds.forEach((id, i) => {
    const p = byId(id);
    if (!p) return;
    weight[p.subcategory] = (weight[p.subcategory] || 0) + (seenIds.length - i) * 2;
    weight[p.category] = (weight[p.category] || 0) + (seenIds.length - i);
  });
  const scored = PRODUCTS.filter((x) => ex.indexOf(x.id) === -1 && seenIds.indexOf(x.id) === -1)
    .map((x) => {
      let s = (weight[x.subcategory] || 0) * 1.5 + (weight[x.category] || 0) * 0.5;
      s += Math.log(1 + x.sold) * (seenIds.length ? 0.6 : 2);
      s += (x.rating - 4) * 2;
      if (x.was) s += 0.7;
      return { p: x, s };
    })
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, n).map((o) => o.p);
}

export function byBrand(b: string): Product[] {
  return PRODUCTS.filter((x) => x.brand === b);
}
export function brands(): BrandSummary[] {
  const m: Record<
    string,
    { brand: string; items: Product[]; cats: string[]; min: number; sold: number }
  > = {};
  PRODUCTS.forEach((p) => {
    const b = (m[p.brand] = m[p.brand] || { brand: p.brand, items: [], cats: [], min: Infinity, sold: 0 });
    b.items.push(p);
    if (b.cats.indexOf(p.category) === -1) b.cats.push(p.category);
    b.min = Math.min(b.min, p.price);
    b.sold += p.sold;
  });
  return Object.keys(m)
    .map((k) => {
      const b = m[k];
      const count = b.items.length;
      const rating = b.items.reduce((s, p) => s + p.rating, 0) / count;
      const deals = b.items.filter((p) => p.was).length;
      const note = BRAND_NOTE[k] || `${count} lines across ${b.cats.join(", ").toLowerCase()}.`;
      return { brand: k, slug: slugify(k), count, rating, min: b.min, deals, note } as BrandSummary;
    })
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
}
export function brandNote(brand: string, count: number, cats: string[]): string {
  return BRAND_NOTE[brand] || `${count} lines across ${cats.join(", ").toLowerCase()}.`;
}

/** Category -> sub-category tree, derived from the catalogue rather than
 * hand-maintained, so navigation can never drift from what we actually sell. */
export function tree(): CategoryTreeNode[] {
  const t: Record<string, string[]> = {};
  PRODUCTS.forEach((p) => {
    (t[p.category] = t[p.category] || []).push(p.subcategory);
  });
  return CAT_ORDER.filter((c) => t[c]).map((c) => {
    const subs = uniq(t[c]).sort();
    return { category: c, subs, count: t[c].length };
  });
}
export function countIn(sub: string): number {
  return PRODUCTS.filter((p) => p.subcategory === sub).length;
}

export function stockText(p: Product): { cls: "in" | "low" | "out"; text: string } {
  if (p.stockStatus === "in") return { cls: "in", text: `In stock — ${p.stock} available` };
  if (p.stockStatus === "low") return { cls: "low", text: `Low stock — ${p.stock} remaining` };
  return { cls: "out", text: "Backorder — due in 7–10 days" };
}

export const VAT_RATE = 0.2;

/** The single biggest genuine discount in the catalogue right now — used as
 * the homepage's "Special Offer" feature. Deterministic (ties break on id)
 * so every design shows the same product and server/client renders match. */
export function specialOffer(): Product {
  return PRODUCTS.filter((p) => p.was)
    .slice()
    .sort((a, b) => {
      const da = (a.was! - a.price) / a.was!;
      const db = (b.was! - b.price) / b.was!;
      return db - da || a.id - b.id;
    })[0];
}
