/* Page data preparation, shared by all four designs.
   Each design renders this however it likes; nobody re-derives the data. */
(function (root) {
"use strict";
var S = root.Shop;

function notFound(what){
  document.body.innerHTML = '<div style="padding:80px 24px;text-align:center;font:16px/1.6 system-ui">' +
    '<h1 style="margin:0 0 10px">' + what + ' not found</h1>' +
    '<p style="margin:0 0 20px;opacity:.7">That link points at something we do not stock.</p>' +
    '<a href="' + S.url("home") + '" style="text-decoration:underline">Back to the home page</a></div>';
}

var Pages = {

  category: function(){
    var cat = S.param("cat"), sub = S.param("sub");
    var items = S.all.filter(function(p){
      if (sub) return p.subcategory === sub;
      if (cat) return p.category === cat;
      return true;
    });
    if (!items.length) return notFound(sub || cat ? "Category" : "Products");
    var label = sub || cat || "All products";
    var parent = sub ? (items[0] && items[0].category) : null;
    var bySub = {};
    (cat ? S.all.filter(function(p){ return p.category === cat; }) : items)
      .forEach(function(p){ (bySub[p.subcategory] = bySub[p.subcategory] || []).push(p); });
    var crumbs = [{ label:"Home", href:S.url("home") }];
    if (parent) crumbs.push({ label:parent, href:S.url("category",{cat:parent}) });
    crumbs.push({ label:label });
    return {
      label:label, cat:cat, sub:sub, parent:parent, items:items, bySub:bySub,
      subcats: Object.keys(bySub).sort(),
      brands: S.uniq(items.map(function(p){ return p.brand; })).sort(),
      min: Math.min.apply(null, items.map(function(p){ return p.price; })),
      max: Math.max.apply(null, items.map(function(p){ return p.price; })),
      recommended: S.recommended(4, items.map(function(p){ return p.id; })),
      crumbs: crumbs
    };
  },

  basket: function(){
    var t = S.Basket.totals();
    var ids = t.lines.map(function(l){ return l.p.id; });
    /* Cross-sell from what is actually in the basket, not a generic rail. */
    var withBasket = [];
    t.lines.forEach(function(l){
      S.alsoBought(l.p, 3).forEach(function(x){
        if (ids.indexOf(x.id) === -1 && withBasket.indexOf(x) === -1) withBasket.push(x);
      });
    });
    return {
      t: t, empty: !t.lines.length,
      goesWith: withBasket.slice(0, 4),
      recommended: S.recommended(4, ids),
      recentlyViewed: S.recentProducts(4),
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"Basket" } ]
    };
  },

  checkout: function(){
    var t = S.Basket.totals();
    return {
      t: t, empty: !t.lines.length,
      delivery: S.DELIVERY, chosen: S.Basket.method(),
      address: S.ADDRESSES.filter(function(a){ return a.default; })[0] || S.ADDRESSES[0],
      addresses: S.ADDRESSES,
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"Basket", href:S.url("basket") }, { label:"Checkout" } ]
    };
  },

  account: function(){
    var o = S.orders();
    var wishIds = (function(){ try { return JSON.parse(localStorage.getItem("ukcs.wish")) || []; } catch(e){ return []; } })();
    return {
      tab: S.param("tab") || "overview",
      orders: o,
      spend: o.reduce(function(s,x){ return s + x.total; }, 0),
      wishlist: wishIds.map(S.byId).filter(Boolean),
      recentlyViewed: S.recentProducts(4),
      addresses: S.ADDRESSES,
      basketCount: S.Basket.count(),
      recommended: S.recommended(4, []),
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"My account" } ]
    };
  },

  product: function(){
    var id = S.param("id");
    /* No id at all is a legitimate entry point (demo default); a bad id is not —
       silently showing a different product would mislead. */
    var p = id === null ? S.all[0] : S.byId(id);
    if (!p) return notFound("Product");
    var viewedBefore = S.recentProducts(6, p.id);   // read before we record this visit
    S.pushRecent(p.id);
    return {
      p: p,
      related: S.related(p, 4),
      alsoBought: S.alsoBought(p, 4),
      recommended: S.recommended(4, [p.id]),
      recentlyViewed: viewedBefore,
      brand: S.brands().filter(function(b){ return b.brand === p.brand; })[0],
      crumbs: [
        { label:"Home", href:S.url("home") },
        { label:p.category, href:S.url("home") },
        { label:p.subcategory, href:S.url("home") },
        { label:p.name }
      ]
    };
  },

  brand: function(){
    var name = S.param("b");
    var all = S.brands();
    var b = all.filter(function(x){ return x.brand === name; })[0];
    if (!b) return notFound("Brand");
    var items = b.items.slice().sort(function(a,c){ return c.sold - a.sold; });
    var bySub = {};
    items.forEach(function(x){ (bySub[x.subcategory] = bySub[x.subcategory] || []).push(x); });
    return {
      b: b, items: items, bySub: bySub,
      subcats: Object.keys(bySub).sort(function(a,c){ return bySub[c].length - bySub[a].length; }),
      deals: items.filter(function(x){ return x.was; }).sort(function(a,c){ return c.was - c.price - (a.was - a.price); }).slice(0,4),
      newest: items.slice().sort(function(a,c){ return a.added < c.added ? 1 : -1; }).slice(0,4),
      recommended: S.recommended(4, items.map(function(x){ return x.id; })),
      siblings: all.filter(function(x){ return x.brand !== b.brand && x.cats.some(function(c){ return b.cats.indexOf(c) > -1; }); }).slice(0,8),
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"Brands", href:S.url("brands") }, { label:b.brand } ]
    };
  },

  brands: function(){
    var all = S.brands();
    var letters = {};
    all.slice().sort(function(a,b){ return a.brand.localeCompare(b.brand); }).forEach(function(b){
      var L = b.brand[0].toUpperCase();
      if (!/[A-Z]/.test(L)) L = "#";
      (letters[L] = letters[L] || []).push(b);
    });
    return {
      all: all,
      featured: all.slice(0, 8),
      letters: letters,
      keys: Object.keys(letters).sort(),
      totalProducts: S.all.length,
      recommended: S.recommended(4, []),
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"Brands" } ]
    };
  }
};

root.Pages = Pages;
})(window);
