/** Shared homepage/mega-menu content used by every design's Header and
 * Home, so business claims (specs, prices, chip lists, FAQ answers) stay
 * consistent across all 7 designs — only the surrounding markup/CSS differs
 * per design. Category/brand data itself always comes from lib/catalogue.ts;
 * this file only holds copy and hand-curated cross-cutting groupings (like
 * "Gaming") that don't exist as a literal catalogue category. */

export const MEGA_PROMO: Record<string, { label: string; sub: string; href: { cat?: string; sub?: string } }> = {
  "PC Components": { label: "Build your own", sub: "Every part, compatibility checked before it ships.", href: { cat: "PC Components" } },
  Computers: { label: "Business fleets", sub: "Volume pricing on Business PCs and Workstations.", href: { sub: "Business PCs" } },
  Laptops: { label: "Student laptops", sub: "Lightweight, long battery life, ready for lectures.", href: { sub: "Student Laptops" } },
  Peripherals: { label: "Build your battlestation", sub: "Monitors, keyboards and headsets that match.", href: { sub: "Monitors" } },
  Networking: { label: "Whole-home Wi-Fi", sub: "Mesh access points for dead-zone-free coverage.", href: { cat: "Networking" } },
  Accessories: { label: "Docking stations", sub: "One cable, full desk setup.", href: { sub: "Docking Stations" } },
};

/** "Gaming" is a cross-cutting lens over several real categories, not a
 * catalogue category on its own — hand-picked from subcategories that
 * genuinely exist in the data (see lib/types.ts). */
export const GAMING_MEGA = [
  { heading: "Systems", subs: ["Gaming PCs", "Gaming Laptops"] },
  { heading: "Build it yourself", subs: ["Graphics Cards", "CPUs / Processors", "Motherboards"] },
  { heading: "Gear", subs: ["Monitors", "Gaming Accessories", "Headsets", "Keyboards", "Mice"] },
];

export const GAMING_CHIPS = ["Gaming PCs", "Gaming Laptops", "Graphics Cards", "Monitors", "Keyboards", "Mice", "Headsets"];
export const NETWORK_CHIPS = ["Routers", "Wi-Fi Adapters", "Network Switches", "Ethernet Cables", "Access Points"];
export const ACCESSORY_CHIPS = ["USB Hubs", "Cables", "Adapters", "Laptop Chargers", "Docking Stations", "Storage Accessories"];

export const LAPTOP_CARDS = [
  { sub: "Gaming Laptops", title: "Gaming Laptops", copy: "RTX-powered, high refresh screens, desktop-class performance you can close and carry." },
  { sub: "Business Laptops", title: "Business Laptops", copy: "Long battery life, sturdy chassis and the security features IT teams ask for." },
  { sub: "Student Laptops", title: "Student Laptops", copy: "Light, affordable and built to survive a full timetable of lectures." },
  { sub: "Refurbished Laptops", title: "Refurbished Laptops", copy: "Fully tested, visibly graded and priced well below new." },
];

export const NEED_CARDS = [
  { key: "gaming", title: "Gaming", copy: "High-performance PCs and components for 1080p, 1440p and 4K gaming.", href: { sub: "Gaming PCs" } },
  { key: "business", title: "Business", copy: "Reliable desktops, laptops and monitors for teams that need uptime.", href: { sub: "Business PCs" } },
  { key: "creative", title: "Creative Work", copy: "Colour-accurate displays and fast storage for photo and video editing.", href: { sub: "Workstations" } },
  { key: "ai", title: "AI & Workstations", copy: "High core-count CPUs and workstation-class GPUs for serious workloads.", href: { sub: "Workstations" } },
  { key: "home", title: "Home Computing", copy: "Compact, quiet machines for browsing, streaming and everyday admin.", href: { sub: "All-in-One PCs" } },
  { key: "student", title: "Student", copy: "Budget-friendly laptops and accessories built for lecture halls, not boardrooms.", href: { sub: "Student Laptops" } },
];

export const RIGS = [
  {
    cls: "a",
    tier: "TIER 01 · 1080P",
    name: "Onset",
    fps: "140–240 FPS @ 1080p Ultra",
    specs: [
      ["CPU", "AMD Ryzen 5 9600X"],
      ["GPU", "GeForce RTX 5060 Ti 16GB"],
      ["RAM", "16GB DDR5-6000 CL30"],
      ["SSD", "1TB PCIe 4.0 NVMe"],
      ["PSU", "650W 80+ Gold"],
    ],
    price: "£1,099",
    monthly: "£47/MO · 0%",
  },
  {
    cls: "b",
    tier: "TIER 02 · 1440P · MOST POPULAR",
    name: "Overdrive",
    fps: "160–300 FPS @ 1440p Ultra",
    specs: [
      ["CPU", "AMD Ryzen 7 9800X3D"],
      ["GPU", "GeForce RTX 5080 16GB"],
      ["RAM", "32GB DDR5-6000 CL30"],
      ["SSD", "2TB Samsung 990 PRO"],
      ["PSU", "850W 80+ Gold ATX 3.1"],
    ],
    price: "£2,349",
    monthly: "£98/MO · 0%",
  },
  {
    cls: "c",
    tier: "TIER 03 · 4K",
    name: "Redline",
    fps: "120–200 FPS @ 4K Ultra",
    specs: [
      ["CPU", "AMD Ryzen 9 9950X3D"],
      ["GPU", "GeForce RTX 5090 32GB"],
      ["RAM", "64GB DDR5-6400 CL32"],
      ["SSD", "4TB PCIe 5.0 NVMe"],
      ["PSU", "1200W 80+ Platinum"],
    ],
    price: "£4,199",
    monthly: "£175/MO · 0%",
  },
];

export const GUIDES = [
  { title: "How to Choose a Gaming PC", tag: "Buying guide" },
  { title: "Best GPU for 1440p Gaming", tag: "Buying guide" },
  { title: "How Much RAM Do You Need?", tag: "Buying guide" },
  { title: "SSD vs HDD: What's Right for You?", tag: "Buying guide" },
  { title: "How to Choose a Laptop", tag: "Buying guide" },
  { title: "Gaming Monitor Buying Guide", tag: "Buying guide" },
  { title: "How to Build a Gaming PC", tag: "Buying guide" },
  { title: "Best Business Laptops for 2026", tag: "Buying guide" },
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

export const SEO_COPY_TITLE = "UK Computer Shop for PC Hardware, Gaming & Business Technology";
export const SEO_COPY = [
  "UK Computer Shop stocks computer hardware and complete systems for every kind of buyer, not just gaming enthusiasts. Our PC components range covers CPUs, graphics cards, motherboards, memory, storage and power supplies from the brands UK builders already trust, alongside cases, cooling and the small parts that finish a build properly.",
  "If you'd rather buy a finished machine, our computers range spans gaming PCs, business PCs, workstations, mini PCs and all-in-one desktops, each benchmarked and stress-tested before it leaves our Manchester warehouse. Laptops are split the same way — gaming, business, student and refurbished — so a student replacing a lecture-hall laptop and a business buying ten units for a new office both land on the right page quickly.",
  "Beyond the desk, we stock monitors, keyboards, mice, headsets and webcams under peripherals, plus the networking hardware — routers, mesh Wi-Fi, switches and cabling — that keeps a home or small office online. Our accessories range covers the cables, docking stations, USB hubs and chargers that tend to get forgotten until the day they're needed.",
  "Every product page lists real specifications, current stock and manufacturer warranty terms, and every \"goes well with\" suggestion on the site is checked against socket, memory and power compatibility first — so what we recommend together actually works together. Whether you're upgrading a single graphics card or fitting out a business, UK Computer Shop is built to get you to the right product quickly.",
];

export const HOME_H1 = "PC Components, Gaming PCs, Laptops & Computer Hardware";
