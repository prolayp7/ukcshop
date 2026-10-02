/** Shared homepage/mega-menu content used by every design's Header and
 * Home, so business claims (specs, prices, chip lists, FAQ answers) stay
 * consistent across all 7 designs — only the surrounding markup/CSS differs
 * per design. Category/brand data itself always comes from lib/catalogue.ts;
 * this file only holds copy and hand-curated cross-cutting groupings (like
 * "Gaming") that don't exist as a literal catalogue category. */

export const GAMING_CHIPS = ["Gaming PCs", "Gaming Laptops", "Graphics Cards", "Monitors", "Keyboards", "Mice", "Headsets"];

export const LAPTOP_CARDS = [
  { sub: "Gaming Laptops", title: "Gaming Laptops", copy: "RTX-powered, high refresh screens, desktop-class performance you can close and carry." },
  { sub: "Business Laptops", title: "Business Laptops", copy: "Long battery life, sturdy chassis and the security features IT teams ask for." },
  { sub: "Ultrabooks", title: "Ultrabooks", copy: "Thin, light and long-lasting — built for lectures, commutes and working on the move." },
];

export const NEED_CARDS = [
  { key: "gaming", title: "Gaming", copy: "High-performance PCs and components for 1080p, 1440p and 4K gaming.", href: { sub: "Gaming PCs" } },
  { key: "business", title: "Business", copy: "Reliable desktops, laptops and monitors for teams that need uptime.", href: { sub: "Desktop PCs" } },
  { key: "creative", title: "Creative Work", copy: "Colour-accurate displays and fast storage for photo and video editing.", href: { sub: "Workstations" } },
  { key: "ai", title: "AI & Workstations", copy: "High core-count CPUs and workstation-class GPUs for serious workloads.", href: { sub: "Workstations" } },
  { key: "home", title: "Home Computing", copy: "Compact, quiet machines for browsing, streaming and everyday admin.", href: { sub: "Mini PCs" } },
  { key: "student", title: "Student", copy: "Thin, light laptops built for lecture halls, not boardrooms.", href: { sub: "Ultrabooks" } },
];

export const TECH_HUB = [
  { title: "RTX 50-series: what actually changed this generation", tag: "News" },
  { title: "We stress-tested six 850W PSUs — here's what failed", tag: "Review" },
  { title: "Setting up a mesh Wi-Fi network in an older house", tag: "How-to" },
];

export const REVIEWS = [
  { who: "Daniel H.", body: "Ordered a custom build on Tuesday, benchmarked and delivered by Thursday. Cable management was genuinely tidy inside the case." },
  { who: "Priya S.", body: "Asked a technical question about PSU headroom before buying — got a proper answer from someone who clearly builds PCs, not a script." },
  { who: "Mark T.", body: "Refurbished laptop arrived exactly as graded, with the battery health stated up front. No surprises." },
];

export const FAQS = [
  { q: "Do you deliver across the UK?", a: "Yes — we ship to addresses across the UK from our Manchester warehouse." },
  { q: "Do you offer next-day delivery?", a: "Next-day delivery is available on most in-stock items when ordered before 17:00, Monday to Friday." },
  { q: "Do products come with a manufacturer warranty?", a: "Yes. Components and systems carry the manufacturer's standard warranty; complete systems we build also carry our own system warranty." },
  { q: "Can I build a custom gaming PC?", a: "You can buy any component individually, or start from one of our pre-built tiers and swap parts before checkout. Every part we recommend alongside another is checked for socket, memory and power compatibility first." },
  { q: "Do you sell refurbished computers?", a: "Yes — refurbished PCs and laptops are tested and graded before listing, and are clearly marked as refurbished throughout the site." },
  { q: "What payment methods do you accept?", a: "We accept major debit and credit cards, PayPal, and 0% finance options on qualifying orders." },
  { q: "Can I return a product?", a: "Yes, unwanted items can be returned within 30 days in their original condition. Faulty items are handled under manufacturer warranty or our own RMA process." },
  { q: "Do you offer business computer solutions?", a: "Yes — we supply single units or fleets of business PCs, laptops and monitors, with volume pricing available on request." },
];


export const HOME_H1 = "PC Components, Gaming PCs, Laptops & Computer Hardware";
