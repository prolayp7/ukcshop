/* Design D — Spec Index. Keeps this design's character: dense, filterable,
   identifier-forward. The brand page and the brands directory are live indexes,
   not static grids. */
(function(){
"use strict";
var S = Shop, E = S.esc, M = S.money;
function ic(id,w,h){ return '<svg width="'+w+'" height="'+(h||w)+'"><use href="#'+id+'"/></svg>'; }
function icv(id,w,h){ return '<svg viewBox="0 0 64 44" style="width:'+w+'px;height:'+h+'px"><use href="#'+id+'"/></svg>'; }

function header(){
  return '<div class="sysbar"><div class="wrap"><span class="dot"></span><span>Warehouse online</span>'+
    '<span>Despatch cut-off <b>17:00</b></span><span>Catalogue <b>'+S.all.length+' SKU</b></span><span>Updated <b>08:42 today</b></span>'+
    '<div class="r"><a href="#">Trade portal</a><a href="#">API / feed</a><a href="#">Track order</a><a href="#">GBP · Inc VAT</a></div></div></div>'+
  '<header><div class="wrap">'+
    '<a class="logo" href="'+S.url("home")+'"><span class="m">UK</span><span><b>COMPUTER SHOP</b><span>Component index</span></span></a>'+
    '<div class="qbox"><form class="qtop" onsubmit="return false" autocomplete="off">'+
      '<span class="scope">All categories '+ic("i-chev",12,12)+'</span>'+
      '<input id="q" placeholder="Product name, SKU, MPN, EAN, brand, chipset, socket or specification…">'+
      '<button class="run" type="submit">'+ic("i-search",14,14)+'SEARCH</button></form>'+
      '<div class="qbot"><span class="k">Try</span>'+
      '<a class="tok" href="'+S.url("home")+'#q=socket%3AAM5"><b>socket:</b>AM5</a>'+
      '<a class="tok" href="'+S.url("home")+'#q=vram%3A%3E%3D16"><b>vram:</b>&gt;=16</a>'+
      '<a class="tok" href="'+S.url("home")+'#q=price%3A%3C200"><b>price:</b>&lt;200</a>'+
      '<a class="tok" href="'+S.url("brands")+'" style="margin-left:auto;border-color:var(--ink)">All brands ↗</a></div></div>'+
    '<div class="hact"><button class="hbtn">'+ic("i-scale",16,16)+'Compare</button><button class="hbtn">'+ic("i-heart",16,16)+'</button>'+
      '<button class="hbtn">'+ic("i-user",16,16)+'</button><a class="hbtn solid" href="#">'+ic("i-bag",16,16)+'£1,489.97</a></div>'+
  '</div></header>'+
  '<div class="tabs"><div class="wrap">'+
    '<a href="'+S.url("home")+'" style="padding:11px 15px;font-size:12.5px;font-weight:500;color:var(--body);border-left:1px solid var(--line);border-right:1px solid var(--line)">All <em style="font-style:normal;font-family:var(--mono);font-size:9.5px;color:var(--mute)">'+S.all.length+'</em></a>'+
    S.tree().map(function(t){
      return '<a href="'+S.url("home")+'" style="padding:11px 15px;font-size:12.5px;font-weight:500;color:var(--body);border-right:1px solid var(--line);white-space:nowrap">'+E(t.category)+
        ' <em style="font-style:normal;font-family:var(--mono);font-size:9.5px;color:var(--mute)">'+t.count+'</em></a>'; }).join("")+
    '<a href="'+S.url("brands")+'" style="padding:11px 15px;font-size:12.5px;font-weight:500;color:var(--blue);border-right:1px solid var(--line);white-space:nowrap">Brands <em style="font-style:normal;font-family:var(--mono);font-size:9.5px;color:var(--mute)">'+S.brands().length+'</em></a>'+
  '</div></div>';
}
function footer(){
  return '<footer><div class="wrap"><div class="fg2">'+
    '<div><a class="logo" href="'+S.url("home")+'" style="display:inline-flex;margin-bottom:14px"><span class="m">UK</span><span><b>COMPUTER SHOP</b><span>Component index</span></span></a>'+
    '<p style="margin:0;color:var(--body);max-width:300px;font-size:13px">Independent UK retailer since 2009. Trade, education and public-sector accounts welcome, 30-day terms available.</p></div>'+
    '<div><h4>Catalogue</h4><ul>'+S.CAT_ORDER.slice(0,5).map(function(c){ return '<li><a href="'+S.url("home")+'">'+E(c)+'</a></li>'; }).join("")+'</ul></div>'+
    '<div><h4>Tools</h4><ul><li><a href="'+S.url("home")+'">Advanced search</a></li><li><a href="'+S.url("brands")+'">Brand index</a></li><li><a href="#">Bulk order pad</a></li><li><a href="#">Product data feed</a></li></ul></div>'+
    '<div><h4>Support</h4><ul><li><a href="#">Track order</a></li><li><a href="#">Delivery &amp; returns</a></li><li><a href="#">Warranty / RMA</a></li><li><a href="#">Contact</a></li></ul></div>'+
    '<div><h4>Company</h4><ul><li><a href="#">About</a></li><li><a href="#">Trade accounts</a></li><li><a href="#">Terms</a></li><li><a href="#">Privacy</a></li></ul></div>'+
    '</div><div class="fbot"><span>© 2026 UK COMPUTER SHOP LTD · COMPANY 07234891 · VAT GB 123 4567 89</span><span>ALL PRICES INC. VAT UNLESS STATED · E&amp;OE</span></div></div></footer>';
}
function crumbs(l){
  return '<div class="wrap"><nav class="crumb">'+l.map(function(c,i){
    var last = i === l.length-1;
    return (i ? '<span style="color:var(--line2);opacity:.35">/</span>' : "") + (last ? '<b>'+E(c.label)+'</b>' : '<a href="'+c.href+'">'+E(c.label)+'</a>');
  }).join("")+'</nav></div>';
}
function card(p){
  var st = S.stockText(p), keys = Object.keys(p.specs).slice(0,4);
  return '<article class="pcard">'+
    (p.was ? '<span class="rib">-'+Math.round((p.was-p.price)/p.was*100)+'%</span>' : (p.isNew ? '<span class="rib new">NEW</span>' : ""))+
    '<a class="fig" href="'+S.url("product",{id:p.id})+'">'+icv(p.icon,104,74)+'</a>'+
    '<div class="bd"><div class="mrow"><a href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a><span>'+E(p.sku)+'</span></div>'+
    '<h3><a href="'+S.url("product",{id:p.id})+'">'+E(p.name)+'</a></h3>'+
    '<div class="kv">'+keys.map(function(k){ return '<div><span>'+E(k)+'</span><b title="'+E(p.specs[k])+'">'+E(p.specs[k])+'</b></div>'; }).join("")+'</div>'+
    '<div class="rt"><i>'+S.stars(p.rating)+'</i> '+p.rating+' · '+p.reviews.toLocaleString("en-GB")+'</div>'+
    '<div class="pr"><b>'+M(p.price)+'</b>'+(p.was ? '<s>'+M(p.was)+'</s>' : "")+'</div>'+
    '<div class="av '+st.cls+'">'+E(st.text).toUpperCase()+'</div>'+
    '<a class="go" href="'+S.url("product",{id:p.id})+'">View product</a></div></article>';
}
function section(title, note, items, link){
  if (!items || !items.length) return "";
  return '<div class="secthead"><b>'+E(title)+'</b>'+(note ? '<span>'+E(note)+'</span>' : "")+
    (link ? '<a href="'+link.href+'">'+E(link.label).toUpperCase()+' →</a>' : "")+'</div>'+
    '<div class="pgrid4">'+items.map(card).join("")+'</div>';
}

function productPage(){
  var d = Pages.product(); if (!d) return;
  var p = d.p, st = S.stockText(p), keys = Object.keys(p.specs), dist = [72,19,6,2,1];
  document.getElementById("app").innerHTML = header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="pd">'+
      '<div class="pdfig"><div class="main">'+(p.was ? '<span class="rib">-'+Math.round((p.was-p.price)/p.was*100)+'%</span>' : "")+
        '<svg viewBox="0 0 64 44" style="width:210px;height:150px"><use href="#'+p.icon+'"/></svg></div>'+
        '<div class="thumbs"><span class="on">'+icv(p.icon,40,30)+'</span><span>'+icv(p.icon,40,30)+'</span><span>'+icv(p.icon,40,30)+'</span><span>'+icv(p.icon,40,30)+'</span></div></div>'+
      '<div class="pdinfo">'+
        '<div class="top"><a href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a><span class="mono" style="color:var(--mute)">'+E(p.subcategory).toUpperCase()+'</span></div>'+
        '<h1>'+E(p.name)+'</h1>'+
        '<div class="rate"><i>'+S.stars(p.rating)+'</i>'+p.rating+' · '+p.reviews.toLocaleString("en-GB")+' reviews · '+p.sold.toLocaleString("en-GB")+' sold</div>'+
        '<div class="idgrid"><div><span>SKU</span><b>'+E(p.sku)+'</b></div><div><span>MPN</span><b>'+E(p.mpn)+'</b></div>'+
          '<div><span>EAN</span><b>'+E(p.ean)+'</b></div><div><span>Added</span><b>'+E(p.added)+'</b></div></div>'+
        '<table class="pdspecs">'+keys.map(function(k){ return '<tr><th>'+E(k)+'</th><td>'+E(p.specs[k])+'</td></tr>'; }).join("")+
          '<tr><th>Brand</th><td><a href="'+S.url("brand",{b:p.brand})+'" style="color:var(--blue);font-weight:600">'+E(p.brand)+'</a> — '+d.brand.count+' other lines stocked</td></tr></table>'+
        '<div style="display:grid;grid-template-columns:150px 1fr;gap:26px;align-items:center;border:1px solid var(--line);border-top:0;padding:14px 12px;background:#fbfbf9">'+
          '<div style="text-align:center"><b style="font-family:var(--mono);font-size:26px;font-weight:600;display:block">'+p.rating+'</b>'+
          '<span style="color:var(--amber);letter-spacing:1px">'+S.stars(p.rating)+'</span>'+
          '<span style="display:block;font-family:var(--mono);font-size:9px;color:var(--mute);letter-spacing:.1em;margin-top:3px">'+p.reviews.toLocaleString("en-GB")+' REVIEWS</span></div>'+
          '<div style="display:grid;gap:6px">'+dist.map(function(v,i){
            return '<div style="display:grid;grid-template-columns:44px 1fr 36px;gap:10px;align-items:center;font-family:var(--mono);font-size:9.5px;color:var(--mute)">'+
              '<span>'+(5-i)+' STAR</span><span style="height:6px;background:#e8e8e2"><i style="display:block;height:100%;width:'+v+'%;background:var(--amber)"></i></span><span>'+v+'%</span></div>'; }).join("")+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="pdbuy"><div class="pr"><b>'+M(p.price)+'</b>'+(p.was ? '<s>was '+M(p.was)+'</s>' : "")+'</div>'+
        '<div class="ex">'+S.exVat(p.price)+' EX VAT</div>'+
        (p.was ? '<span class="save">SAVE '+M(p.was-p.price)+'</span>' : "")+
        '<div class="av '+st.cls+'"><i></i>'+E(st.text).toUpperCase()+'</div>'+
        '<div class="qty"><button type="button">−</button><input value="1"><button type="button">+</button></div>'+
        '<a class="addb" href="#">'+(st.cls==="out"?"Pre-order":"Add to basket")+'</a>'+
        '<a class="qv" href="#" style="margin-top:6px;display:block">Add to compare</a>'+
        '<ul class="perks"><li>'+ic("i-truck",14,14)+'<span>Free next-day delivery over £75, cut-off 17:00</span></li>'+
          '<li>'+ic("i-shield",14,14)+'<span>'+E(p.specs.Warranty || "Manufacturer warranty")+' · 30-day returns</span></li>'+
          '<li>'+ic("i-card",14,14)+'<span>0% finance from '+M(p.price/12)+'/month</span></li></ul></div>'+
    '</div>'+
    section("Related products", p.subcategory + " · similar price band", d.related, { href:S.url("home"), label:"All "+p.subcategory })+
    section("Frequently bought together", "compatibility checked — socket, memory and PSU headroom", d.alsoBought)+
    section("Recommended for you", d.recentlyViewed.length ? "from your browsing history" : "top sellers across the catalogue", d.recommended)+
    (d.recentlyViewed.length ? section("Recently viewed", "stored in this browser", d.recentlyViewed.slice(0,4)) : "")+
    '</div>'+ footer();
  document.querySelectorAll(".qty button").forEach(function(b){
    b.addEventListener("click", function(){
      var i = document.querySelector(".qty input");
      i.value = Math.max(1, (+i.value||1) + (b.textContent === "+" ? 1 : -1));
    });
  });
  document.title = p.name + " — UK Computer Shop";
}

/* Brand page: a live index of that brand, filterable and sortable. */
function brandPage(){
  var d = Pages.brand(); if (!d) return; var b = d.b;
  var state = { sub:"All", sort:"best" };
  document.getElementById("app").innerHTML = header() + crumbs(d.crumbs) +
    '<div class="wrap">'+
      '<div class="bhead"><div class="mark">'+E(b.brand.slice(0,2).toUpperCase())+'</div>'+
        '<div><h1>'+E(b.brand)+'</h1><p>'+E(b.note)+'</p></div>'+
        '<div class="bstats"><div><b>'+b.count+'</b><span>Products</span></div><div><b>'+b.rating.toFixed(1)+'</b><span>Rating</span></div>'+
        '<div><b>'+M(b.min).replace(".00","")+'</b><span>From</span></div><div><b>'+b.deals+'</b><span>On offer</span></div></div></div>'+
      '<div class="toolbar"><span class="cnt" id="bcount"></span>'+
        '<div class="chips" id="bchips"></div>'+
        '<div class="rt"><select class="sel" id="bsort">'+
          '<option value="best">SORT: BEST SELLING</option><option value="price-asc">PRICE: LOW TO HIGH</option>'+
          '<option value="price-desc">PRICE: HIGH TO LOW</option><option value="rating">CUSTOMER RATING</option>'+
          '<option value="newest">NEWEST</option></select></div></div>'+
      '<div id="bres"></div>'+
      section("Recommended for you", "pairs well with " + b.brand + " hardware", d.recommended)+
      '<div class="secthead"><b>Other brands in the same categories</b><a href="'+S.url("brands")+'">ALL BRANDS →</a></div>'+
      '<table class="btable"><thead><tr><th>Brand</th><th>Products</th><th>Categories</th><th>Rating</th><th>From</th></tr></thead><tbody>'+
        d.siblings.map(brandRow).join("")+'</tbody></table>'+
    '</div>' + footer();

  var SORTS = {
    "best":(a,c)=>c.sold-a.sold, "price-asc":(a,c)=>a.price-c.price, "price-desc":(a,c)=>c.price-a.price,
    "rating":(a,c)=>c.rating-a.rating||c.reviews-a.reviews, "newest":(a,c)=>a.added<c.added?1:-1
  };
  function draw(){
    var items = d.items.filter(function(x){ return state.sub === "All" || x.subcategory === state.sub; }).sort(SORTS[state.sort]);
    document.getElementById("bcount").innerHTML = 'SHOWING <b>'+items.length+'</b> OF <b>'+d.items.length+'</b>';
    document.getElementById("bchips").innerHTML =
      ['All'].concat(d.subcats).map(function(s2){
        var n = s2 === "All" ? d.items.length : d.bySub[s2].length;
        var on = state.sub === s2;
        return '<span class="chip" data-sub="'+E(s2)+'" style="cursor:pointer'+(on ? ';background:var(--ink);color:#fff;border-color:var(--ink)' : "")+'">'+
          E(s2).toUpperCase()+' '+n+'</span>';
      }).join("");
    document.getElementById("bres").innerHTML = items.length
      ? '<div class="pgrid4">'+items.map(card).join("")+'</div>'
      : '<div class="empty"><h3>Nothing in that category</h3></div>';
    document.querySelectorAll("#bchips .chip").forEach(function(c){
      c.addEventListener("click", function(){ state.sub = c.dataset.sub; draw(); });
    });
  }
  document.getElementById("bsort").addEventListener("change", function(e){ state.sort = e.target.value; draw(); });
  draw();
  document.title = b.brand + " — UK Computer Shop";
}
function brandRow(b){
  return '<tr><td><a class="nm" href="'+S.url("brand",{b:b.brand})+'">'+E(b.brand)+'</a></td>'+
    '<td class="num">'+b.count+'</td><td class="cats">'+E(b.cats.join(", "))+'</td>'+
    '<td class="num">'+b.rating.toFixed(1)+'★</td><td class="num">'+M(b.min)+'</td></tr>';
}

/* Brands directory: filterable, sortable table — the D way. */
function brandsPage(){
  var d = Pages.brands();
  var state = { q:"", sort:"count", letter:"" };
  document.getElementById("app").innerHTML = header() + crumbs(d.crumbs) +
    '<div class="wrap">'+
      '<div class="banner"><div class="l"><span class="badge">BRAND INDEX</span>'+
        '<div><h1>'+d.all.length+' manufacturers, '+d.totalProducts.toLocaleString("en-GB")+' products</h1>'+
        '<p>Every brand page carries live stock, current offers and new arrivals for that manufacturer.</p></div></div></div>'+
      '<div class="alpha" id="alpha"><a data-letter="" style="width:auto;padding:0 10px">ALL</a>'+
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function(L){
          return d.letters[L] ? '<a data-letter="'+L+'">'+L+'</a>' : '<a class="dim">'+L+'</a>'; }).join("")+'</div>'+
      '<div class="toolbar"><span class="cnt" id="bcount"></span>'+
        '<div class="rt"><input id="bq" placeholder="Filter brands…" style="border:1px solid var(--line2);padding:6px 10px;font-family:var(--mono);font-size:11px;outline:none">'+
        '<select class="sel" id="bsort"><option value="count">SORT: MOST PRODUCTS</option><option value="name">NAME A–Z</option>'+
        '<option value="rating">HIGHEST RATED</option><option value="price">LOWEST ENTRY PRICE</option></select></div></div>'+
      '<div id="bres" style="margin-bottom:20px"></div>'+
      section("Recommended for you", "popular across the brands you have been browsing", d.recommended)+
    '</div>' + footer();

  var SORTS = {
    count:(a,b)=>b.count-a.count||a.brand.localeCompare(b.brand),
    name:(a,b)=>a.brand.localeCompare(b.brand),
    rating:(a,b)=>b.rating-a.rating,
    price:(a,b)=>a.min-b.min
  };
  function draw(){
    var list = d.all.filter(function(b){
      if (state.letter && b.brand[0].toUpperCase() !== state.letter) return false;
      if (state.q && b.brand.toLowerCase().indexOf(state.q) === -1) return false;
      return true;
    }).sort(SORTS[state.sort]);
    document.getElementById("bcount").innerHTML = 'SHOWING <b>'+list.length+'</b> OF <b>'+d.all.length+'</b> BRANDS';
    document.getElementById("bres").innerHTML = list.length
      ? '<table class="btable"><thead><tr><th>Brand</th><th>Products</th><th>Categories</th><th>Rating</th><th>From</th></tr></thead><tbody>'+
        list.map(brandRow).join("")+'</tbody></table>'
      : '<div class="empty"><h3>No brand matches that filter</h3><p>Try a different letter or clear the search.</p></div>';
    document.querySelectorAll("#alpha a[data-letter]").forEach(function(a){
      a.style.background = (a.dataset.letter === state.letter) ? "var(--ink)" : "";
      a.style.color = (a.dataset.letter === state.letter) ? "#fff" : "";
    });
  }
  document.getElementById("alpha").addEventListener("click", function(e){
    var a = e.target.closest("a[data-letter]"); if (!a) return;
    state.letter = a.dataset.letter; draw();
  });
  document.getElementById("bq").addEventListener("input", function(e){ state.q = e.target.value.toLowerCase().trim(); draw(); });
  document.getElementById("bsort").addEventListener("change", function(e){ state.sort = e.target.value; draw(); });
  draw();
  document.title = "All brands — UK Computer Shop";
}
window.DesignD = { product:productPage, brand:brandPage, brands:brandsPage };
})();
