/* Design E — Voltage.
   Utility density from Goxtore (support bar, category->brand mega menus,
   off-canvas cart, countdown deals) with Neotek's editorial surface
   (near-black + electric yellow, search modal, category tiles with counts). */
(function(){
"use strict";
var S = Shop, E = S.esc, M = S.money;
var $ = function(s,r){ return (r||document).querySelector(s); };
var $$ = function(s,r){ return [].slice.call((r||document).querySelectorAll(s)); };
function ic(id,w,h){ return '<svg width="'+w+'" height="'+(h||w)+'"><use href="#'+id+'"/></svg>'; }
function fig(p,w,h){ return '<svg viewBox="0 0 64 44" style="width:'+w+'px;height:'+h+'px"><use href="#'+p.icon+'"/></svg>'; }
var CAT_ICON = { "PC Components":"i-gpu", "Computers":"i-pc", "Laptops":"i-lap",
                 "Peripherals":"i-mon", "Networking":"i-net", "Accessories":"i-cable" };

/* ---------------- chrome ---------------- */
function header(){
  var tree = S.tree();
  var megas = tree.slice(0,3).map(function(t){
    var per = Math.ceil(t.subs.length/4), cols = [];
    for (var i=0;i<t.subs.length;i+=per) cols.push(t.subs.slice(i,i+per));
    while (cols.length < 4) cols.push([]);
    var brands = S.uniq(S.all.filter(function(p){ return p.category === t.category; }).map(function(p){ return p.brand; })).slice(0,6);
    return '<div class="has-mega"><a class="top" href="'+S.url("category",{cat:t.category})+'">'+E(t.category)+' '+ic("i-chev",13,13)+'</a>'+
      '<div class="mega">'+
        cols.slice(0,3).map(function(c,n){
          return '<div><h4>'+["Popular","More","Also in"][n]+'</h4><ul>'+
            c.map(function(s2){ return '<li><a href="'+S.url("category",{sub:s2})+'">'+E(s2)+' <span style="color:var(--mute);font-size:11px">'+S.countIn(s2)+'</span></a></li>'; }).join("")+
          '</ul></div>'; }).join("")+
        '<div><h4>Shop by brand</h4><ul>'+brands.map(function(b){
          return '<li><a href="'+S.url("brand",{b:b})+'">'+E(b)+'</a></li>'; }).join("")+
          '<li><a href="'+S.url("brands")+'" style="font-weight:600">All brands →</a></li></ul></div>'+
        '<div class="promo"><span class="eyebrow">Build service</span>'+
          '<p>Assembled, cable-managed and stress-tested for 48 hours. £89.</p>'+
          '<a href="#">Learn more</a></div>'+
      '</div></div>';
  }).join("");
  var rest = tree.slice(3).map(function(t){
    return '<a class="top" href="'+S.url("category",{cat:t.category})+'">'+E(t.category)+'</a>'; }).join("");

  return '<div class="announce"><div class="wrap"><span>Free next-day delivery on everything over <b>£75</b> · Order before 17:00</span>'+
      '<a href="#">See delivery options</a></div></div>'+
    '<div class="util"><div class="wrap">'+
      '<a class="ico" href="'+S.url("account",{tab:"orders"})+'">'+ic("i-truck",15,15)+'Track your order</a>'+
      '<a class="ico" href="'+S.url("stores")+'">'+ic("i-wrench",15,15)+'Store &amp; workshop</a>'+
      '<a class="ico" href="'+S.url("support")+'">'+ic("i-shield",15,15)+'Warranty &amp; returns</a>'+
      '<div class="right"><span class="ico">'+ic("i-user",15,15)+'Need help? <a class="tel" href="#">[Phone number]</a></span>'+
        '<span class="sel">Inc. VAT '+ic("i-chev",12,12)+'</span><span class="sel">£ GBP '+ic("i-chev",12,12)+'</span></div>'+
    '</div></div>'+
    '<header class="mast"><div class="wrap">'+
      '<a class="logo" href="'+S.url("home")+'"><span class="bolt">'+ic("i-cpu",22,22)+'</span>'+
        '<span><b>UK Computer Shop</b><span>Voltage · Manchester</span></span></a>'+
      '<form class="searchbar" id="sform" onsubmit="return false">'+
        '<span class="scope">All departments '+ic("i-chev",12,12)+'</span>'+
        '<input id="sq" placeholder="Search '+S.all.length+' products — name, SKU, MPN, brand or spec…">'+
        '<span class="kbd">⌘K</span><button class="go" type="submit">'+ic("i-search",16,16)+'Search</button></form>'+
      '<div class="mast-act">'+
        '<a class="mact" href="'+S.url("account",{tab:"wishlist"})+'">'+ic("i-heart",21,21)+'<span class="pip" data-wishlist-count hidden>0</span>'+
          '<span><span class="lbl">Saved</span><span class="val">Wishlist</span></span></a>'+
        '<a class="mact" href="'+S.url("login")+'">'+ic("i-user",21,21)+
          '<span><span class="lbl">Sign in</span><span class="val">Account</span></span></a>'+
        '<button class="mact" id="cartBtn">'+ic("i-bag",21,21)+'<span class="pip" data-basket-count hidden>0</span>'+
          '<span><span class="lbl">Basket</span><span class="val" data-basket-total>£0.00</span></span></button>'+
      '</div></div></header>'+
    '<nav class="nav"><div class="wrap">'+
      '<div class="dept"><span class="alldept">'+ic("i-kb",17,17)+'All departments '+ic("i-chev",13,13)+'</span>'+
        '<div class="dept-panel">'+tree.map(function(t){
          return '<a href="'+S.url("category",{cat:t.category})+'">'+ic(CAT_ICON[t.category]||"i-gpu",18,14)+E(t.category)+'<em>'+t.count+'</em></a>'; }).join("")+
        '<a href="'+S.url("brands")+'">'+ic("i-scale",18,14)+'All brands<em>'+S.brands().length+'</em></a></div></div>'+
      megas + rest +
      '<a class="top" href="'+S.url("brands")+'">Brands</a>'+
      '<a class="top" href="'+S.url("blog")+'">Blog</a>'+
      '<a class="top hot" href="'+S.url("deals")+'">Deals</a>'+
      '<div class="right">'+ic("i-truck",15,15)+'<span>Despatch cut-off <b>17:00</b></span></div>'+
    '</div></nav>';
}

function footer(){
  return '<footer><div class="wrap"><div class="fgrid">'+
    '<div><a class="logo" href="'+S.url("home")+'" style="margin-bottom:16px"><span class="bolt">'+ic("i-cpu",22,22)+'</span>'+
      '<span><b style="color:#fff">UK Computer Shop</b><span>Voltage · Manchester</span></span></a>'+
      '<p style="margin:0;max-width:300px">Independent UK retailer. Warehouse, build room and test lab in Manchester. Showroom open Monday to Saturday.</p>'+
      '<div class="fcontact"><div>'+ic("i-user",15,15)+'<span>[Phone number] · Mon–Sat 9–18</span></div>'+
        '<div>'+ic("i-wrench",15,15)+'<span>[Business address], Manchester</span></div></div>'+
      '<div class="fnews"><input placeholder="Email for restocks and price drops"><button>Join</button></div></div>'+
    '<div><h4>Shop</h4><ul>'+S.CAT_ORDER.map(function(c){
      return '<li><a href="'+S.url("category",{cat:c})+'">'+E(c)+'</a></li>'; }).join("")+'</ul></div>'+
    '<div><h4>Services</h4><ul><li><a href="#">PC configurator</a></li><li><a href="#">Build &amp; test</a></li>'+
      '<li><a href="#">Repairs &amp; upgrades</a></li><li><a href="#">Trade-in</a></li><li><a href="#">Business accounts</a></li></ul></div>'+
    '<div><h4>Support</h4><ul><li><a href="'+S.url("support")+'">Help centre</a></li><li><a href="'+S.url("account",{tab:"orders"})+'">Track an order</a></li>'+
      '<li><a href="'+S.url("delivery")+'">Delivery information</a></li><li><a href="'+S.url("returns")+'">Returns &amp; refunds</a></li>'+
      '<li><a href="'+S.url("warranty")+'">Warranty / RMA</a></li><li><a href="'+S.url("paymentInfo")+'">Finance</a></li>'+
      '<li><a href="'+S.url("contact")+'">Contact us</a></li></ul></div>'+
    '<div><h4>Company</h4><ul><li><a href="'+S.url("brands")+'">All brands</a></li><li><a href="'+S.url("about")+'">About us</a></li>'+
      '<li><a href="'+S.url("stores")+'">Store locations</a></li><li><a href="#">Reviews</a></li>'+
      '<li><a href="'+S.url("terms")+'">Terms</a></li><li><a href="'+S.url("privacy")+'">Privacy</a></li>'+
      '<li><a href="'+S.url("cookiePolicy")+'">Cookie policy</a></li></ul></div>'+
    '</div><div class="fbot"><span>© 2026 UK Computer Shop Ltd · [Company registration] · [VAT number]</span>'+
      '<div class="pay"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>PAYPAL</span><span>KLARNA</span><span>APPLE PAY</span></div>'+
    '</div></div></footer>'+
    /* search modal + cart drawer live at the end of the document */
    '<div class="smodal" id="smodal"><div class="spanel">'+
      '<div class="top">'+ic("i-search",20,20)+'<input id="mq" placeholder="Search products, SKUs, brands…"><span class="esc">ESC</span></div>'+
      '<div class="sbody" id="sbody"></div>'+
      '<div class="sfoot"><span>↑↓ NAVIGATE</span><span>↵ OPEN</span><span>ESC CLOSE</span></div>'+
    '</div></div>'+
    '<div class="scrim" id="scrim"></div>'+
    '<aside class="drawer" id="drawer"><div class="dh"><h3>Your basket</h3><button id="dclose">&times;</button></div>'+
      '<div class="dbody" id="dbody"></div><div id="dfoot"></div></aside>';
}

function crumbs(list){
  return '<div class="wrap"><nav class="crumb">'+list.map(function(c,i){
    var last = i === list.length-1;
    return (i ? '<span>/</span>' : "") + (last ? '<b>'+E(c.label)+'</b>' : '<a href="'+c.href+'">'+E(c.label)+'</a>');
  }).join("")+'</nav></div>';
}

/* ---------------- product card ---------------- */
function card(p){
  var st = S.stockText(p);
  return '<article class="pc">'+
    '<div class="flags">'+
      (p.was ? '<span class="flag">−'+Math.round((p.was-p.price)/p.was*100)+'%</span>' : "")+
      (p.isNew ? '<span class="flag new">NEW</span>' : "")+'</div>'+
    '<div class="acts"><button data-wish="'+p.id+'" title="Add to wishlist">'+ic("i-heart",16,16)+'</button>'+
      '<button data-compare="'+p.id+'" title="Compare">'+ic("i-scale",16,16)+'</button>'+
      '<button data-quickview="'+p.id+'" title="Quick view">'+ic("i-search",16,16)+'</button></div>'+
    '<a class="fig" href="'+S.url("product",{id:p.id})+'">'+fig(p,138,100)+'</a>'+
    '<div class="bd">'+
      '<a class="br" href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a>'+
      '<h3><a href="'+S.url("product",{id:p.id})+'">'+E(p.name)+'</a></h3>'+
      '<div class="rate"><i>'+S.stars(p.rating)+'</i>'+p.rating+' · '+p.reviews.toLocaleString("en-GB")+'</div>'+
      '<div class="price"><b>'+M(p.price)+'</b>'+(p.was ? '<s>'+M(p.was)+'</s>' : "")+'</div>'+
      '<div class="vat">'+S.exVat(p.price)+' EX VAT</div>'+
      '<div class="stk '+st.cls+'"><i></i>'+E(st.text)+'</div>'+
      '<a class="add" href="#" data-add="'+p.id+'">'+ic("i-bag",15,15)+(st.cls === "out" ? "Pre-order" : "Add to basket")+'</a>'+
    '</div></article>';
}
function section(title, note, items, link){
  if (!items || !items.length) return "";
  return '<section style="padding-top:0"><div class="wrap"><div class="shead"><div><h2>'+E(title)+'</h2>'+
    (note ? '<p>'+E(note)+'</p>' : "")+'</div>'+
    (link ? '<a class="more" href="'+link.href+'">'+E(link.label)+' '+ic("i-arr",15,15)+'</a>' : "")+'</div>'+
    '<div class="grid">'+items.map(card).join("")+'</div></div></section>';
}

/* ---------------- hero slider ---------------- */
function heroSlide(cls, badge, eyebrow, h1, copy, p){
  return '<div class="hero-slide '+cls+'"><div class="wrap">'+
      '<div><span class="eyebrow">'+eyebrow+'</span>'+
        '<h1>'+h1+'</h1>'+
        '<p>'+copy+'</p>'+
        '<div class="cta"><a class="btn btn-volt" href="'+S.url("category",{cat:"PC Components"})+'">Shop components '+ic("i-arr",16,16)+'</a>'+
        '<a class="btn btn-line" style="border-color:rgba(255,255,255,.4);color:#fff" href="'+S.url("brands")+'">Browse brands</a></div>'+
        '<div class="facts"><div><b>'+S.all.length.toLocaleString("en-GB")+'</b><span>Products</span></div>'+
          '<div><b>17:00</b><span>Despatch cut-off</span></div>'+
          '<div><b>3 years</b><span>System warranty</span></div>'+
          '<div><b>'+S.all.length+'</b><span>Products in stock today</span></div></div></div>'+
      '<div class="hcard"><div class="top"><span class="badge">'+badge+'</span>'+
          '<span class="mono" style="color:#71717a">'+E(p.subcategory)+'</span></div>'+
        '<div class="fig"><svg viewBox="0 0 64 44" style="width:250px;height:180px"><use href="#'+p.icon+'"/></svg></div>'+
        '<h3>'+E(p.name)+'</h3><div class="sub">'+E(p.brand)+' · '+E(p.sku)+'</div>'+
        '<div class="specs">'+Object.keys(p.specs).slice(0,4).map(function(k){
          return '<div><span>'+E(k).toUpperCase()+'</span><b>'+E(p.specs[k])+'</b></div>'; }).join("")+'</div>'+
        '<div class="buy"><div class="p"><b>'+M(p.price)+'</b>'+(p.was ? '<s>'+M(p.was)+'</s>' : "")+'</div>'+
          '<a class="btn btn-volt" href="#" data-add="'+p.id+'">Add to basket</a></div>'+
      '</div></div></div>';
}
function wireHero(){
  var slides = $$(".hero-slide"), dots = $$(".hero-dots button");
  if (!slides.length) return;
  var i = 0, n = slides.length, timer;
  function show(idx){
    i = (idx + n) % n;
    slides.forEach(function(s,k){ s.classList.toggle("on", k === i); });
    dots.forEach(function(d,k){ d.classList.toggle("on", k === i); });
  }
  function restart(){ clearInterval(timer); timer = setInterval(function(){ show(i + 1); }, 6000); }
  $(".hero-arrow.next").addEventListener("click", function(){ show(i + 1); restart(); });
  $(".hero-arrow.prev").addEventListener("click", function(){ show(i - 1); restart(); });
  dots.forEach(function(d,k){ d.addEventListener("click", function(){ show(k); restart(); }); });
  restart();
}

/* ---------------- home ---------------- */
function home(){
  var best = S.all.slice().sort(function(a,b){ return b.sold - a.sold; });
  var featured = S.all.filter(function(p){ return p.featured; });
  var hero = S.byId(1) || best[0];
  var slide2 = S.byId(9) || best[1];
  var slide3 = S.byId(3) || best[2];
  var deals = S.all.filter(function(p){ return p.was; })
    .sort(function(a,b){ return (b.was-b.price)/b.was - (a.was-a.price)/a.was; }).slice(0,3);
  var fresh = S.all.slice().sort(function(a,b){ return a.added < b.added ? 1 : -1; }).slice(0,4);
  var tree = S.tree();
  var topBrands = S.brands().filter(function(b){ return b.brand !== "UKCS"; }).slice(0,8);

  document.getElementById("app").innerHTML = header() +
    '<div class="hero"><div class="hero-slides">'+
      heroSlide("s1 on", "Deal of the week", "Blackwell series · in stock today",
        "Every part<br>benchmarked.<br><em>Then boxed.</em>",
        "Twenty-four thousand lines of components, systems and peripherals — specified, stock-checked and tested by people who build machines for a living.", hero)+
      heroSlide("s2", "Featured this week", "AM5 platform · bench-tested",
        "Every socket<br>checked.<br><em>Every time.</em>",
        "Every processor we list is checked against its full spec sheet before it goes live — socket, cache and TDP included. No guesswork at checkout.", slide2)+
      heroSlide("s3", "Featured this week", "Flagship · liquid cooled",
        "The flagship,<br>fully<br><em>verified.</em>",
        "Our top-tier graphics card, bench-tested on arrival and re-checked before every despatch. If it is listed in stock, it has already been through the lab.", slide3)+
    '</div>'+
    '<button class="hero-arrow prev" aria-label="Previous slide"><svg width="18" height="18"><use href="#i-chev" transform="rotate(90 12 12)"/></svg></button>'+
    '<button class="hero-arrow next" aria-label="Next slide"><svg width="18" height="18"><use href="#i-chev" transform="rotate(-90 12 12)"/></svg></button>'+
    '<div class="hero-dots"><button class="on" aria-label="Slide 1"></button><button aria-label="Slide 2"></button><button aria-label="Slide 3"></button></div>'+
    '</div>'+

    '<div class="trust"><div class="wrap">'+
      '<div><span class="ic">'+ic("i-truck",20,20)+'</span><span><b>Free next-day over £75</b><span>DPD one-hour window</span></span></div>'+
      '<div><span class="ic">'+ic("i-shield",20,20)+'</span><span><b>3-year warranty</b><span>Collect &amp; return, UK-wide</span></span></div>'+
      '<div><span class="ic">'+ic("i-wrench",20,20)+'</span><span><b>48-hour stress test</b><span>On every system we build</span></span></div>'+
      '<div><span class="ic">'+ic("i-card",20,20)+'</span><span><b>0% finance to £4,000</b><span>Klarna and PayPal Credit</span></span></div>'+
    '</div></div>'+

    '<section><div class="wrap"><div class="shead"><div><span class="eyebrow">Departments</span>'+
        '<h2>Shop by department</h2><p>Six departments, '+S.all.length+' lines, every one stock-checked this morning.</p></div>'+
        '<a class="more" href="'+S.url("brands")+'">All brands '+ic("i-arr",15,15)+'</a></div>'+
      '<div class="tiles">'+tree.map(function(t){
        var seed = "ukcs-dept-"+t.category.toLowerCase().replace(/[^a-z]+/g,"-");
        return '<a class="tile" href="'+S.url("category",{cat:t.category})+
          '" style="background-image:url(https://picsum.photos/seed/'+seed+'/440/300)">'+
          '<span class="fig">'+ic(CAT_ICON[t.category]||"i-gpu",20,16)+'</span>'+
          '<span><b>'+E(t.category)+'</b><span class="n">'+t.count+' products</span></span></a>'; }).join("")+'</div>'+
    '</div></section>'+

    '<div class="wrap" id="deals"><div class="deal">'+
      '<div class="l"><span class="eyebrow">Ends Sunday midnight</span><h2>Midweek flash deals</h2>'+
        '<p>'+S.all.filter(function(p){ return p.was; }).length+' lines reduced across components, storage and displays.</p>'+
        '<div class="clock" id="clock"><div><b>00</b><span>DAYS</span></div><div><b>00</b><span>HRS</span></div>'+
          '<div><b>00</b><span>MIN</span></div><div><b>00</b><span>SEC</span></div></div></div>'+
      '<div class="r">'+deals.map(function(p){
        var pct = Math.round((p.was-p.price)/p.was*100);
        var soldPct = Math.min(92, Math.max(18, Math.round(p.sold/12)));
        return '<a class="dealcard" href="'+S.url("product",{id:p.id})+'">'+
          '<span class="fig">'+fig(p,120,88)+'</span>'+
          '<span class="br">'+E(p.brand)+'</span><h3>'+E(p.name)+'</h3>'+
          '<span class="pr"><b>'+M(p.price)+'</b><s>'+M(p.was)+'</s><span style="color:var(--deal);font-size:12px;font-weight:600">−'+pct+'%</span></span>'+
          '<span class="bar"><i style="width:'+soldPct+'%"></i></span>'+
          '<span class="left">'+soldPct+'% CLAIMED · '+p.stock+' LEFT</span></a>'; }).join("")+'</div>'+
    '</div></div>'+

    section("This week's best sellers", "Ranked on units shipped over the last seven days.", best.slice(0,4),
            { href:S.url("category",{sort:"best"}), label:"See all" })+

    section("Featured products", "A spread across departments, picked by the team rather than an algorithm.", featured.slice(0,4),
            { href:S.url("category",{featured:1}), label:"See all featured" })+

    '<section style="padding-top:0"><div class="wrap"><div class="feature">'+
      '<div class="txt"><span class="eyebrow">The build room</span>'+
        '<h2>We assemble it, then try to break it.</h2>'+
        '<p>Every system we build is cable-managed, BIOS-tuned and stress-tested for 48 hours before it is boxed. If it is going to fail, we would rather it failed here.</p>'+
        '<div class="cta"><a class="btn btn-ink" href="#">Open the configurator '+ic("i-arr",16,16)+'</a></div></div>'+
      '<div class="fig"><a class="play" href="#">'+ic("i-arr",15,15)+'Watch the build process</a></div>'+
    '</div></div></section>'+

    section("New arrivals", "Added to the catalogue in the last three weeks.", fresh,
            { href:S.url("category",{sort:"newest"}), label:"See all" })+

    '<section style="padding-top:0"><div class="wrap"><div class="shead"><div><span class="eyebrow">Manufacturers</span>'+
        '<h2>Shop by brand</h2></div><a class="more" href="'+S.url("brands")+'">All '+S.brands().length+' brands '+ic("i-arr",15,15)+'</a></div>'+
      '<div class="brands">'+topBrands.map(function(b){
        return '<a href="'+S.url("brand",{b:b.brand})+'">'+E(b.brand)+'</a>'; }).join("")+'</div>'+
    '</div></section>' + footer();

  countdown(); wireChrome(); wireHero();
  document.title = "UK Computer Shop — Voltage";
}

/* ---------------- product ---------------- */
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
      '<div class="gal"><div class="main" id="pdMain"></div>'+
        '<div class="thumbs">'+
          '<span class="on" data-view="product">'+ic("i-search",20,20)+'<b>Product</b></span>'+
          '<span data-view="specs">'+ic("i-cpu",20,20)+'<b>Specification</b></span>'+
          '<span data-view="box">'+ic("i-bag",20,20)+'<b>In the box</b></span>'+
        '</div></div>'+
      '<div class="pdinfo">'+
        '<div class="top"><a href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a><span class="mono" style="color:var(--mute)">'+E(p.subcategory)+'</span></div>'+
        '<h1>'+E(p.name)+'</h1>'+
        '<div class="rate"><i>'+S.stars(p.rating)+'</i><b>'+p.rating+'</b> · '+p.reviews.toLocaleString("en-GB")+' reviews · '+p.sold.toLocaleString("en-GB")+' sold</div>'+
        '<div class="pdids"><span>SKU <b>'+E(p.sku)+'</b></span><span>MPN <b>'+E(p.mpn)+'</b></span><span>EAN <b>'+E(p.ean)+'</b></span></div>'+
        '<div class="pdkey">'+keys.slice(0,6).map(function(k){
          return '<div><span>'+E(k)+'</span><b>'+E(p.specs[k])+'</b></div>'; }).join("")+'</div>'+
        '<div class="pdbuy">'+
          '<div class="pr"><b>'+M(p.price)+'</b>'+(p.was ? '<s>'+M(p.was)+'</s><em>SAVE '+M(p.was-p.price)+'</em>' : "")+'</div>'+
          '<div class="ex">'+S.exVat(p.price)+' EX VAT · 0% FINANCE FROM '+M(p.price/12)+'/MONTH</div>'+
          '<div class="stk '+st.cls+'"><i></i>'+E(st.text)+'</div>'+
          '<div class="pdrow"><div class="qty"><button type="button">−</button><input value="1" data-qty-input><button type="button">+</button></div>'+
            '<a class="btn btn-volt" href="#" data-add="'+p.id+'" data-qty="input">'+ic("i-bag",16,16)+(st.cls==="out"?"Pre-order":"Add to basket")+'</a></div>'+
          (st.cls==="out" ? "" : '<a class="btn btn-ink" href="#" data-buy="'+p.id+'" data-qty="input" style="width:100%;margin-bottom:10px">Buy now — skip the basket</a>')+
          '<div class="pdrow" style="margin-bottom:0">'+
            '<button class="btn btn-line" data-wish="'+p.id+'" style="flex:1">'+ic("i-heart",15,15)+'<span data-wish-label>Wishlist</span></button>'+
            '<button class="btn btn-line" data-compare="'+p.id+'" style="flex:1">'+ic("i-scale",15,15)+'<span data-compare-label>Compare</span></button>'+
          '</div>'+
          '<ul class="perks"><li>'+ic("i-truck",15,15)+'<span>Free next-day delivery, order before 17:00</span></li>'+
            '<li>'+ic("i-shield",15,15)+'<span>'+E(p.specs.Warranty || "Manufacturer warranty")+' · 30-day UK returns</span></li>'+
            '<li>'+ic("i-wrench",15,15)+'<span>Fitting available at our Manchester workshop</span></li></ul>'+
        '</div>'+
      '</div></div>'+
      '<div class="tabbar"><button class="on" data-tab="spec">Specification</button>'+
        '<button data-tab="reviews">Reviews ('+p.reviews.toLocaleString("en-GB")+')</button>'+
        '<button data-tab="delivery">Delivery &amp; returns</button></div>'+
      '<div class="tabpane on" id="spec"><table class="spectable">'+
        keys.map(function(k){ return '<tr><th>'+E(k)+'</th><td>'+E(p.specs[k])+'</td></tr>'; }).join("")+
        '<tr><th>Brand</th><td><a href="'+S.url("brand",{b:p.brand})+'" style="text-decoration:underline;font-weight:600">'+E(p.brand)+'</a></td></tr>'+
        '<tr><th>Part numbers</th><td>SKU '+E(p.sku)+' · MPN '+E(p.mpn)+' · EAN '+E(p.ean)+'</td></tr></table></div>'+
      '<div class="tabpane" id="reviews"><div class="rvsum">'+
        '<div class="rvbig"><b>'+p.rating+'</b><i>'+S.stars(p.rating)+'</i><span>'+p.reviews.toLocaleString("en-GB")+' verified reviews</span></div>'+
        '<div class="rvbars">'+dist.map(function(v,i){
          return '<div><span>'+(5-i)+' star</span><span class="bar"><i style="width:'+v+'%"></i></span><span>'+v+'%</span></div>'; }).join("")+'</div></div>'+
        revs.map(function(r){ return '<div class="rv"><div class="top"><span class="who">'+E(r.who)+(r.v?'<em>VERIFIED BUYER</em>':"")+'</span>'+
          '<span class="date">March 2026</span></div><i>'+S.stars(r.r)+'</i><h4>'+E(r.t)+'</h4><p>'+E(r.b)+'</p></div>'; }).join("")+'</div>'+
      '<div class="tabpane" id="delivery"><p style="margin:0 0 14px;font-size:14.5px">Free next-day delivery on orders over £75, despatched the same day when ordered before 17:00 Monday to Friday. Saturday delivery is £7.95 at checkout.</p>'+
        '<p style="margin:0;font-size:14.5px;color:var(--body)">Returns accepted within 30 days in original packaging. Faulty items go through our RMA process — we collect, test and replace, carriage free both ways.</p></div>'+
    '</div>'+
    section("Related products", "Alternatives in " + p.subcategory + ", at a similar price.", d.related,
            { href:S.url("category",{sub:p.subcategory}), label:"All "+p.subcategory })+
    section("Frequently bought together", "Compatibility checked against this part — socket, memory profile and PSU headroom.", d.alsoBought)+
    section("Recommended for you", d.recentlyViewed.length ? "Based on what you have been looking at." : "Popular right now across the catalogue.", d.recommended)+
    '<section style="padding-top:0"><div class="wrap"><div class="shead"><div><h2>Recently viewed</h2></div></div>'+
      (d.recentlyViewed.length
        ? '<div class="grid">'+d.recentlyViewed.slice(0,4).map(card).join("")+'</div>'
        : '<p style="color:var(--mute);font-size:14px;margin:0">Nothing else viewed yet this session — browse the catalogue and it will start building up here.</p>')+
    '</div></section>'+
    footer();
  wireGallery(p); wireTabs(); wireChrome();
  document.title = p.name + " — UK Computer Shop";
}

/* ---------------- brand + brands ---------------- */
function brandCard(b){
  return '<a class="bcard" href="'+S.url("brand",{b:b.brand})+'"><span class="mark">'+E(b.brand.slice(0,2).toUpperCase())+'</span>'+
    '<h3>'+E(b.brand)+'</h3><p>'+E(b.note.length > 100 ? b.note.slice(0,98)+"…" : b.note)+'</p>'+
    '<span class="meta"><span><b>'+b.count+'</b> LINES</span><span><b>'+b.rating.toFixed(1)+'</b>★</span>'+
    '<span>FROM <b>'+M(b.min).replace(".00","")+'</b></span></span></a>';
}
function brandPage(){
  var d = Pages.brand(); if (!d) return; var b = d.b;
  document.getElementById("app").innerHTML = header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="bhero" style="background-image:url(https://picsum.photos/seed/ukcs-brand-'+encodeURIComponent(b.brand.toLowerCase().replace(/[^a-z0-9]+/g,"-"))+'/1200/700)">'+
      '<div><div class="mark">'+E(b.brand.slice(0,2).toUpperCase())+'</div><h1>'+E(b.brand)+'</h1><p>'+E(b.note)+'</p></div>'+
      '<div class="bstats"><div><b>'+b.count+'</b><span>Products</span></div><div><b>'+b.rating.toFixed(1)+'</b><span>Avg rating</span></div>'+
      '<div><b>'+M(b.min).replace(".00","")+'</b><span>From</span></div><div><b>'+b.deals+'</b><span>On offer</span></div></div></div>'+
      '<div class="bchips"><a class="on" href="#">All<span>'+b.count+'</span></a>'+
        d.subcats.map(function(s2){ return '<a href="'+S.url("category",{sub:s2})+'">'+E(s2)+'<span>'+d.bySub[s2].length+'</span></a>'; }).join("")+'</div></div>'+
    section("Best sellers from " + b.brand, "Ranked by units shipped over the last ninety days.", d.items.slice(0,4))+
    (d.deals.length ? section("Current " + b.brand + " offers", "Reduced until Sunday midnight.", d.deals) : "")+
    (d.newest.length ? section("New from " + b.brand, "Most recently added to the catalogue.", d.newest) : "")+
    section("Recommended for you", "Pairs well with " + b.brand + " hardware.", d.recommended)+
    '<section style="padding-top:0"><div class="wrap"><div class="shead"><div><span class="eyebrow">Alternatives</span>'+
      '<h2>Other brands to consider</h2><p>Stocked in the same departments as '+E(b.brand)+'.</p></div>'+
      '<a class="more" href="'+S.url("brands")+'">All brands '+ic("i-arr",15,15)+'</a></div>'+
      '<div class="bgrid">'+d.siblings.slice(0,4).map(brandCard).join("")+'</div></div></section>'+
    footer();
  wireChrome();
  document.title = b.brand + " — UK Computer Shop";
}
function brandsPage(){
  var d = Pages.brands();
  document.getElementById("app").innerHTML = header() + crumbs(d.crumbs) +
    '<div class="wrap"><div class="shead" style="margin-top:12px"><div><span class="eyebrow">Manufacturers</span>'+
      '<h2>All brands</h2><p>'+d.all.length+' manufacturers and '+d.totalProducts.toLocaleString("en-GB")+
      ' products. Every brand page carries live stock, current offers and new arrivals.</p></div></div>'+
      '<div class="alpha">'+"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function(L){
        return d.letters[L] ? '<a href="#L'+L+'">'+L+'</a>' : '<a class="dim">'+L+'</a>'; }).join("")+'</div>'+
      '<div class="bgrid">'+d.featured.map(brandCard).join("")+'</div>'+
      '<div style="margin-top:40px">'+d.keys.map(function(L){
        return '<div class="azblock" id="L'+L+'"><div class="L">'+L+'</div><div class="azlist">'+
          d.letters[L].map(function(b){ return '<a href="'+S.url("brand",{b:b.brand})+'">'+E(b.brand)+'<span>'+b.count+'</span></a>'; }).join("")+
        '</div></div>'; }).join("")+'</div></div>'+
    section("Recommended for you", "Popular across the brands you have been browsing.", d.recommended)+
    footer();
  wireChrome();
  document.title = "All brands — UK Computer Shop";
}

/* ---------------- shared behaviour ---------------- */

/* Three honest gallery views built from real catalogue data — not stock
   photos standing in for a specific SKU's actual appearance. */
function wireGallery(p){
  var main = document.getElementById("pdMain"); if (!main) return;
  var views = {
    product: function(){
      return (p.was ? '<span class="flag">SAVE '+M(p.was-p.price)+'</span>' : "")+
        '<svg viewBox="0 0 64 44" style="width:300px;height:220px"><use href="#'+p.icon+'"/></svg>';
    },
    specs: function(){
      var keys = Object.keys(p.specs);
      return '<div class="specview">'+keys.map(function(k){
        return '<div><span>'+E(k)+'</span><b>'+E(p.specs[k])+'</b></div>'; }).join("")+'</div>';
    },
    box: function(){
      var items = p.inBox || ["Product", "Documentation"];
      return '<ul class="boxview">'+items.map(function(it){
        return '<li>'+ic("i-shield",16,16)+'<span>'+E(it)+'</span></li>'; }).join("")+'</ul>';
    }
  };
  function show(v){
    main.innerHTML = views[v]();
    document.querySelectorAll(".gal .thumbs span").forEach(function(t){
      t.classList.toggle("on", t.dataset.view === v);
    });
  }
  document.querySelectorAll(".gal .thumbs span").forEach(function(t){
    t.addEventListener("click", function(){ show(t.dataset.view); });
  });
  show("product");
}

function wireTabs(){
  $$(".tabbar button").forEach(function(b){
    b.addEventListener("click", function(){
      $$(".tabbar button").forEach(function(x){ x.classList.remove("on"); });
      $$(".tabpane").forEach(function(x){ x.classList.remove("on"); });
      b.classList.add("on"); document.getElementById(b.dataset.tab).classList.add("on");
    });
  });
  $$(".qty button").forEach(function(b){
    b.addEventListener("click", function(){
      var i = $(".qty input");
      i.value = Math.max(1, (+i.value || 1) + (b.textContent === "+" ? 1 : -1));
    });
  });
}
function countdown(){
  var el = $("#clock"); if (!el) return;
  (function tick(){
    if (!document.getElementById("clock")) return;
    var now = new Date(), end = new Date(now);
    end.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7)); end.setHours(0,0,0,0);
    var s = Math.max(0, Math.floor((end - now)/1000));
    var d = Math.floor(s/86400); s -= d*86400;
    var h = Math.floor(s/3600);  s -= h*3600;
    var m = Math.floor(s/60);    s -= m*60;
    var b = el.querySelectorAll("b"), pad = function(n){ return String(n).padStart(2,"0"); };
    b[0].textContent = pad(d); b[1].textContent = pad(h); b[2].textContent = pad(m); b[3].textContent = pad(s);
    setTimeout(tick, 1000);
  })();
}

/* search modal + cart drawer */
function wireChrome(){
  var modal = $("#smodal"), mq = $("#mq"), sbody = $("#sbody"), hi = -1;
  function openSearch(seed){
    modal.classList.add("on"); document.body.classList.add("lock");
    if (seed) mq.value = seed;
    mq.focus(); results();
  }
  function closeSearch(){ modal.classList.remove("on"); document.body.classList.remove("lock"); hi = -1; }
  function results(){
    var q = mq.value.trim().toLowerCase();
    if (q.length < 2){
      sbody.innerHTML = '<div class="sgroup">Popular searches</div>'+
        ["RTX 5080","DDR5 6000 CL30","9800X3D","OLED 240Hz","850W Gold"].map(function(t){
          return '<div class="sres" data-seed="'+E(t)+'"><span class="fig">'+ic("i-search",15,15)+'</span>'+
                 '<span class="tx"><b>'+E(t)+'</b></span></div>'; }).join("");
      bind(); return;
    }
    var hits = S.all.filter(function(p){
      return (p.name+" "+p.brand+" "+p.sku+" "+p.mpn+" "+p.subcategory).toLowerCase().indexOf(q) > -1;
    }).sort(function(a,b){ return b.sold - a.sold; }).slice(0,7);
    var brands = S.uniq(S.all.map(function(p){ return p.brand; }))
      .filter(function(b){ return b.toLowerCase().indexOf(q) > -1; }).slice(0,3);
    var html = "";
    if (hits.length) html += '<div class="sgroup">Products</div>'+hits.map(function(p){
      return '<div class="sres" data-go="'+S.url("product",{id:p.id})+'"><span class="fig">'+fig(p,32,24)+'</span>'+
        '<span class="tx"><b>'+E(p.name)+'</b><span>'+E(p.sku)+' · '+E(p.subcategory)+'</span></span>'+
        '<span class="pr">'+M(p.price)+'</span></div>'; }).join("");
    if (brands.length) html += '<div class="sgroup">Brands</div>'+brands.map(function(b){
      return '<div class="sres" data-go="'+S.url("brand",{b:b})+'"><span class="fig">'+ic("i-scale",15,15)+'</span>'+
        '<span class="tx"><b>'+E(b)+'</b><span>brand page</span></span></div>'; }).join("");
    if (!html) html = '<div class="sgroup">No matches for “'+E(mq.value)+'”</div>';
    sbody.innerHTML = html; hi = -1; bind();
  }
  function bind(){
    $$(".sres", sbody).forEach(function(r){
      r.addEventListener("click", function(){
        if (r.dataset.go) location.href = r.dataset.go;
        else { mq.value = r.dataset.seed; results(); }
      });
    });
  }
  if (mq){
    mq.addEventListener("input", results);
    mq.addEventListener("keydown", function(e){
      var items = $$(".sres", sbody);
      if (e.key === "ArrowDown" || e.key === "ArrowUp"){
        if (!items.length) return; e.preventDefault();
        hi = (hi + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach(function(x,i){ x.classList.toggle("hi", i === hi); });
        items[hi].scrollIntoView({ block:"nearest" });
      } else if (e.key === "Enter" && hi > -1){ e.preventDefault(); items[hi].click(); }
      else if (e.key === "Escape") closeSearch();
    });
  }
  if (modal) modal.addEventListener("click", function(e){ if (e.target === modal) closeSearch(); });
  var sform = $("#sform"), sq = $("#sq");
  if (sform) sform.addEventListener("submit", function(e){ e.preventDefault(); openSearch(sq.value); });
  if (sq) sq.addEventListener("focus", function(){ openSearch(sq.value); sq.blur(); });
  document.addEventListener("keydown", function(e){
    if ((e.metaKey || e.ctrlKey) && e.key === "k"){ e.preventDefault(); openSearch(); }
    if (e.key === "Escape"){ closeSearch(); closeCart(); }
  });

  var drawer = $("#drawer"), scrim = $("#scrim");
  function paintCart(){
    var t = S.Basket.totals();
    $("#dbody").innerHTML = t.lines.length
      ? t.lines.map(function(l){
          return '<div class="dline"><span class="fig">'+fig(l.p,42,30)+'</span>'+
            '<span><b>'+E(l.p.name)+'</b><span>'+l.qty+' × '+M(l.p.price)+'</span>'+
            '<button class="rm" data-rm="'+l.p.id+'">Remove</button></span>'+
            '<span class="pr">'+M(l.line)+'</span></div>'; }).join("")
      : '<div class="dempty">'+ic("i-bag",34,34)+'<p>Your basket is empty.</p></div>';
    $("#dfoot").innerHTML = t.lines.length
      ? '<div class="dfoot"><div class="row"><span>Goods</span><b>'+M(t.goods)+'</b></div>'+
        '<div class="row"><span>'+E(t.method.label)+'</span><b>'+(t.shippingFree ? "Free" : M(t.shipping))+'</b></div>'+
        '<div class="row tot"><span>Total</span><b>'+M(t.total)+'</b></div>'+
        '<div class="btns"><a class="btn btn-volt" href="'+S.url("checkout")+'">Checkout</a>'+
        '<a class="btn btn-line" href="'+S.url("basket")+'">View basket</a></div></div>'
      : "";
    $$("[data-rm]").forEach(function(b){
      b.addEventListener("click", function(){ S.Basket.remove(b.dataset.rm); S.refreshBasketUI(); paintCart(); });
    });
  }
  function openCart(){ paintCart(); drawer.classList.add("on"); scrim.classList.add("on"); document.body.classList.add("lock"); }
  function closeCart(){ if (drawer) drawer.classList.remove("on"); if (scrim) scrim.classList.remove("on"); document.body.classList.remove("lock"); }
  var cb = $("#cartBtn");
  if (cb) cb.addEventListener("click", openCart);
  if ($("#dclose")) $("#dclose").addEventListener("click", closeCart);
  if (scrim) scrim.addEventListener("click", closeCart);
  /* opening the drawer after an add is the whole point of having one */
  document.addEventListener("click", function(e){
    if (e.target.closest("[data-add]")) setTimeout(function(){ if (drawer) openCart(); }, 60);
  });
  S.refreshBasketUI();
}

window.DesignE = { home:home, product:productPage, brand:brandPage, brands:brandsPage,
  parts:{ header:header, footer:footer, crumbs:crumbs, card:card, brandCard:brandCard,
          section:function(t,n,i,l){ return section(t,n,i,l); } } };
})();
