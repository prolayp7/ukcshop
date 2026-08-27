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
    var cat = S.param("cat"), sub = S.param("sub"), featured = S.param("featured");
    var items = S.all.filter(function(p){
      if (featured) return !!p.featured;
      if (sub) return p.subcategory === sub;
      if (cat) return p.category === cat;
      return true;
    });
    if (!items.length) return notFound(featured ? "Featured products" : sub || cat ? "Category" : "Products");
    var label = featured ? "Featured products" : sub || cat || "All products";
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

  orderDetails: function(){
    var ref = S.param("ref");
    var order = S.orders().filter(function(o){ return o.ref === ref; })[0];
    if (!order) return notFound("Order");
    var addr = S.ADDRESSES.filter(function(a){ return a.default; })[0] || S.ADDRESSES[0];
    return {
      order: order, address: addr, method: S.DELIVERY[1],
      canCancel: order.status === "Processing",
      canReturn: order.status === "Delivered" && !S.OrderState.get(order.ref).returnRequested,
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"My account", href:S.url("account",{tab:"orders"}) }, { label:order.ref } ]
    };
  },

  orderCancel: function(){
    var ref = S.param("ref");
    var order = S.orders().filter(function(o){ return o.ref === ref; })[0];
    if (!order) return notFound("Order");
    return {
      order: order, alreadyCancelled: S.OrderState.get(ref).cancelled,
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"My account", href:S.url("account",{tab:"orders"}) },
                { label:order.ref, href:S.url("orderDetails",{ref:ref}) }, { label:"Cancel" } ]
    };
  },

  orderReturn: function(){
    var ref = S.param("ref");
    var order = S.orders().filter(function(o){ return o.ref === ref; })[0];
    if (!order) return notFound("Order");
    return {
      order: order, alreadyRequested: S.OrderState.get(ref).returnRequested,
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"My account", href:S.url("account",{tab:"orders"}) },
                { label:order.ref, href:S.url("orderDetails",{ref:ref}) }, { label:"Return" } ]
    };
  },

  blog: function(){
    var cat = S.param("cat"), tag = S.param("tag"), authorSlug = S.param("author"), month = S.param("month"),
        q = (S.param("q")||"").toLowerCase().trim();
    var posts = S.BLOG_POSTS.slice().sort(function(a,b){ return a.date < b.date ? 1 : -1; });
    var authorOf = function(p){ return S.BLOG_AUTHORS.filter(function(a){ return a.slug === p.author; })[0]; };
    var filtered = posts.filter(function(p){
      if (cat && p.category !== cat) return false;
      if (tag && p.tags.indexOf(tag) === -1) return false;
      if (authorSlug && p.author !== authorSlug) return false;
      if (month && p.date.slice(0,7) !== month) return false;
      if (q && (p.title + " " + p.excerpt + " " + p.body.join(" ")).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    var byMonth = {};
    posts.forEach(function(p){
      var key = p.date.slice(0,7);
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    return {
      posts: filtered.map(function(p){ return { post:p, author:authorOf(p) }; }),
      empty: filtered.length === 0,
      cat: cat, tag: tag, authorSlug: authorSlug, month: month, q: q,
      categories: S.uniq(posts.map(function(p){ return p.category; })),
      tags: S.uniq(posts.reduce(function(a,p){ return a.concat(p.tags); }, [])).sort(),
      months: Object.keys(byMonth).sort().reverse().map(function(k){ return { key:k, count:byMonth[k] }; }),
      recommended: S.recommended(4, []),
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"Blog" } ]
    };
  },

  blogPost: function(){
    var slug = S.param("slug");
    var post = S.BLOG_POSTS.filter(function(p){ return p.slug === slug; })[0];
    if (!post) return notFound("Article");
    var author = S.BLOG_AUTHORS.filter(function(a){ return a.slug === post.author; })[0];
    var related = S.BLOG_POSTS.filter(function(p){
      return p.slug !== post.slug && (p.category === post.category || p.tags.some(function(t){ return post.tags.indexOf(t) > -1; }));
    }).slice(0, 3);
    if (related.length < 3){
      S.BLOG_POSTS.forEach(function(p){
        if (related.length < 3 && p.slug !== post.slug && related.indexOf(p) === -1) related.push(p);
      });
    }
    return {
      post: post, author: author, related: related,
      recommended: S.recommended(4, []),
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"Blog", href:S.url("blog") },
                { label:post.category, href:S.url("blog",{cat:post.category}) }, { label:post.title } ]
    };
  },

  blogAuthor: function(){
    var slug = S.param("slug");
    var author = S.BLOG_AUTHORS.filter(function(a){ return a.slug === slug; })[0];
    if (!author) return notFound("Author");
    var posts = S.BLOG_POSTS.filter(function(p){ return p.author === slug; }).sort(function(a,b){ return a.date < b.date ? 1 : -1; });
    return {
      author: author, posts: posts,
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"Blog", href:S.url("blog") }, { label:author.name } ]
    };
  },

  deals: function(){
    var view = S.param("view") || "all";
    var all = S.all.filter(function(p){ return p.was; });
    var items = view === "clearance" ? all.filter(function(p){ return p.clearance; }) : all;
    return {
      items: items, view: view,
      clearanceCount: all.filter(function(p){ return p.clearance; }).length,
      allCount: all.length,
      recommended: S.recommended(4, items.map(function(p){ return p.id; })),
      crumbs: [ { label:"Home", href:S.url("home") }, { label: view === "clearance" ? "Clearance" : "Deals & offers" } ]
    };
  },

  compare: function(){
    var products = S.Compare.products();
    return {
      products: products,
      empty: products.length === 0,
      needsMore: products.length === 1,
      recommended: S.recommended(4, products.map(function(x){ return x.id; })),
      crumbs: [ { label:"Home", href:S.url("home") }, { label:"Compare" } ]
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
