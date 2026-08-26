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
  var file = { home:"", product:"-product", brand:"-brand", brands:"-brands" }[kind];
  var name = kind === "home" ? design + HOME_SUFFIX[design] : design + file;
  return name + ".html" + (s ? "?" + s : "");
}
var HOME_SUFFIX = { "01":"-highstreet", "02":"-overdrive", "03":"-atelier", "04":"-spec-index" };

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

function stockText(p){
  if (p.stockStatus === "in")  return { cls:"in",  text:"In stock — " + p.stock + " available" };
  if (p.stockStatus === "low") return { cls:"low", text:"Low stock — " + p.stock + " remaining" };
  return { cls:"out", text:"Backorder — due in 7–10 days" };
}

root.Shop = {
  all:P, byId:byId, related:related, alsoBought:alsoBought, recommended:recommended,
  recent:recent, pushRecent:pushRecent, recentProducts:recentProducts,
  brands:brands, byBrand:byBrand, complement:COMPLEMENT, compatible:compatible,
  money:money, exVat:exVat, stars:stars, esc:esc, uniq:uniq, param:param, url:url,
  stockText:stockText, design:design, tree:tree, countIn:countIn, CAT_ORDER:CAT_ORDER
};
})(window);
