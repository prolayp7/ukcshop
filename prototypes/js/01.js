/* Design A — Highstreet. Renders the shared page data in this design's language. */
(function(){
"use strict";
var S = Shop, E = S.esc, M = S.money;
var el = function(s){ return document.querySelector(s); };
function ic(id, w, h, cls){ return '<svg class="'+(cls||'')+'" width="'+w+'" height="'+(h||w)+'"><use href="#'+id+'"/></svg>'; }
function icv(id, w, h){ return '<svg viewBox="0 0 64 44" style="width:'+w+'px;height:'+h+'px"><use href="#'+id+'"/></svg>'; }

/* ---------- chrome ---------- */
function header(){
  var tree = S.tree();
  var mega = tree.slice(0,2).map(function(t){
    var cols = [], per = Math.ceil(t.subs.length/4);
    for (var i=0;i<t.subs.length;i+=per) cols.push(t.subs.slice(i,i+per));
    return '<div class="has-mega"><a class="top" href="'+S.url("home")+'">'+E(t.category)+' '+ic("i-chev",14,14)+'</a>'+
      '<div class="mega"><div class="wrap"><div class="grid">'+
      cols.map(function(c,n){
        return '<div><h4>'+["Core","Storage","Power &amp; cases","Cooling"][n]+'</h4><ul>'+
          c.map(function(s2){ return '<li><a href="'+S.url("home")+'">'+E(s2)+'</a></li>'; }).join("")+'</ul></div>';
      }).join("")+
      '<div class="promo"><span>Build service</span><p>We\'ll assemble, cable-manage and stress-test your parts for £89.</p><a href="#">Learn more '+ic("i-arr",14,14)+'</a></div>'+
      '</div></div></div></div>';
  }).join("");
  var rest = tree.slice(2).map(function(t){ return '<a class="top" href="'+S.url("home")+'">'+E(t.category)+'</a>'; }).join("");

  return '<div class="util"><div class="wrap">'+
    '<a href="#">Track my order</a><a href="#">Business &amp; Education</a><a href="#">Trade accounts</a>'+
    '<div class="sep"><span><strong>4.8/5</strong> from 12,480 reviews</span><a href="#">Help centre</a><a href="#">£ GBP · Inc. VAT</a></div>'+
    '</div></div>'+
  '<header class="mast"><div class="wrap">'+
    '<a class="logo" href="'+S.url("home")+'"><span class="mark">UK</span><span><b>UK Computer Shop</b><span>Components &amp; Systems</span></span></a>'+
    '<div><form class="search" role="search">'+
      '<select aria-label="Search category"><option>All categories</option>'+
      S.CAT_ORDER.map(function(c){ return '<option>'+E(c)+'</option>'; }).join("")+'</select>'+
      '<input type="search" placeholder="Search by name, SKU, MPN, brand or specification…">'+
      '<button type="submit">'+ic("i-search",17,17)+'Search</button></form>'+
      '<div class="hints"><b>Popular:</b><a href="#">RTX 5080</a><a href="#">DDR5 32GB</a><a href="#">9800X3D</a><a href="#">1440p 240Hz</a></div></div>'+
    '<div class="mast-actions">'+
      '<a class="act" href="#"><span class="ic">'+ic("i-heart",22,22)+'</span><span><span class="lbl">Saved</span><span class="val">Wishlist</span></span></a>'+
      '<a class="act" href="#"><span class="ic">'+ic("i-user",22,22)+'</span><span><span class="lbl">Sign in</span><span class="val">My account</span></span></a>'+
      '<a class="act" href="#"><span class="ic">'+ic("i-bag",22,22)+'<span class="badge">3</span></span><span><span class="lbl">Basket</span><span class="val">£1,489.97</span></span></a>'+
    '</div></div></header>'+
  '<nav class="nav"><div class="wrap">'+mega+rest+
    '<a class="top" href="'+S.url("brands")+'">Brands</a><a class="top hot" href="#">Deals</a>'+
    '<div class="right">'+ic("i-truck",16,16)+'<span>Order within <b>4h 12m</b> for next-day delivery</span></div>'+
  '</div></nav>';
}
function footer(){
  return '<footer><div class="wrap"><div class="fgrid">'+
    '<div><a class="logo" href="'+S.url("home")+'" style="margin-bottom:14px"><span class="mark">UK</span><span><b style="color:#fff">UK Computer Shop</b><span style="color:#7fa3c7">Components &amp; Systems</span></span></a>'+
    '<p style="margin:0 0 16px;max-width:300px">Independent UK retailer since 2009. Warehouse and workshop in Manchester, showroom open Mon–Sat.</p>'+
    '<div class="fnews"><input placeholder="Email address for deals"><button>Subscribe</button></div></div>'+
    '<div><h4>Shop</h4><ul>'+S.CAT_ORDER.map(function(c){ return '<li><a href="'+S.url("home")+'">'+E(c)+'</a></li>'; }).join("")+'</ul></div>'+
    '<div><h4>Services</h4><ul><li><a href="#">PC configurator</a></li><li><a href="#">Build &amp; test service</a></li><li><a href="#">Repairs &amp; upgrades</a></li><li><a href="#">Trade-in</a></li></ul></div>'+
    '<div><h4>Support</h4><ul><li><a href="#">Track my order</a></li><li><a href="#">Delivery &amp; returns</a></li><li><a href="#">Warranty &amp; RMA</a></li><li><a href="#">Contact us</a></li></ul></div>'+
    '<div><h4>Company</h4><ul><li><a href="'+S.url("brands")+'">All brands</a></li><li><a href="#">About us</a></li><li><a href="#">Reviews</a></li><li><a href="#">Terms &amp; conditions</a></li></ul></div>'+
    '</div><div class="fbot"><span>© 2026 UK Computer Shop Ltd · Company no. 07234891 · VAT GB 123 4567 89</span>'+
    '<div class="pay"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>PAYPAL</span><span>KLARNA</span><span>APPLE PAY</span></div></div></div></footer>';
}
function crumbs(list){
  return '<div class="wrap"><nav class="crumb">'+list.map(function(c,i){
    var last = i === list.length-1;
    return (i ? '<span>/</span>' : "") + (last ? '<b>'+E(c.label)+'</b>' : '<a href="'+c.href+'">'+E(c.label)+'</a>');
  }).join("")+'</nav></div>';
}

/* ---------- product card (same markup as the home page) ---------- */
function card(p){
  var st = S.stockText(p);
  var stockCls = st.cls === "in" ? "" : (st.cls === "low" ? 'style="background:var(--amber)"' : 'style="background:var(--deal)"');
  var stockTxt = st.cls === "in" ? "" : 'style="color:'+(st.cls === "low" ? "var(--amber)" : "var(--deal)")+'"';
  return '<article class="p">'+
    (p.was ? '<span class="flag">Save '+M(p.was-p.price)+'</span>' : (p.isNew ? '<span class="flag" style="background:var(--blue)">New</span>' : ""))+
    '<button class="wish">'+ic("i-heart",19,19)+'</button>'+
    '<div class="ph"><a href="'+S.url("product",{id:p.id})+'">'+icv(p.icon,132,100)+'</a></div>'+
    '<div class="body">'+
      '<div class="brandrow"><a href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a><span>'+E(p.sku)+'</span></div>'+
      '<h3><a href="'+S.url("product",{id:p.id})+'">'+E(p.name)+'</a></h3>'+
      '<ul class="specs">'+Object.keys(p.specs).slice(0,3).map(function(k){ return '<li>'+E(p.specs[k])+'</li>'; }).join("")+'</ul>'+
      '<div class="stars"><span class="s">'+S.stars(p.rating)+'</span><span>'+p.rating+' ('+p.reviews.toLocaleString("en-GB")+')</span></div>'+
      '<div class="price"><b>'+M(p.price)+'</b>'+(p.was ? '<s>'+M(p.was)+'</s><span class="save">-'+Math.round((p.was-p.price)/p.was*100)+'%</span>' : "")+'</div>'+
      '<div class="vat">'+S.exVat(p.price)+' ex. VAT</div>'+
      '<div class="stock"><i '+stockCls+'></i><span '+stockTxt+'>'+E(st.text)+'</span></div>'+
      '<div class="pbtns"><a class="add" href="#">'+ic("i-bag",16,16)+'Add to basket</a>'+
      '<a class="cmp" href="'+S.url("product",{id:p.id})+'" title="View">'+ic("i-scale",17,17)+'</a></div>'+
    '</div></article>';
}
function rail(title, sub, items, link){
  if (!items || !items.length) return "";
  return '<section><div class="wrap"><div class="head"><div><h2>'+E(title)+'</h2>'+(sub ? '<p>'+E(sub)+'</p>' : "")+'</div>'+
    (link ? '<a href="'+link.href+'">'+E(link.label)+' '+ic("i-arr",15,15)+'</a>' : "")+'</div>'+
    '<div class="rail">'+items.map(card).join("")+'</div></div></section>';
}

/* ---------- product page ---------- */
function productPage(){
  var d = Pages.product(); if (!d) return;
  var p = d.p, st = S.stockText(p), keys = Object.keys(p.specs);
  var dist = [72,19,6,2,1];
  var revs = [
    { who:"Daniel H.", v:1, r:5, t:"Dropped straight in, no fuss", b:"Ordered Tuesday afternoon, arrived Wednesday morning. Idles silently and the packaging was genuinely good — double boxed with foam ends." },
    { who:"Priya S.",  v:1, r:5, t:"Exactly as specified", b:"Spec sheet on the listing matched the product to the letter, which is more than I can say for the marketplace I used before." },
    { who:"Mark T.",   v:0, r:4, t:"Very good, one small niggle", b:"No complaints about performance. Would have liked the mounting hardware to include the older bracket, but that's on the manufacturer." }
  ];
  document.getElementById("app").innerHTML =
    header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="pd">'+
      '<div class="gal"><div class="main">'+(p.was ? '<span class="flag">Save '+M(p.was-p.price)+'</span>' : "")+
        '<svg viewBox="0 0 64 44" style="width:290px;height:220px"><use href="#'+p.icon+'"/></svg></div>'+
        '<div class="thumbs"><span class="on">'+icv(p.icon,44,34)+'</span><span>'+icv(p.icon,44,34)+'</span><span>'+icv(p.icon,44,34)+'</span><span>'+icv(p.icon,44,34)+'</span></div></div>'+
      '<div class="pinfo">'+
        '<div class="brandline"><a href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a><span style="color:#b9c3d0">·</span><span style="font-size:12.5px;color:var(--body)">'+E(p.subcategory)+'</span></div>'+
        '<h1>'+E(p.name)+'</h1>'+
        '<div class="rate"><span class="s">'+S.stars(p.rating)+'</span><b>'+p.rating+'</b><span>·</span><a href="#reviews">'+p.reviews.toLocaleString("en-GB")+' reviews</a><span>·</span><span>'+p.sold.toLocaleString("en-GB")+' sold</span></div>'+
        '<div class="ids"><span>SKU <b>'+E(p.sku)+'</b></span><span>MPN <b>'+E(p.mpn)+'</b></span><span>EAN <b>'+E(p.ean)+'</b></span></div>'+
        '<ul class="keyspec">'+keys.slice(0,6).map(function(k){ return '<li><span>'+E(k)+'</span><b>'+E(p.specs[k])+'</b></li>'; }).join("")+'</ul>'+
        '<a href="#spec" style="font-size:13.5px;font-weight:700;color:var(--blue)">See the full specification '+ic("i-arr",14,14,"")+'</a>'+
      '</div>'+
      '<aside class="buybox">'+
        '<div class="price"><b>'+M(p.price)+'</b>'+(p.was ? '<s>'+M(p.was)+'</s>' : "")+'</div>'+
        '<div class="vat">'+S.exVat(p.price)+' ex. VAT'+(p.was ? ' · you save '+M(p.was-p.price) : "")+'</div>'+
        '<div class="stock"><i '+(st.cls==="in"?"":'style="background:var(--amber)"')+'></i><span '+(st.cls==="in"?"":'style="color:var(--amber)"')+'>'+E(st.text)+'</span></div>'+
        '<div class="qty"><button type="button">−</button><input value="1"><button type="button">+</button></div>'+
        '<a class="add" href="#">'+ic("i-bag",16,16)+(st.cls==="out"?"Pre-order":"Add to basket")+'</a>'+
        '<a class="alt" href="#">Add to wishlist</a>'+
        '<ul class="perks">'+
          '<li>'+ic("i-truck",15,15)+'<span>Free next-day delivery, order before 17:00</span></li>'+
          '<li>'+ic("i-shield",15,15)+'<span>'+E(p.specs.Warranty || "Manufacturer warranty")+' · UK returns within 30 days</span></li>'+
          '<li>'+ic("i-card",15,15)+'<span>0% finance from '+M(p.price/12)+'/month</span></li>'+
          '<li>'+ic("i-wrench",15,15)+'<span>Fitting available at our Manchester workshop</span></li>'+
        '</ul>'+
      '</aside>'+
    '</div>'+
    '<div class="tabbar"><button class="on" data-tab="spec">Specification</button><button data-tab="reviews">Reviews ('+p.reviews.toLocaleString("en-GB")+')</button><button data-tab="delivery">Delivery &amp; returns</button></div>'+
    '<div class="tabpane on" id="spec"><table class="spectable">'+
      keys.map(function(k){ return '<tr><th>'+E(k)+'</th><td>'+E(p.specs[k])+'</td></tr>'; }).join("")+
      '<tr><th>Brand</th><td><a href="'+S.url("brand",{b:p.brand})+'" style="color:var(--blue);font-weight:600">'+E(p.brand)+'</a></td></tr>'+
      '<tr><th>Manufacturer part no.</th><td>'+E(p.mpn)+'</td></tr><tr><th>EAN</th><td>'+E(p.ean)+'</td></tr>'+
    '</table></div>'+
    '<div class="tabpane" id="reviews"><div class="rvsum">'+
      '<div class="rvbig"><b>'+p.rating+'</b><span class="s">'+S.stars(p.rating)+'</span><span>'+p.reviews.toLocaleString("en-GB")+' verified reviews</span></div>'+
      '<div class="rvbars">'+dist.map(function(v,i){ return '<div><span>'+(5-i)+' star</span><span class="bar"><i style="width:'+v+'%"></i></span><span>'+v+'%</span></div>'; }).join("")+'</div>'+
    '</div>'+revs.map(function(r){
      return '<div class="rv"><div class="top"><span class="who">'+E(r.who)+(r.v ? '<em>VERIFIED BUYER</em>' : "")+'</span><span class="date">March 2026</span></div>'+
        '<div style="margin-bottom:6px"><span class="s">'+S.stars(r.r)+'</span> <b style="font-size:13.5px">'+E(r.t)+'</b></div><p>'+E(r.b)+'</p></div>';
    }).join("")+'</div>'+
    '<div class="tabpane" id="delivery"><p style="margin:0 0 12px;font-size:14px">Free next-day delivery on orders over £75, despatched the same day when ordered before 17:00 Monday to Friday. Saturday delivery is available at checkout for £7.95.</p>'+
    '<p style="margin:0;font-size:14px;color:var(--body)">Returns accepted within 30 days in original packaging. Faulty items are handled under our RMA process — we collect, test and replace, and you are not charged carriage either way.</p></div>'+
    '</div>'+
    rail("Related products", "Alternatives in " + p.subcategory + ", at a similar price.", d.related, { href:S.url("home"), label:"See all "+p.subcategory })+
    rail("Frequently bought together", "Parts our customers add alongside this one — compatibility checked.", d.alsoBought)+
    rail("Recommended for you", d.recentlyViewed.length ? "Based on what you have been looking at." : "Popular right now across the catalogue.", d.recommended)+
    (d.recentlyViewed.length ? rail("Recently viewed", null, d.recentlyViewed.slice(0,4)) : "")+
    footer();

  document.querySelectorAll(".tabbar button").forEach(function(b){
    b.addEventListener("click", function(){
      document.querySelectorAll(".tabbar button").forEach(function(x){ x.classList.remove("on"); });
      document.querySelectorAll(".tabpane").forEach(function(x){ x.classList.remove("on"); });
      b.classList.add("on"); document.getElementById(b.dataset.tab).classList.add("on");
    });
  });
  document.querySelectorAll('.qty button').forEach(function(b){
    b.addEventListener("click", function(){
      var i = el(".qty input"), v = Math.max(1, (+i.value||1) + (b.textContent === "+" ? 1 : -1));
      i.value = v;
    });
  });
  document.title = p.name + " — UK Computer Shop";
}

/* ---------- brand page ---------- */
function brandPage(){
  var d = Pages.brand(); if (!d) return;
  var b = d.b;
  document.getElementById("app").innerHTML =
    header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="bhero">'+
      '<div><div class="mark">'+E(b.brand.slice(0,2).toUpperCase())+'</div><h1>'+E(b.brand)+'</h1><p>'+E(b.note)+'</p></div>'+
      '<div class="bstats">'+
        '<div><b>'+b.count+'</b><span>Products</span></div>'+
        '<div><b>'+b.rating.toFixed(1)+'</b><span>Avg rating</span></div>'+
        '<div><b>'+M(b.min).replace(".00","")+'</b><span>From</span></div>'+
        '<div><b>'+b.deals+'</b><span>On offer</span></div>'+
      '</div></div>'+
      '<div class="bchips"><a class="on" href="#all">All '+b.count+'</a>'+
        d.subcats.map(function(s2){ return '<a href="#'+encodeURIComponent(s2)+'">'+E(s2)+'<span>'+d.bySub[s2].length+'</span></a>'; }).join("")+
      '</div></div>'+
    rail("Best sellers from " + b.brand, "Ranked by units shipped over the last 90 days.", d.items.slice(0,4))+
    (d.deals.length ? rail("Current " + b.brand + " offers", "Reduced until Sunday midnight.", d.deals) : "")+
    (d.newest.length ? rail("New from " + b.brand, "Most recently added to the catalogue.", d.newest) : "")+
    rail("Recommended for you", "Other products that pair well with " + b.brand + " hardware.", d.recommended)+
    '<section><div class="wrap"><div class="head"><div><h2>Other brands you might consider</h2><p>Stocked in the same categories as '+E(b.brand)+'.</p></div><a href="'+S.url("brands")+'">All brands '+ic("i-arr",15,15)+'</a></div>'+
      '<div class="bgrid">'+d.siblings.slice(0,4).map(brandCard).join("")+'</div></div></section>'+
    footer();
  document.title = b.brand + " — UK Computer Shop";
}
function brandCard(b){
  return '<a class="bcard" href="'+S.url("brand",{b:b.brand})+'">'+
    '<span class="mark">'+E(b.brand.slice(0,2).toUpperCase())+'</span>'+
    '<h3>'+E(b.brand)+'</h3><p>'+E(b.note.length > 96 ? b.note.slice(0,94)+"…" : b.note)+'</p>'+
    '<span class="meta"><span><b>'+b.count+'</b> products</span><span><b>'+b.rating.toFixed(1)+'</b>★</span><span>from <b>'+M(b.min).replace(".00","")+'</b></span></span></a>';
}

/* ---------- brands index ---------- */
function brandsPage(){
  var d = Pages.brands();
  document.getElementById("app").innerHTML =
    header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="head" style="margin-top:6px"><div><h2 style="font-size:29px">All brands</h2>'+
      '<p>'+d.all.length+' manufacturers, '+d.totalProducts.toLocaleString("en-GB")+' products. Every brand page lists live stock, current offers and new arrivals.</p></div></div>'+
      '<div class="alpha">'+"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function(L){
        return d.letters[L] ? '<a href="#L'+L+'">'+L+'</a>' : '<a class="dim">'+L+'</a>';
      }).join("")+'</div></div>'+
    '<section style="padding-top:0"><div class="wrap"><div class="head"><div><h2>Featured brands</h2><p>Our deepest ranges, by number of lines stocked.</p></div></div>'+
      '<div class="bgrid">'+d.featured.map(brandCard).join("")+'</div></div></section>'+
    '<section style="padding-top:0"><div class="wrap"><div class="head"><div><h2>Browse A–Z</h2></div></div>'+
      d.keys.map(function(L){
        return '<div class="azblock" id="L'+L+'"><div class="L">'+L+'</div><div class="azlist">'+
          d.letters[L].map(function(b){ return '<a href="'+S.url("brand",{b:b.brand})+'">'+E(b.brand)+'<span>'+b.count+'</span></a>'; }).join("")+
        '</div></div>';
      }).join("")+'</div></section>'+
    rail("Recommended for you", "Popular across the brands you have been browsing.", d.recommended)+
    footer();
  document.title = "All brands — UK Computer Shop";
}

window.DesignA = { product:productPage, brand:brandPage, brands:brandsPage };
})();
