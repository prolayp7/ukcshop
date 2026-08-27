/* Design C — Atelier. */
(function(){
"use strict";
var S = Shop, E = S.esc, M = S.money;
function ic(id,w,h){ return '<svg width="'+w+'" height="'+(h||w)+'"><use href="#'+id+'"/></svg>'; }
function icv(id,w,h){ return '<svg viewBox="0 0 64 44" style="width:'+w+'px;height:'+h+'px"><use href="#'+id+'"/></svg>'; }

function header(){
  return '<div class="ann">Complimentary next-day delivery on orders over £75 · <b>Build service now booking for next week</b></div>'+
  '<header><div class="wrap"><div class="hrow">'+
    '<div class="hleft"><a href="#">Configurator</a><a href="#">Build service</a><a href="#">Business</a></div>'+
    '<a class="brand" href="'+S.url("home")+'"><b>UK Computer Shop</b><span>Manchester</span></a>'+
    '<div class="hright"><a class="icb" href="#">'+ic("i-search",17,17)+'Search</a><a class="icb" href="'+S.url("account")+'">'+ic("i-user",17,17)+'Account</a>'+
    '<a class="icb" href="'+S.url("basket")+'">'+ic("i-bag",17,17)+'Basket<span class="n" data-basket-count hidden>0</span></a></div>'+
  '</div><nav class="hnav">'+
    S.tree().map(function(t){ return '<a href="'+S.url("category",{cat:t.category})+'">'+E(t.category)+'</a>'; }).join("")+
    '<a href="'+S.url("brands")+'">Brands</a><a href="#" style="color:var(--clay)">Offers</a>'+
  '</nav></div>'+
  '<div class="sline"><div class="wrap"><form>'+ic("i-search",16,16)+
    '<input placeholder="Search by product, brand, SKU, manufacturer part number or specification"></form>'+
    '<div class="tags"><a href="#">RTX 5080</a><a href="#">DDR5 CL30</a><a href="#">OLED 240Hz</a><a href="#">AM5</a></div>'+
  '</div></div></header>';
}
function footer(){
  return '<footer><div class="wrap"><div class="fg">'+
    '<div class="about"><b>UK Computer Shop</b><p>Independent retailer, workshop and showroom. [Business address], Manchester. Open Monday to Saturday.</p></div>'+
    '<div><h4>Shop</h4><ul>'+S.CAT_ORDER.slice(0,5).map(function(c){ return '<li><a href="'+S.url("category",{cat:c})+'">'+E(c)+'</a></li>'; }).join("")+'</ul></div>'+
    '<div><h4>Services</h4><ul><li><a href="#">Configurator</a></li><li><a href="#">Assembly</a></li><li><a href="#">Repairs</a></li><li><a href="#">Trade-in</a></li></ul></div>'+
    '<div><h4>Support</h4><ul><li><a href="#">Track an order</a></li><li><a href="#">Delivery &amp; returns</a></li><li><a href="#">Warranty</a></li><li><a href="#">Contact</a></li></ul></div>'+
    '<div><h4>Company</h4><ul><li><a href="'+S.url("brands")+'">All brands</a></li><li><a href="#">About</a></li><li><a href="#">The journal</a></li><li><a href="#">Terms</a></li></ul></div>'+
    '</div><div class="fb"><span>© 2026 UK Computer Shop Ltd · Registered in England [Company registration] · VAT [VAT number]</span><span>All prices include VAT at 20%</span></div></div></footer>';
}
function crumbs(l){
  return '<div class="wrap"><nav class="crumb">'+l.map(function(c,i){
    var last = i === l.length-1;
    return (i ? '<span>·</span>' : "") + (last ? '<b>'+E(c.label)+'</b>' : '<a href="'+c.href+'">'+E(c.label)+'</a>');
  }).join("")+'</nav></div>';
}
function card(p){
  return '<article class="pc">'+
    '<a class="fig" href="'+S.url("product",{id:p.id})+'">'+
      (p.was ? '<span class="rib">Reduced</span>' : (p.isNew ? '<span class="rib">New</span>' : ""))+
      '<button class="fav">'+ic("i-heart",18,18)+'</button>'+icv(p.icon,170,108)+'</a>'+
    '<div class="bd"><a class="br" href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a>'+
      '<h3><a href="'+S.url("product",{id:p.id})+'">'+E(p.name)+'</a></h3>'+
      '<p class="sp">'+E(Object.keys(p.specs).slice(0,3).map(function(k){ return p.specs[k]; }).join(" · "))+'</p>'+
      '<p class="rt"><i>'+S.stars(p.rating)+'</i>'+p.rating+' · '+p.reviews.toLocaleString("en-GB")+' reviews</p>'+
      '<div class="pr"><span><b>'+M(p.price)+'</b>'+(p.was ? '<s>'+M(p.was)+'</s>' : "")+'</span>'+
      '<a class="add" href="'+S.url("product",{id:p.id})+'">View</a></div></div></article>';
}
function rail(eyebrow, title, sub, items, link){
  if (!items || !items.length) return "";
  return '<section style="padding-top:0"><div class="wrap"><div class="shead"><div><span class="lbl">'+E(eyebrow)+'</span>'+
    '<h2>'+E(title)+'</h2>'+(sub ? '<p>'+E(sub)+'</p>' : "")+'</div>'+
    (link ? '<a href="'+link.href+'">'+E(link.label)+'</a>' : "")+'</div>'+
    '<div class="pgrid">'+items.map(card).join("")+'</div></div></section>';
}
function productPage(){
  var d = Pages.product(); if (!d) return;
  var p = d.p, st = S.stockText(p), keys = Object.keys(p.specs), dist = [72,19,6,2,1];
  var revs = [
    { who:"Daniel H.", v:1, r:5, t:"Dropped straight in, no fuss", b:"Ordered Tuesday afternoon, here Wednesday morning. Idles silently and the packaging was genuinely good — double boxed with foam ends." },
    { who:"Priya S.",  v:1, r:5, t:"Exactly as specified", b:"The spec sheet on the listing matched the product to the letter, which is more than I can say for the marketplace I used before." },
    { who:"Mark T.",   v:0, r:4, t:"Very good, one small niggle", b:"No complaints about performance. I would have liked the older mounting bracket in the box, but that is on the manufacturer." }
  ];
  document.getElementById("app").innerHTML = header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="pd">'+
      '<div class="gal"><div class="main">'+(p.was ? '<span class="rib">Reduced</span>' : "")+
        '<svg viewBox="0 0 64 44" style="width:76%;height:auto"><use href="#'+p.icon+'"/></svg></div>'+
        '<div class="thumbs"><span class="on">'+icv(p.icon,52,38)+'</span><span>'+icv(p.icon,52,38)+'</span><span>'+icv(p.icon,52,38)+'</span><span>'+icv(p.icon,52,38)+'</span></div></div>'+
      '<div class="pdinfo">'+
        '<div class="eyeb"><a href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a><span class="lbl">'+E(p.subcategory)+'</span></div>'+
        '<h1>'+E(p.name)+'</h1>'+
        '<div class="rate"><i>'+S.stars(p.rating)+'</i>'+p.rating+' · '+p.reviews.toLocaleString("en-GB")+' reviews · '+p.sold.toLocaleString("en-GB")+' sold</div>'+
        '<div class="pdprice"><b>'+M(p.price)+'</b>'+(p.was ? '<s>'+M(p.was)+'</s><span class="save">Save '+M(p.was-p.price)+'</span>' : "")+
          '<span class="ex">'+S.exVat(p.price)+' ex. VAT<br>0% finance from '+M(p.price/12)+'/month</span></div>'+
        '<div class="avail '+st.cls+'"><i></i>'+E(st.text)+'</div>'+
        '<div class="pdbuy"><div class="qty"><button type="button">−</button><input value="1" data-qty-input><button type="button">+</button></div>'+
          '<a class="btnbuy" href="#" data-add="'+p.id+'" data-qty="input">'+(st.cls==="out"?"Pre-order":"Add to basket")+' '+ic("i-arr",15,15)+'</a></div>'+
        '<a class="btnalt" href="#">Add to wishlist</a>'+
        '<ul class="perks"><li>'+ic("i-truck",16,16)+'<span>Complimentary next-day delivery, ordered before 17:00.</span></li>'+
          '<li>'+ic("i-shield",16,16)+'<span>'+E(p.specs.Warranty || "Manufacturer warranty")+', with UK returns inside 30 days.</span></li>'+
          '<li>'+ic("i-wrench",16,16)+'<span>Fitting available at the Manchester workshop.</span></li></ul>'+
      '</div></div>'+
      '<div class="detail"><h2>Specification</h2><table class="spectable">'+
        keys.map(function(k){ return '<tr><th>'+E(k)+'</th><td>'+E(p.specs[k])+'</td></tr>'; }).join("")+
        '<tr><th>Brand</th><td><a href="'+S.url("brand",{b:p.brand})+'" style="text-decoration:underline">'+E(p.brand)+'</a></td></tr>'+
        '<tr><th>Part numbers</th><td>SKU '+E(p.sku)+' · MPN '+E(p.mpn)+' · EAN '+E(p.ean)+'</td></tr></table></div>'+
      '<div class="detail"><h2>What owners say</h2>'+
        '<div class="rvsum"><div class="rvbig"><b>'+p.rating+'</b><i>'+S.stars(p.rating)+'</i><span>'+p.reviews.toLocaleString("en-GB")+' verified reviews</span></div>'+
        '<div class="rvbars">'+dist.map(function(v,i){ return '<div><span>'+(5-i)+' star</span><span class="bar"><i style="width:'+v+'%"></i></span><span>'+v+'%</span></div>'; }).join("")+'</div></div>'+
        revs.map(function(r){ return '<div class="rv"><div class="top"><span class="who">'+E(r.who)+(r.v?'<em>Verified buyer</em>':"")+'</span><span class="date">March 2026</span></div>'+
          '<i>'+S.stars(r.r)+'</i><h4>'+E(r.t)+'</h4><p>'+E(r.b)+'</p></div>'; }).join("")+'</div>'+
    '</div>'+
    rail("Alternatives", "Related products", "Others on the same shelf, at a comparable price.", d.related, { href:S.url("home"), label:"All "+p.subcategory })+
    rail("Complete the build", "Frequently bought together", "Checked against this part for socket, memory profile and power headroom.", d.alsoBought)+
    rail("For you", "Recommended", d.recentlyViewed.length ? "Drawn from what you have been looking at." : "Chosen by our build team this month.", d.recommended)+
    (d.recentlyViewed.length ? rail("Your history", "Recently viewed", null, d.recentlyViewed.slice(0,4)) : "")+
    footer();
  document.querySelectorAll(".qty button").forEach(function(b){
    b.addEventListener("click", function(){
      var i = document.querySelector(".qty input");
      i.value = Math.max(1, (+i.value||1) + (b.textContent === "+" ? 1 : -1));
    });
  });
  document.title = p.name + " — UK Computer Shop";
}
function brandCard(b){
  return '<a class="bcard" href="'+S.url("brand",{b:b.brand})+'"><span class="mark">'+E(b.brand.slice(0,2).toUpperCase())+'</span>'+
    '<h3>'+E(b.brand)+'</h3><p>'+E(b.note.length>104 ? b.note.slice(0,102)+"…" : b.note)+'</p>'+
    '<span class="meta"><span><b>'+b.count+'</b> products</span><span><b>'+b.rating.toFixed(1)+'</b> avg</span><span>from <b>'+M(b.min).replace(".00","")+'</b></span></span></a>';
}
function brandPage(){
  var d = Pages.brand(); if (!d) return; var b = d.b;
  document.getElementById("app").innerHTML = header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="bhero">'+
      '<div><div class="mark">'+E(b.brand.slice(0,2).toUpperCase())+'</div><h1>'+E(b.brand)+'</h1><p>'+E(b.note)+'</p></div>'+
      '<div class="bstats"><div><b>'+b.count+'</b><span>Products</span></div><div><b>'+b.rating.toFixed(1)+'</b><span>Avg rating</span></div>'+
      '<div><b>'+M(b.min).replace(".00","")+'</b><span>From</span></div><div><b>'+b.deals+'</b><span>On offer</span></div></div></div>'+
      '<div class="bchips"><a class="on" href="#">All '+b.count+'</a>'+d.subcats.map(function(s2){ return '<a href="#">'+E(s2)+'<span>'+d.bySub[s2].length+'</span></a>'; }).join("")+'</div></div>'+
    rail("Best sellers", b.brand + " — what moves", "Ranked by units shipped over the last ninety days.", d.items.slice(0,4))+
    (d.deals.length ? rail("Reduced", "Current " + b.brand + " offers", "Held until Sunday midnight.", d.deals) : "")+
    (d.newest.length ? rail("Just arrived", "New from " + b.brand, "Most recently added to the catalogue.", d.newest) : "")+
    rail("For you", "Recommended", "Pairs well with " + b.brand + " hardware.", d.recommended)+
    '<section style="padding-top:0"><div class="wrap"><div class="shead"><div><span class="lbl">Alternatives</span><h2>Other brands to consider</h2>'+
      '<p>Stocked in the same categories as '+E(b.brand)+'.</p></div><a href="'+S.url("brands")+'">All brands</a></div>'+
      '<div class="bgrid">'+d.siblings.slice(0,4).map(brandCard).join("")+'</div></div></section>'+
    footer();
  document.title = b.brand + " — UK Computer Shop";
}
function brandsPage(){
  var d = Pages.brands();
  document.getElementById("app").innerHTML = header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="shead" style="margin-top:10px"><div><span class="lbl">Manufacturers</span><h2>All brands</h2>'+
      '<p>'+d.all.length+' manufacturers and '+d.totalProducts.toLocaleString("en-GB")+' products. Every brand page carries live stock, current offers and new arrivals.</p></div></div>'+
      '<div class="alpha">'+"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function(L){
        return d.letters[L] ? '<a href="#L'+L+'">'+L+'</a>' : '<a class="dim">'+L+'</a>'; }).join("")+'</div>'+
      '<div class="bgrid">'+d.featured.map(brandCard).join("")+'</div>'+
      '<div style="margin-top:44px">'+d.keys.map(function(L){
        return '<div class="azblock" id="L'+L+'"><div class="L">'+L+'</div><div class="azlist">'+
          d.letters[L].map(function(b){ return '<a href="'+S.url("brand",{b:b.brand})+'">'+E(b.brand)+'<span>'+b.count+'</span></a>'; }).join("")+'</div></div>';
      }).join("")+'</div></div>'+
    rail("For you", "Recommended", "Popular across the brands you have been browsing.", d.recommended)+
    footer();
  document.title = "All brands — UK Computer Shop";
}
window.DesignC = { product:productPage, brand:brandPage, brands:brandsPage,
  parts:{ header:header, footer:footer, crumbs:crumbs, card:card, brandCard:brandCard,
          section:function(t,n,i,l){ return rail("Selected", t, n, i, l); } } };
})();
