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
