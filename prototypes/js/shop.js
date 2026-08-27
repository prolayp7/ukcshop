/* Shared catalogue logic for all four prototype designs.
   Each design supplies its own markup and CSS; the data, the recommendation
   rules and the formatting live here so every design shows the same products. */
(function (root) {
"use strict";
var P = root.PRODUCTS || [];

/* Which sub-categories genuinely go together in a basket. Drives the
   "complete the build" rail, which is a different question from "related". */
var COMPLEMENT = {
  "Graphics Cards":["Power Supplies","Monitors","PC Cases"],
  "CPUs / Processors":["Motherboards","CPU Coolers","RAM / Memory","Thermal Paste"],
  "Motherboards":["CPUs / Processors","RAM / Memory","SSD"],
  "RAM / Memory":["Motherboards","CPUs / Processors","PC Cases"],
  "SSD":["Storage Accessories","Motherboards","HDD"],
  "HDD":["Storage Accessories","SSD"],
  "Power Supplies":["Cables","PC Cases","Graphics Cards"],
  "PC Cases":["Case Fans","Power Supplies","CPU Coolers"],
  "CPU Coolers":["Thermal Paste","Case Fans","PC Cases"],
  "Case Fans":["PC Cases","CPU Coolers"],
  "Thermal Paste":["CPU Coolers","CPUs / Processors"],
  "Gaming PCs":["Monitors","Keyboards","Mice","Headsets"],
  "Business PCs":["Monitors","Keyboards","Docking Stations"],
  "Workstations":["Monitors","Docking Stations","Storage Accessories"],
  "Mini PCs":["Monitors","USB Hubs","Keyboards"],
  "All-in-One PCs":["Keyboards","Mice","Speakers"],
  "Refurbished PCs":["Monitors","Keyboards","Mice"],
  "Gaming Laptops":["Headsets","Mice","Laptop Chargers","Docking Stations"],
  "Business Laptops":["Docking Stations","Laptop Chargers","Monitors"],
  "Student Laptops":["Laptop Chargers","USB Hubs","Mice"],
  "Refurbished Laptops":["Laptop Chargers","USB Hubs"],
  "Monitors":["Cables","Docking Stations","Speakers"],
  "Keyboards":["Mice","Headsets","Gaming Accessories"],
  "Mice":["Keyboards","Gaming Accessories"],
  "Headsets":["Webcams","Gaming Accessories"],
  "Webcams":["Headsets","Speakers"],
  "Speakers":["Webcams","Cables"],
  "Gaming Accessories":["Keyboards","Mice","Headsets"],
  "Routers":["Network Switches","Ethernet Cables","Access Points"],
  "Wi-Fi Adapters":["Routers","Access Points"],
  "Network Switches":["Ethernet Cables","Routers"],
  "Ethernet Cables":["Network Switches","Routers"],
  "Access Points":["Network Switches","Ethernet Cables"],
  "USB Hubs":["Cables","Adapters","Docking Stations"],
  "Cables":["Adapters","USB Hubs"],
  "Adapters":["Cables","USB Hubs"],
  "Laptop Chargers":["Cables","USB Hubs"],
  "Docking Stations":["Cables","Monitors","Laptop Chargers"],
  "Storage Accessories":["SSD","HDD","Cables"]
};

var BRAND_NOTE = {
  "AMD":"Ryzen processors and Radeon graphics. We stock the full AM5 range, and still carry AM4 for upgrades.",
  "Intel":"Core and Core Ultra processors, Arc graphics and the NUC mini-PC line.",
  "NVIDIA":"GeForce RTX graphics, stocked across Founders and partner-board editions.",
  "ASUS":"Motherboards, ROG gaming hardware and displays. One of our deepest ranges.",
  "MSI":"Motherboards, graphics cards, monitors and gaming laptops.",
  "Corsair":"Memory, power supplies, cooling and peripherals — the enthusiast staple.",
  "Samsung":"NVMe and SATA storage, plus the Odyssey display range.",
  "Gigabyte":"Motherboards and graphics cards, including the AORUS line.",
  "Logitech":"Keyboards, mice and webcams for both desk and battlestation.",
  "Seagate":"Desktop, NAS and surveillance hard drives.",
  "WD":"Internal and external storage, including the Black and Red Plus ranges.",
  "Crucial":"Memory and NVMe storage from Micron, including PCIe 5.0 drives.",
  "Kingston":"FURY memory and NV-series NVMe storage.",
  "G.Skill":"Trident Z and Ripjaws memory kits, tuned for EXPO and XMP.",
  "Noctua":"Air cooling and fans. Quiet, over-engineered, six-year warranty.",
  "be quiet!":"Power supplies, cases and cooling built around low noise.",
  "Fractal Design":"Scandinavian case design, from the North to the Define range.",
  "Lian Li":"Aluminium cases and the UNI FAN ecosystem.",
  "NZXT":"Cases, cooling and pre-built systems with a consistent design language.",
  "Dell":"OptiPlex, Latitude and UltraSharp — the business standard.",
  "HP":"Elite desktops, Pavilion laptops and business peripherals.",
  "Lenovo":"ThinkPad, Legion and IdeaCentre across business and gaming.",
  "LG":"UltraGear gaming displays and UltraFine creative panels.",
  "TP-Link":"Routers, switches and adapters for home and small office.",
  "Ubiquiti":"UniFi access points and networking for prosumer installs.",
  "Keychron":"Mechanical keyboards with QMK/VIA and proper UK ISO layouts.",
  "Razer":"Gaming keyboards, mice and headsets.",
  "UKCS":"Our own-label systems, cables and build services, assembled in Manchester."
};


/* Compatibility gate for the "complete the build" rail. A shop that pairs an
   AM5 processor with an LGA1851 board is worse than useless, so anything we
   suggest alongside a part has to physically fit it. */
var DDR5_ONLY = ["AM5","LGA1851"], DDR4_ONLY = ["AM4"];
function isCooler(p){ return p.subcategory === "CPU Coolers"; }
function isRam(p){ return p.subcategory === "RAM / Memory"; }
function isGpu(p){ return p.subcategory === "Graphics Cards"; }
function isPsu(p){ return p.subcategory === "Power Supplies"; }
function memForSocket(sock){
  if (DDR5_ONLY.indexOf(sock) > -1) return "DDR5";
  if (DDR4_ONLY.indexOf(sock) > -1) return "DDR4";
  return null;                       // LGA1700 ships in both flavours
}
function compatible(a, b){
  var sa = a.attrs.socket, sb = b.attrs.socket;
  if (sa && sb && sa !== sb) return false;                    // CPU vs board
  var sock = sa || sb;
  if (sock) {
    if (isCooler(b) || isCooler(a)) {
      var c = isCooler(b) ? b : a;
      var list = c.specs.Sockets || "";
      if (list && list.indexOf(sock) === -1) return false;    // cooler mount
    }
    if (isRam(b) || isRam(a)) {
      var r = isRam(b) ? b : a, want = memForSocket(sock);
      if (want && r.attrs.memtype && r.attrs.memtype !== want) return false;
    }
  }
  if ((isGpu(a) && isPsu(b)) || (isGpu(b) && isPsu(a))) {     // PSU headroom
    var g = isGpu(a) ? a : b, u = isPsu(a) ? a : b;
    var need = parseInt(String(g.specs["PSU required"] || "").replace(/\D/g,""), 10);
    if (need && u.attrs.wattage && u.attrs.wattage < need) return false;
  }
  return true;
}

function money(n){ return "£" + Number(n).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function exVat(n){ return money(n/1.2); }
function stars(r){ var k = Math.round(r); return "★★★★★".slice(0,k) + "☆☆☆☆☆".slice(0,5-k); }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function uniq(a){ return a.filter(function(v,i){ return a.indexOf(v) === i; }); }
function param(k){ try { return new URLSearchParams(location.search).get(k); } catch(e){ return null; } }

/* design prefix, taken from the filename: 01-product.html -> "01" */
var design = (location.pathname.match(/(\d{2})-/) || [,"01"])[1];
function url(kind, q){
  var s = Object.keys(q||{}).map(function(k){ return k + "=" + encodeURIComponent(q[k]); }).join("&");
  var file = { home:"", product:"-product", brand:"-brand", brands:"-brands",
               category:"-category", basket:"-basket", checkout:"-checkout", account:"-account", compare:"-compare",
               login:"-login", register:"-register", forgotPassword:"-forgot-password",
               orderDetails:"-order-details", orderCancel:"-order-cancel", orderReturn:"-order-return", orderInvoice:"-invoice",
               about:"-about", contact:"-contact", stores:"-stores", faq:"-faq", support:"-support",
               delivery:"-delivery", returns:"-returns", warranty:"-warranty", paymentInfo:"-payment-info",
               terms:"-terms", privacy:"-privacy", cookiePolicy:"-cookie-policy",
               blog:"-blog", blogPost:"-blog-post", blogAuthor:"-blog-author", deals:"-deals",
               error404:"-404", error403:"-403", error500:"-500", maintenance:"-maintenance", comingSoon:"-coming-soon" }[kind];
  var name = kind === "home" ? design + HOME_SUFFIX[design] : design + file;
  return name + ".html" + (s ? "?" + s : "");
}
var HOME_SUFFIX = { "01":"-highstreet", "02":"-overdrive", "03":"-atelier", "04":"-spec-index", "05":"-voltage" };

function byId(id){ id = Number(id); for (var i=0;i<P.length;i++) if (P[i].id === id) return P[i]; return null; }
function tier(p){ return p.price < 60 ? 0 : p.price < 200 ? 1 : p.price < 600 ? 2 : 3; }

/* Alternatives to the product you are looking at: same shelf, closest fit. */
function related(p, n){
  n = n || 4;
  var same = P.filter(function(x){ return x.id !== p.id && x.subcategory === p.subcategory; });
  var pool = same.length >= n ? same
           : same.concat(P.filter(function(x){ return x.id !== p.id && x.category === p.category && x.subcategory !== p.subcategory; }));
  return pool.map(function(x){
      var score = 0;
      score -= Math.abs(Math.log((x.price||1)/(p.price||1))) * 3;   // similar money
      if (x.brand === p.brand) score += 0.8;
      if (x.subcategory === p.subcategory) score += 3;
      score += x.rating - 4;
      if (x.stockStatus === "in") score += 0.5;
      return { p:x, score:score };
    })
    .sort(function(a,b){ return b.score - a.score; })
    .slice(0, n).map(function(o){ return o.p; });
}

/* Things that finish the job — a different question from "related". */
function alsoBought(p, n){
  n = n || 4;
  var subs = COMPLEMENT[p.subcategory] || [];
  var out = [], t = tier(p);
  subs.forEach(function(sub){
    var best = P.filter(function(x){ return x.subcategory === sub && x.id !== p.id && x.stockStatus !== "backorder" && compatible(p, x); })
      .sort(function(a,b){
        var d = Math.abs(tier(a)-t) - Math.abs(tier(b)-t);
        return d !== 0 ? d : b.sold - a.sold;
      })[0];
    if (best && out.indexOf(best) === -1) out.push(best);
  });
  if (out.length < n)
    P.slice().sort(function(a,b){ return b.sold - a.sold; }).forEach(function(x){
      if (out.length < n && x.id !== p.id && out.indexOf(x) === -1 && x.category === p.category && compatible(p, x)) out.push(x);
    });
  return out.slice(0, n);
}

/* Recommended: leans on what this browser has actually looked at, and falls
   back to best sellers for a first-time visitor. */
function recommended(n, excludeIds){
  n = n || 4;
  var ex = excludeIds || [];
  var seen = recent();
  var weight = {};
  seen.forEach(function(id, i){
    var p = byId(id); if (!p) return;
    weight[p.subcategory] = (weight[p.subcategory] || 0) + (seen.length - i) * 2;
    weight[p.category] = (weight[p.category] || 0) + (seen.length - i);
  });
  var scored = P.filter(function(x){ return ex.indexOf(x.id) === -1 && seen.indexOf(x.id) === -1; })
    .map(function(x){
      var s = (weight[x.subcategory] || 0) * 1.5 + (weight[x.category] || 0) * 0.5;
      s += Math.log(1 + x.sold) * (seen.length ? 0.6 : 2);
      s += (x.rating - 4) * 2;
      if (x.was) s += 0.7;
      return { p:x, s:s };
    })
    .sort(function(a,b){ return b.s - a.s; });
  return scored.slice(0, n).map(function(o){ return o.p; });
}

function recent(){ try { return JSON.parse(localStorage.getItem("ukcs.recent")) || []; } catch(e){ return []; } }
function pushRecent(id){
  var r = recent().filter(function(x){ return x !== Number(id); });
  r.unshift(Number(id));
  try { localStorage.setItem("ukcs.recent", JSON.stringify(r.slice(0,10))); } catch(e){}
}
function recentProducts(n, excludeId){
  return recent().filter(function(id){ return id !== Number(excludeId); })
                 .map(byId).filter(Boolean).slice(0, n || 6);
}

function byBrand(b){ return P.filter(function(x){ return x.brand === b; }); }
function brands(){
  var m = {};
  P.forEach(function(p){
    var b = m[p.brand] = m[p.brand] || { brand:p.brand, items:[], cats:[], min:Infinity, rating:0, sold:0 };
    b.items.push(p);
    if (b.cats.indexOf(p.category) === -1) b.cats.push(p.category);
    b.min = Math.min(b.min, p.price);
    b.sold += p.sold;
  });
  return Object.keys(m).map(function(k){
    var b = m[k];
    b.count = b.items.length;
    b.rating = b.items.reduce(function(s,p){ return s + p.rating; }, 0) / b.count;
    b.reviews = b.items.reduce(function(s,p){ return s + p.reviews; }, 0);
    b.subcats = uniq(b.items.map(function(p){ return p.subcategory; }));
    b.top = b.items.slice().sort(function(a,b2){ return b2.sold - a.sold; })[0];
    b.note = BRAND_NOTE[k] || (b.count + " lines across " + b.cats.join(", ").toLowerCase() + ".");
    b.deals = b.items.filter(function(p){ return p.was; }).length;
    return b;
  }).sort(function(a,b){ return b.count - a.count || a.brand.localeCompare(b.brand); });
}


/* Category -> sub-category tree, derived from the catalogue rather than
   hand-maintained, so navigation can never drift from what we actually sell. */
var CAT_ORDER = ["PC Components","Computers","Laptops","Peripherals","Networking","Accessories"];
function tree(){
  var t = {};
  P.forEach(function(p){ (t[p.category] = t[p.category] || []).push(p.subcategory); });
  return CAT_ORDER.filter(function(c){ return t[c]; }).map(function(c){
    var subs = uniq(t[c]).sort();
    return { category:c, subs:subs, count:t[c].length };
  });
}
function countIn(sub){ return P.filter(function(p){ return p.subcategory === sub; }).length; }


/* ---------------- basket, delivery and order state ----------------
   Everything lives in localStorage. There is no server: these rules are here so
   the four designs agree on totals rather than each inventing its own. */
var VAT_RATE = 0.20;

/* ---------------- blog ----------------
   Static content, same spirit as the catalogue data: real enough to design
   against, clearly invented, and structured so one template serves the
   listing, a category, a tag and an author's articles rather than four. */
var BLOG_AUTHORS = [
  { slug:"mark-esson", name:"Mark Esson", role:"Senior Build Technician",
    bio:"Been building and repairing PCs since the socket 478 days. Runs the workshop's stress-test bench and writes most of the buying guides.",
    avatarSeed:"ukcs-author-mark" },
  { slug:"chidi-okafor", name:"Chidi Okafor", role:"Hardware Specialist",
    bio:"Focuses on storage, memory and cooling. If a spec sheet has a footnote, Chidi has already read it.",
    avatarSeed:"ukcs-author-chidi" },
  { slug:"sara-quinn", name:"Sara Quinn", role:"Workshop Manager",
    bio:"Runs the day-to-day of the Manchester workshop and writes about the parts of buying a computer that spec sheets don't cover.",
    avatarSeed:"ukcs-author-sara" }
];
var BLOG_POSTS = [
  { slug:"how-much-power-supply-do-you-need", title:"How much power supply do you actually need?",
    category:"Buying guides", tags:["Power supplies","Compatibility"], author:"mark-esson",
    date:"2026-07-14", readMins:8, cover:"ukcs-blog-psu",
    excerpt:"Transient spikes, headroom and why the calculator number on a manufacturer's site isn't the whole story.",
    body:[
      "Every graphics card box quotes a “recommended” power supply wattage, and every online calculator will hand you a bigger number than you expected. Neither is wrong, exactly — they're both being cautious about something worth understanding rather than just obeying.",
      "The number that actually matters isn't your system's average draw, it's the transient spike: a graphics card under load can briefly pull two to three times its rated power for a few milliseconds. A supply with too little headroom won't smoothly reduce performance when that happens — it will trip its protection circuit and cut power entirely, which looks exactly like a random crash and is genuinely difficult to diagnose after the fact.",
      "Our own rule of thumb, and the one baked into the compatibility checks on every product page here: take the GPU manufacturer's recommended wattage, and don't go below it even if a calculator suggests you could. If you're planning to keep the system for years and might upgrade the graphics card later, buying one tier above that recommendation costs relatively little now and saves a full PSU swap later.",
      "The other number worth checking is the connector, not just the wattage. Modern high-end cards increasingly use the 12V-2×6 connector rather than multiple 8-pin PCIe leads, and a supply's wattage rating tells you nothing about which connectors it actually has in the box."
    ] },
  { slug:"ddr5-timings-without-the-marketing", title:"DDR5 timings, without the marketing",
    category:"Explained", tags:["Memory","Performance"], author:"chidi-okafor",
    date:"2026-06-30", readMins:11, cover:"ukcs-blog-ram",
    excerpt:"CL30 versus CL36 at the same speed, measured across nine real workloads rather than a single synthetic benchmark.",
    body:[
      "Memory listings lead with a big speed number — 6000, 6400, sometimes higher — and bury the latency rating in smaller text below it. That ordering is backwards for most buyers, because at a given speed, latency is usually the bigger lever on real performance.",
      "CL30 and CL36 kits running at the same 6000 MT/s aren't interchangeable. The lower CAS latency number means fewer clock cycles between a memory request and the data arriving, and across the range of workloads we actually test on our bench — game frame times, compression, code compilation — a CL30 kit consistently edges out a CL36 kit at the same speed, sometimes by a margin that matters and sometimes by one that doesn't.",
      "Where it matters most: anything sensitive to memory latency rather than bandwidth, which in practice means gaming frame times and any single-threaded workload. Where it matters least: sustained throughput tasks like video encoding, which lean more on raw bandwidth than latency.",
      "Practically: if a CL30 and a CL36 kit at the same speed are priced close together, take the CL30 kit. If the latency upgrade costs meaningfully more, it's only worth it if you're specifically chasing 1% lows in games or working with latency-sensitive software."
    ] },
  { slug:"oled-or-fast-ips-for-a-1440p-desk", title:"OLED or fast IPS for a 1440p desk?",
    category:"Comparisons", tags:["Monitors"], author:"sara-quinn",
    date:"2026-06-12", readMins:9, cover:"ukcs-blog-monitor",
    excerpt:"Burn-in risk in 2026, text clarity for actual work, and which panel suits a desk used for more than games.",
    body:[
      "OLED monitors solved the two things gamers cared about most — response time and true black levels — years before they solved the two things everyone else cares about: static-content burn-in risk and comfortable all-day text rendering.",
      "Burn-in risk is real but overstated for how most desks are actually used. Modern OLED panels ship with pixel-shifting and logo-dimming safeguards, and the failure case — a taskbar or a static UI element left on screen for extended, uninterrupted periods — is avoidable with basic habits rather than a reason to avoid the panel entirely.",
      "Where a fast IPS panel still wins outright: pure text work at small font sizes. OLED's subpixel layout can produce faint colour fringing on fine text that some people never notice and others find genuinely uncomfortable during long reading or coding sessions. If your desk is 80% spreadsheets and code with gaming in the evenings, test an OLED panel in person before committing.",
      "Our honest recommendation: if gaming is the primary use, OLED's response time and contrast are worth the burn-in caveat. If the monitor spends most of its life showing a code editor or a browser, a high-refresh IPS panel remains the safer everyday choice."
    ] },
  { slug:"refurbished-vs-new-whats-the-real-difference", title:"Refurbished vs new: what's the real difference?",
    category:"Buying guides", tags:["Refurbished","Laptops"], author:"sara-quinn",
    date:"2026-05-22", readMins:7, cover:"ukcs-blog-refurb",
    excerpt:"What actually happens to a system before it's graded and listed, and when refurbished is the better buy.",
    body:[
      "“Refurbished” covers a wide range of actual conditions across the industry, which is exactly why we publish a grade and a description of what was checked on every listing rather than using the word on its own.",
      "On our own refurbished stock, every unit is powered on, stress-tested, and any failed component replaced before grading. A unit graded for cosmetic wear has been checked functionally to the same standard as one graded as looking new — the grade describes the case and screen, not the internals.",
      "Refurbished makes the most sense for business laptops and desktops, where last year's mid-range professional model at a meaningful discount will comfortably outperform a genuinely new budget model at the same price. It makes less sense for the newest graphics card generation, where refurbished stock is scarce and the discount versus new is usually small.",
      "One thing to actually check before buying: our refurbished warranty. It's shorter than the warranty on new systems we build, and that's stated clearly on every listing rather than left for you to find out later."
    ] },
  { slug:"air-or-liquid-cooling-for-a-modern-cpu", title:"Air or liquid cooling for a modern CPU?",
    category:"Explained", tags:["Cooling","CPUs"], author:"mark-esson",
    date:"2026-05-02", readMins:8, cover:"ukcs-blog-cooling",
    excerpt:"A good air cooler beats a mediocre AIO more often than the marketing around liquid cooling suggests.",
    body:[
      "A 360mm AIO looks more impressive in a case than a tower air cooler, and that's doing a lot of work in why liquid cooling has a reputation for being the “better” choice. Thermally, a genuinely good dual-tower air cooler competes with a mid-range 240mm or even 280mm AIO on most modern CPUs.",
      "Where liquid actually pulls ahead: very high sustained loads on a high-core-count processor, and clearance-constrained builds where a large air tower simply won't fit under a case's side panel or won't clear tall memory modules.",
      "Where air is the better choice more often than people expect: everything else. No pump to eventually wear out, no tubing to worry about over a multi-year lifespan, and typically better price-to-performance below the very top tier of CPUs.",
      "Our practical filter: if the CPU is a flagship part running sustained all-core workloads (rendering, compilation, streaming while gaming), a 280mm-or-larger AIO earns its keep. For most gaming-focused builds, a well-reviewed dual-tower air cooler is the better spend, and the money saved is better put toward the graphics card."
    ] },
  { slug:"building-your-first-gaming-pc-a-realistic-order-of-operations", title:"Building your first gaming PC: a realistic order of operations",
    category:"Buying guides", tags:["Gaming PCs","Compatibility"], author:"chidi-okafor",
    date:"2026-04-18", readMins:12, cover:"ukcs-blog-build",
    excerpt:"The order we'd actually pick parts in, starting from a budget rather than a graphics card.",
    body:[
      "Most first-build guides start with “pick your graphics card” because it's the most exciting part to shop for. We'd suggest starting with a number instead: your total budget, because it changes which trade-offs are worth making everywhere else.",
      "From there, the order that avoids the most rework: case (it constrains everything physically), then power supply sized to the GPU tier you're aiming for, then motherboard and CPU together as a pair since they're locked to the same socket, then memory matched to what that platform actually supports well, then storage, then finally the graphics card itself — by which point you'll know exactly how much budget is left for it.",
      "The single most common first-build mistake we see at the counter isn't a compatibility error — our configurator catches most of those — it's underspending on the power supply to leave more for the GPU, then discovering the system won't reliably run under full load.",
      "If in doubt, one of our pre-built tiers is a reasonable starting point even for a first build: every part in it is already compatibility-checked, and every part in it can also be swapped individually before checkout if you want to fine-tune it yourself."
    ] }
];

var DELIVERY = [
  { id:"standard", label:"Standard delivery", note:"3–5 working days", price:2.95, freeOver:75 },
  { id:"nextday",  label:"Next working day",  note:"Order before 17:00", price:4.95, freeOver:75 },
  { id:"saturday", label:"Saturday delivery", note:"Before 13:00",       price:7.95, freeOver:null },
  { id:"collect",  label:"Collect in store",  note:"Manchester, ready in 2 hours", price:0, freeOver:null }
];
function lsGet(k, d){ try { var v = JSON.parse(localStorage.getItem("ukcs."+k)); return v === null ? d : v; } catch(e){ return d; } }
function lsSet(k, v){ try { localStorage.setItem("ukcs."+k, JSON.stringify(v)); } catch(e){} }

var Basket = {
  raw: function(){ return lsGet("basket2", []); },
  save: function(v){ lsSet("basket2", v); },
  count: function(){ return Basket.raw().reduce(function(n,l){ return n + l.qty; }, 0); },
  add: function(id, qty){
    var b = Basket.raw(), n = Number(qty) || 1, hit = null;
    b.forEach(function(l){ if (l.id === Number(id)) hit = l; });
    if (hit) hit.qty = Math.min(99, hit.qty + n); else b.push({ id:Number(id), qty:Math.min(99, n) });
    Basket.save(b); return Basket.count();
  },
  setQty: function(id, qty){
    var b = Basket.raw().map(function(l){ return l.id === Number(id) ? { id:l.id, qty:Math.max(0, Math.min(99, Number(qty)||0)) } : l; })
                        .filter(function(l){ return l.qty > 0; });
    Basket.save(b); return b;
  },
  remove: function(id){ Basket.save(Basket.raw().filter(function(l){ return l.id !== Number(id); })); },
  clear: function(){ Basket.save([]); },
  /* Drops any line whose product has vanished from the catalogue. */
  lines: function(){
    return Basket.raw().map(function(l){
      var p = byId(l.id); return p ? { p:p, qty:l.qty, line:p.price * l.qty } : null;
    }).filter(Boolean);
  },
  method: function(v){ if (v !== undefined) lsSet("delivery", v); return lsGet("delivery", "nextday"); },
  totals: function(methodId){
    var lines = Basket.lines();
    var goods = lines.reduce(function(s,l){ return s + l.line; }, 0);
    var saved = lines.reduce(function(s,l){ return s + (l.p.was ? (l.p.was - l.p.price) * l.qty : 0); }, 0);
    var m = DELIVERY.filter(function(d){ return d.id === (methodId || Basket.method()); })[0] || DELIVERY[1];
    var free = m.freeOver !== null && goods >= m.freeOver;
    var ship = free ? 0 : m.price;
    var total = goods + ship;
    return {
      lines:lines, count:lines.reduce(function(n,l){ return n + l.qty; }, 0),
      goods:goods, saved:saved, method:m, shipping:ship, shippingFree:free,
      toFreeDelivery: (m.freeOver !== null && goods < m.freeOver) ? m.freeOver - goods : 0,
      total:total, exVat:total / (1 + VAT_RATE), vat:total - total / (1 + VAT_RATE)
    };
  }
};

/* A plausible order history so the account pages have something to show. */
/* Cancel/return state a visitor sets during this demo — persisted so an order
   page keeps reflecting the choice after Confirm, the same pattern already
   used for the basket, wishlist and compare. */
var OrderState = {
  raw: function(){ return lsGet("orderstate", {}); },
  save: function(v){ lsSet("orderstate", v); },
  get: function(ref){ return OrderState.raw()[ref] || {}; },
  cancel: function(ref, reason){
    var s = OrderState.raw(); s[ref] = { cancelled:true, cancelReason: reason || null }; OrderState.save(s);
  },
  requestReturn: function(ref, itemIds, reason, note){
    var s = OrderState.raw(); s[ref] = { returnRequested:true, returnItems:itemIds, returnReason:reason || null, returnNote:note || null };
    OrderState.save(s);
  }
};
function orders(){
  var pick = function(ids){ return ids.map(byId).filter(Boolean); };
  var mk = function(ref, daysAgo, status, ids, qtys){
    var items = pick(ids).map(function(p,i){ return { p:p, qty:(qtys && qtys[i]) || 1 }; });
    var goods = items.reduce(function(s,it){ return s + it.p.price * it.qty; }, 0);
    var d = new Date(2026, 7, 26); d.setDate(d.getDate() - daysAgo);
    var o = { ref:ref, date:d.toISOString().slice(0,10), status:status, items:items,
             goods:goods, shipping:goods >= 75 ? 0 : 4.95, total:goods + (goods >= 75 ? 0 : 4.95) };
    var st = OrderState.get(ref);
    if (st.cancelled) o.status = "Cancelled";
    if (st.returnRequested) o.returnStatus = "Return requested";
    return o;
  };
  return [
    mk("UKCS-209930", 0,  "Processing",       [1], [1]),
    mk("UKCS-208841", 4,  "Out for delivery", [23, 29], [1, 2]),
    mk("UKCS-207115", 26, "Delivered",        [9, 17, 37]),
    mk("UKCS-204902", 91, "Delivered",        [52, 49], [2, 1])
  ];
}
var DEFAULT_ADDRESSES = [
  { id:1, label:"Home", name:"P. Roy", lines:["14 Ardwick Green North","Manchester","M12 6FZ"], phone:"07700 900412", default:true },
  { id:2, label:"Work", name:"P. Roy", lines:["Unit 7, Sharp Street","Manchester","M4 5DA"], phone:"0161 496 0112", default:false }
];
/* A real, editable address book — same localStorage-backed pattern as the
   basket, wishlist and compare list, seeded with the two sample addresses
   the first time it is read so existing pages keep working unchanged. */
var Addresses = {
  list: function(){
    var v = lsGet("addresses", null);
    if (v === null){ v = DEFAULT_ADDRESSES.slice(); Addresses.save(v); }
    return v;
  },
  save: function(v){ lsSet("addresses", v); },
  get: function(id){ return Addresses.list().filter(function(a){ return a.id === Number(id); })[0]; },
  add: function(a){
    var list = Addresses.list();
    var id = list.reduce(function(m,x){ return Math.max(m, x.id); }, 0) + 1;
    a.id = id; if (!list.length) a.default = true;
    if (a.default) list.forEach(function(x){ x.default = false; });
    list.push(a); Addresses.save(list); return a;
  },
  update: function(id, patch){
    var list = Addresses.list();
    if (patch.default) list.forEach(function(x){ x.default = false; });
    list = list.map(function(x){ return x.id === Number(id) ? Object.assign({}, x, patch, { id:x.id }) : x; });
    Addresses.save(list);
  },
  remove: function(id){
    var list = Addresses.list().filter(function(x){ return x.id !== Number(id); });
    if (list.length && !list.some(function(x){ return x.default; })) list[0].default = true;
    Addresses.save(list);
  }
};

function stockText(p){
  if (p.stockStatus === "in")  return { cls:"in",  text:"In stock — " + p.stock + " available" };
  if (p.stockStatus === "low") return { cls:"low", text:"Low stock — " + p.stock + " remaining" };
  return { cls:"out", text:"Backorder — due in 7–10 days" };
}


/* Delegated so it works no matter when a design renders its markup.
   Any element carrying data-add="<id>" becomes an add-to-basket control. */
function refreshBasketUI(){
  var t = Basket.totals();
  [].forEach.call(document.querySelectorAll("[data-basket-total]"), function(el){ el.textContent = money(t.total); });
  [].forEach.call(document.querySelectorAll("[data-basket-count]"), function(el){
    el.textContent = t.count; el.hidden = !t.count;
  });
}
function flash(msg){
  var el = document.getElementById("ukcs-flash");
  if (!el){
    el = document.createElement("div"); el.id = "ukcs-flash";
    el.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translate(-50%,14px);z-index:9999;"+
      "padding:12px 20px;font:600 13px/1 system-ui,sans-serif;border-radius:8px;opacity:0;transition:.2s;"+
      "background:#111;color:#fff;box-shadow:0 10px 30px -10px rgba(0,0,0,.5);pointer-events:none;max-width:88vw";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(function(){ el.style.opacity = "1"; el.style.transform = "translate(-50%,0)"; });
  clearTimeout(flash._t);
  flash._t = setTimeout(function(){ el.style.opacity = "0"; el.style.transform = "translate(-50%,14px)"; }, 1800);
}

/* ---------------- wishlist and compare ----------------
   Both persist to localStorage under the same keys account.html already
   reads (S.wish / S.compare style keys), so wiring these up here makes every
   design's account page and D's home page agree — nobody has to re-solve
   this per design later. */
var Wishlist = {
  raw: function(){ return lsGet("wish", []); },
  save: function(v){ lsSet("wish", v); },
  has: function(id){ return Wishlist.raw().indexOf(Number(id)) > -1; },
  toggle: function(id){
    id = Number(id);
    var arr = Wishlist.raw(), i = arr.indexOf(id);
    if (i > -1) arr.splice(i, 1); else arr.push(id);
    Wishlist.save(arr);
    return Wishlist.has(id);
  },
  count: function(){ return Wishlist.raw().length; },
  products: function(){ return Wishlist.raw().map(byId).filter(Boolean); }
};
var COMPARE_MAX = 4;
var Compare = {
  raw: function(){ return lsGet("compare", []); },
  save: function(v){ lsSet("compare", v); },
  has: function(id){ return Compare.raw().indexOf(Number(id)) > -1; },
  toggle: function(id){
    id = Number(id);
    var arr = Compare.raw(), i = arr.indexOf(id);
    if (i > -1) { arr.splice(i, 1); Compare.save(arr); return { added:false, full:false }; }
    if (arr.length >= COMPARE_MAX) return { added:false, full:true };
    arr.push(id); Compare.save(arr); return { added:true, full:false };
  },
  remove: function(id){ Compare.save(Compare.raw().filter(function(x){ return x !== Number(id); })); },
  clear: function(){ Compare.save([]); },
  count: function(){ return Compare.raw().length; },
  products: function(){ return Compare.raw().map(byId).filter(Boolean); }
};
function refreshWishlistUI(){
  var n = Wishlist.count();
  [].forEach.call(document.querySelectorAll("[data-wishlist-count]"), function(el){ el.textContent = n; el.hidden = !n; });
  [].forEach.call(document.querySelectorAll("[data-wish]"), function(el){
    var on = Wishlist.has(el.dataset.wish);
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
    var lbl = el.querySelector("[data-wish-label]");
    if (lbl) lbl.textContent = on ? "Saved" : "Wishlist";
  });
}
/* A floating tray that shows itself on any page once something is queued for
   compare — self-contained (styles inlined) so it works before a design's own
   stylesheet has to know anything about it. */
function ensureCompareTray(){
  if (document.getElementById("ukcs-cmp-tray")) return;
  var css = document.createElement("style");
  css.textContent =
    "#ukcs-cmp-tray{position:fixed;left:16px;right:16px;bottom:16px;z-index:9998;background:#111;color:#fff;"+
    "border-radius:12px;box-shadow:0 20px 50px -20px rgba(0,0,0,.55);padding:12px 14px;display:none;"+
    "align-items:center;gap:14px;font:14px/1.3 system-ui,sans-serif;max-width:760px;margin:0 auto}"+
    "#ukcs-cmp-tray.on{display:flex}"+
    "#ukcs-cmp-tray .lbl{font-weight:700;white-space:nowrap}"+
    "#ukcs-cmp-tray .items{display:flex;gap:6px;flex:1;overflow-x:auto}"+
    "#ukcs-cmp-tray .chip{background:rgba(255,255,255,.12);border-radius:7px;padding:6px 10px;white-space:nowrap;font-size:12.5px;display:flex;gap:7px;align-items:center}"+
    "#ukcs-cmp-tray .chip button{color:#aaa;font-size:14px;line-height:1;background:none;border:0}"+
    "#ukcs-cmp-tray .chip button:hover{color:#fff}"+
    "#ukcs-cmp-tray a.go{background:#fff;color:#111;border-radius:7px;padding:8px 14px;font-weight:700;font-size:13px;white-space:nowrap;text-decoration:none}"+
    "#ukcs-cmp-tray a.go.off{opacity:.4;pointer-events:none}"+
    "#ukcs-cmp-tray button.clear{color:#aaa;background:none;border:0;font-size:12.5px;white-space:nowrap;text-decoration:underline}";
  document.head.appendChild(css);
  var el = document.createElement("div");
  el.id = "ukcs-cmp-tray";
  document.body.appendChild(el);
}
function refreshCompareUI(){
  ensureCompareTray();
  var items = Compare.products();
  var tray = document.getElementById("ukcs-cmp-tray");
  tray.classList.toggle("on", items.length > 0);
  tray.innerHTML = '<span class="lbl">Compare (' + items.length + '/' + COMPARE_MAX + ')</span>' +
    '<span class="items">' + items.map(function(p){
      return '<span class="chip">' + esc(p.name.length > 26 ? p.name.slice(0,24) + "…" : p.name) +
        '<button data-cmp-remove="' + p.id + '">×</button></span>';
    }).join("") + '</span>' +
    '<button class="clear" id="ukcs-cmp-clear">Clear</button>' +
    '<a class="go' + (items.length < 2 ? " off" : "") + '" href="' + url("compare") + '">Compare →</a>';
  [].forEach.call(document.querySelectorAll("[data-compare]"), function(el){
    var on = Compare.has(el.dataset.compare);
    el.classList.toggle("on", on);
    var lbl = el.querySelector("[data-compare-label]");
    if (lbl) lbl.textContent = on ? "In compare" : "Compare";
  });
}
document.addEventListener("click", function(e){
  var rm = e.target.closest("[data-cmp-remove]");
  if (rm){ Compare.remove(rm.dataset.cmpRemove); refreshCompareUI(); return; }
  if (e.target.id === "ukcs-cmp-clear"){ Compare.clear(); refreshCompareUI(); return; }
});

/* ---------------- quick view ----------------
   A genuine glance-and-add overlay, not a second link to the same page.
   Self-contained (styles + markup injected on demand) so any design gets it
   just by putting data-quickview="<id>" on a card's quick-view control —
   the same shared-first approach as the compare tray and cookie banner. */
function ensureQuickView(){
  if (document.getElementById("ukcs-qv")) return;
  var css = document.createElement("style");
  css.textContent =
    "#ukcs-qv{position:fixed;inset:0;z-index:9996;background:rgba(10,10,12,.6);display:none;align-items:center;justify-content:center;padding:24px}"+
    "#ukcs-qv.on{display:flex}"+
    "#ukcs-qv .qv-panel{background:#fff;color:#111;border-radius:14px;max-width:840px;width:100%;max-height:88vh;overflow-y:auto;"+
      "box-shadow:0 30px 70px -20px rgba(0,0,0,.5);position:relative;font:15px/1.5 system-ui,sans-serif}"+
    "#ukcs-qv .qv-close{position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:99px;background:#f2f2f2;"+
      "color:#555;font-size:20px;line-height:1;border:0;cursor:pointer;z-index:2}"+
    "#ukcs-qv .qv-close:hover{background:#e5e5e5;color:#111}"+
    "#ukcs-qv .qv-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}"+
    "#ukcs-qv .qv-fig{background:linear-gradient(180deg,#fafafa,#eee);display:grid;place-items:center;padding:40px;border-radius:14px 0 0 14px;color:#3d4a5c}"+
    "#ukcs-qv .qv-fig svg{width:100%;max-width:220px;height:auto}"+
    "#ukcs-qv .qv-body{padding:32px 30px}"+
    "#ukcs-qv .qv-brand{font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:#2454c7;text-decoration:none}"+
    "#ukcs-qv h2{margin:8px 0 10px;font-size:21px;font-weight:700;line-height:1.3}"+
    "#ukcs-qv .qv-rate{font-size:13px;color:#666;margin-bottom:14px;display:flex;align-items:center;gap:8px}"+
    "#ukcs-qv .qv-rate i{color:#e0a930;font-style:normal;letter-spacing:1px}"+
    "#ukcs-qv .qv-price{display:flex;align-items:baseline;gap:10px;margin-bottom:4px}"+
    "#ukcs-qv .qv-price b{font-size:26px;font-weight:800}"+
    "#ukcs-qv .qv-price s{color:#999;font-size:14px}"+
    "#ukcs-qv .qv-vat{font-size:12px;color:#888;margin-bottom:16px}"+
    "#ukcs-qv .qv-stock{font-size:13px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:7px}"+
    "#ukcs-qv .qv-stock i{width:7px;height:7px;border-radius:99px;background:currentColor}"+
    "#ukcs-qv .qv-specs{list-style:none;margin:0 0 20px;padding:0;display:grid;gap:7px;border-top:1px solid #eee;padding-top:14px}"+
    "#ukcs-qv .qv-specs li{display:grid;grid-template-columns:130px 1fr;gap:10px;font-size:13px}"+
    "#ukcs-qv .qv-specs span{color:#888}"+
    "#ukcs-qv .qv-specs b{color:#111;font-weight:600}"+
    "#ukcs-qv .qv-actions{display:flex;gap:10px;margin-bottom:14px}"+
    "#ukcs-qv .qv-add{flex:1;background:#111;color:#fff;border:0;border-radius:8px;padding:13px;font-weight:700;font-size:14px;cursor:pointer}"+
    "#ukcs-qv .qv-add:hover{background:#000}"+
    "#ukcs-qv .qv-add[disabled]{background:#ccc;cursor:not-allowed}"+
    "#ukcs-qv .qv-icon{width:46px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#555;cursor:pointer;display:grid;place-items:center}"+
    "#ukcs-qv .qv-icon:hover{border-color:#111;color:#111}"+
    "#ukcs-qv .qv-icon.on{background:#111;color:#fff;border-color:#111}"+
    "#ukcs-qv .qv-full{display:block;text-align:center;font-size:13px;color:#2454c7;text-decoration:underline}"+
    "@media(max-width:640px){#ukcs-qv .qv-grid{grid-template-columns:1fr}#ukcs-qv .qv-fig{border-radius:14px 14px 0 0;padding:26px}}";
  document.head.appendChild(css);
  var el = document.createElement("div");
  el.id = "ukcs-qv";
  el.innerHTML = '<div class="qv-panel" role="dialog" aria-modal="true"><button class="qv-close" id="ukcs-qv-close" aria-label="Close">&times;</button><div id="ukcs-qv-content"></div></div>';
  document.body.appendChild(el);
  el.addEventListener("click", function(e){ if (e.target === el) closeQuickView(); });
  document.getElementById("ukcs-qv-close").addEventListener("click", closeQuickView);
}
function closeQuickView(){
  var el = document.getElementById("ukcs-qv");
  if (el) el.classList.remove("on");
  document.body.classList.remove("lock");
}
function openQuickView(id){
  var p = byId(id); if (!p) return;
  ensureQuickView();
  var st = stockText(p);
  var keys = Object.keys(p.specs).slice(0, 6);
  var content = document.getElementById("ukcs-qv-content");
  content.innerHTML =
    '<div class="qv-grid">'+
      '<div class="qv-fig"><svg viewBox="0 0 64 44"><use href="#'+p.icon+'"/></svg></div>'+
      '<div class="qv-body">'+
        '<a class="qv-brand" href="'+url("brand",{b:p.brand})+'">'+esc(p.brand)+'</a>'+
        '<h2>'+esc(p.name)+'</h2>'+
        '<div class="qv-rate"><i>'+stars(p.rating)+'</i><span>'+p.rating+' · '+p.reviews.toLocaleString("en-GB")+' reviews</span></div>'+
        '<div class="qv-price"><b>'+money(p.price)+'</b>'+(p.was ? '<s>'+money(p.was)+'</s>' : "")+'</div>'+
        '<div class="qv-vat">'+exVat(p.price)+' ex. VAT</div>'+
        '<div class="qv-stock" style="color:'+(st.cls==="in"?"#0a7a52":st.cls==="low"?"#a06a05":"#c0392b")+'"><i></i>'+esc(st.text)+'</div>'+
        '<ul class="qv-specs">'+keys.map(function(k){ return '<li><span>'+esc(k)+'</span><b>'+esc(p.specs[k])+'</b></li>'; }).join("")+'</ul>'+
        '<div class="qv-actions">'+
          '<button class="qv-add" data-qv-add="'+p.id+'"'+(st.cls==="out"?" disabled":"")+'>'+(st.cls==="out"?"Backorder":"Add to basket")+'</button>'+
          '<button class="qv-icon'+(Wishlist.has(p.id)?" on":"")+'" data-wish="'+p.id+'" title="Wishlist">'+
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z"/></svg></button>'+
          '<button class="qv-icon'+(Compare.has(p.id)?" on":"")+'" data-compare="'+p.id+'" title="Compare">'+
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v16M6 8h12M4 16a3 3 0 0 0 6 0l-3-6zM14 16a3 3 0 0 0 6 0l-3-6z"/></svg></button>'+
        '</div>'+
        '<a class="qv-full" href="'+url("product",{id:p.id})+'">See full details, specification and reviews →</a>'+
      '</div>'+
    '</div>';
  document.getElementById("ukcs-qv").classList.add("on");
  document.body.classList.add("lock");
}
document.addEventListener("click", function(e){
  var qv = e.target.closest("[data-quickview]");
  if (qv){ e.preventDefault(); openQuickView(qv.dataset.quickview); return; }
  var add = e.target.closest("#ukcs-qv .qv-add");
  if (add && !add.disabled){
    var p = byId(add.dataset.qvAdd); if (!p) return;
    Basket.add(p.id, 1); refreshBasketUI();
    flash("Added — " + (p.name.length > 42 ? p.name.slice(0,40) + "…" : p.name));
  }
  /* Wishlist and compare icons inside the modal use the same plain
     data-wish / data-compare attributes as everywhere else on purpose — the
     existing site-wide handlers (and refreshWishlistUI/refreshCompareUI,
     which already update *every* matching element in the document) handle
     them for free. A modal-specific handler here would double-fire
     alongside those and toggle the state right back. */
});
document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeQuickView(); });

document.addEventListener("click", function(e){
  var b = e.target.closest("[data-add]");
  if (!b) return;
  e.preventDefault();
  var p = byId(b.dataset.add); if (!p) return;
  if (p.stockStatus === "backorder"){ flash("Backorder — we'll take payment when it ships"); }
  var qtyEl = document.querySelector("[data-qty-input]");
  var qty = b.dataset.qty === "input" && qtyEl ? (parseInt(qtyEl.value, 10) || 1) : 1;
  Basket.add(p.id, qty);
  refreshBasketUI();
  flash("Added — " + (p.name.length > 42 ? p.name.slice(0,40) + "…" : p.name));
});
document.addEventListener("click", function(e){
  var buy = e.target.closest("[data-buy]");
  if (buy){
    e.preventDefault();
    var pb = byId(buy.dataset.buy); if (!pb || pb.stockStatus === "backorder") return;
    var qtyElB = document.querySelector("[data-qty-input]");
    var qtyB = buy.dataset.qty === "input" && qtyElB ? (parseInt(qtyElB.value, 10) || 1) : 1;
    Basket.add(pb.id, qtyB);
    location.href = url("checkout");
    return;
  }
  var w = e.target.closest("[data-wish]");
  if (w){
    e.preventDefault();
    var pw = byId(w.dataset.wish); if (!pw) return;
    var nowSaved = Wishlist.toggle(pw.id);
    refreshWishlistUI();
    flash(nowSaved ? "Saved to wishlist" : "Removed from wishlist");
    return;
  }
  var c = e.target.closest("[data-compare]");
  if (c){
    e.preventDefault();
    var pc = byId(c.dataset.compare); if (!pc) return;
    var r = Compare.toggle(pc.id);
    refreshCompareUI();
    if (r.full) flash("Compare holds up to " + COMPARE_MAX + " products");
    else flash(r.added ? "Added to compare" : "Removed from compare");
    return;
  }
});
document.addEventListener("DOMContentLoaded", refreshBasketUI);

/* Cookie consent — a real, working banner rather than a mockup screenshot,
   since "does the consent flow actually gate anything" is exactly the kind
   of thing a client review should be able to click through. Content pages
   (Cookie Policy etc.) are being rolled out design by design, same as the
   order pages; the "Manage preferences" link only appears once this design
   has one to link to. */
var CONTENT_PAGES_ROLLED_OUT = ["05"];
function consentGiven(){ return lsGet("consent", null) !== null; }
function injectConsentBanner(){
  if (consentGiven() || document.getElementById("ukcs-consent")) return;
  var css = document.createElement("style");
  css.textContent =
    "#ukcs-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9997;background:#111;color:#fff;"+
    "border-radius:12px;box-shadow:0 20px 50px -20px rgba(0,0,0,.55);padding:18px 20px;"+
    "display:flex;align-items:center;gap:18px;font:14px/1.5 system-ui,sans-serif;max-width:820px;margin:0 auto;flex-wrap:wrap}"+
    "#ukcs-consent p{margin:0;flex:1;min-width:220px;color:#d4d4d8}"+
    "#ukcs-consent a{color:#fff;text-decoration:underline}"+
    "#ukcs-consent .btns{display:flex;gap:8px;flex-wrap:wrap}"+
    "#ukcs-consent button{border-radius:7px;padding:9px 16px;font-weight:700;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,.3);background:none;color:#fff;font-family:inherit}"+
    "#ukcs-consent button.accept{background:#fff;color:#111;border-color:#fff}";
  document.head.appendChild(css);
  var el = document.createElement("div");
  el.id = "ukcs-consent";
  var manage = CONTENT_PAGES_ROLLED_OUT.indexOf(design) > -1
    ? ' <a href="' + url("cookiePolicy") + '">Manage preferences</a>.' : "";
  el.innerHTML =
    '<p>We use cookies to run this site and, with your permission, to understand how it is used.' + manage + '</p>' +
    '<div class="btns"><button id="ukcs-consent-reject">Reject non-essential</button>' +
    '<button class="accept" id="ukcs-consent-accept">Accept all</button></div>';
  document.body.appendChild(el);
  document.getElementById("ukcs-consent-accept").addEventListener("click", function(){ lsSet("consent", "all"); el.remove(); });
  document.getElementById("ukcs-consent-reject").addEventListener("click", function(){ lsSet("consent", "essential"); el.remove(); });
}
document.addEventListener("DOMContentLoaded", injectConsentBanner);

document.addEventListener("DOMContentLoaded", refreshWishlistUI);
document.addEventListener("DOMContentLoaded", refreshCompareUI);

root.Shop = {
  all:P, byId:byId, related:related, alsoBought:alsoBought, recommended:recommended,
  recent:recent, pushRecent:pushRecent, recentProducts:recentProducts,
  brands:brands, byBrand:byBrand, complement:COMPLEMENT, compatible:compatible,
  money:money, exVat:exVat, stars:stars, esc:esc, uniq:uniq, param:param, url:url,
  stockText:stockText, design:design, tree:tree, countIn:countIn, CAT_ORDER:CAT_ORDER,
  Basket:Basket, refreshBasketUI:refreshBasketUI, flash:flash, DELIVERY:DELIVERY, VAT_RATE:VAT_RATE, orders:orders, Addresses:Addresses, OrderState:OrderState,
  BLOG_POSTS:BLOG_POSTS, BLOG_AUTHORS:BLOG_AUTHORS,
  CONTENT_PAGES_ROLLED_OUT:CONTENT_PAGES_ROLLED_OUT,
  Wishlist:Wishlist, Compare:Compare, COMPARE_MAX:COMPARE_MAX, refreshWishlistUI:refreshWishlistUI, refreshCompareUI:refreshCompareUI
};
})(window);
