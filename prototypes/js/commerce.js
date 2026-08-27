/* Category, basket, checkout and account pages.
   The structure is shared across all four designs; each design supplies its own
   chrome and product card, and its own stylesheet gives these classes their look. */
(function (root) {
"use strict";
var S = root.Shop, E = S.esc, M = S.money;
/* Order Details/Cancel/Return pages exist only for the design(s) listed here.
   Batch-2 built this for design 05 first; adding a design's number here (once
   its 0X-order-*.html shells exist) is the entire "roll out" step for these
   three pages — no logic changes needed. */
var ORDER_PAGES_ROLLED_OUT = ["05"];
function hasOrderPages(){ return ORDER_PAGES_ROLLED_OUT.indexOf(S.design) > -1; }
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return [].slice.call((r||document).querySelectorAll(s)); };
function mount(html){ document.getElementById("app").innerHTML = html; }
function icon(id, w, h){ return '<svg width="'+w+'" height="'+(h||w)+'"><use href="#'+id+'"/></svg>'; }
function thumb(p, w, h){ return '<svg viewBox="0 0 64 44" style="width:'+w+'px;height:'+h+'px"><use href="#'+p.icon+'"/></svg>'; }

/* ------------------------------------------------ category listing */
function category(D){
  var d = Pages.category(); if (!d) return;
  var st = { sub:d.sub || "All", brand:"All", sort:"best", page:1, per:12 };
  var SORTS = {
    best:function(a,b){ return b.sold - a.sold; },
    "price-asc":function(a,b){ return a.price - b.price; },
    "price-desc":function(a,b){ return b.price - a.price; },
    rating:function(a,b){ return b.rating - a.rating || b.reviews - a.reviews; },
    newest:function(a,b){ return a.added < b.added ? 1 : -1; },
    discount:function(a,b){ return (b.was?(b.was-b.price)/b.was:0) - (a.was?(a.was-a.price)/a.was:0); }
  };
  mount(D.header() + D.crumbs(d.crumbs) +
    '<div class="wrap">'+
      '<div class="cat-head"><div><h1>'+E(d.label)+'</h1>'+
        '<p><b id="catCount">'+d.items.length+'</b> products'+(d.parent ? ' in <a href="'+S.url("category",{cat:d.parent})+'">'+E(d.parent)+'</a>' : "")+
        ' · from '+M(d.min)+' · '+d.brands.length+' brands</p></div></div>'+
      '<div class="cat-filters">'+
        '<div class="cat-chips" id="chips"></div>'+
        '<div class="cat-tools">'+
          '<select class="cat-sel" id="fbrand"><option value="All">All brands</option>'+
            d.brands.map(function(b){ return '<option>'+E(b)+'</option>'; }).join("")+'</select>'+
          '<select class="cat-sel" id="fsort">'+
            '<option value="best">Sort: best selling</option><option value="price-asc">Price: low to high</option>'+
            '<option value="price-desc">Price: high to low</option><option value="rating">Customer rating</option>'+
            '<option value="newest">Newest arrivals</option><option value="discount">Biggest saving</option>'+
          '</select></div>'+
      '</div>'+
      '<div id="catres"></div>'+
      '<div class="cat-more" id="moreWrap" hidden><button class="cat-morebtn" id="more">Load more</button></div>'+
    '</div>'+
    D.section("Recommended for you", "Popular with people browsing " + d.label + ".", d.recommended) +
    D.footer());

  function pool(){
    var src = st.sub === "All" ? d.items : (d.bySub[st.sub] || []);
    return src.filter(function(p){ return st.brand === "All" || p.brand === st.brand; }).sort(SORTS[st.sort]);
  }
  function draw(){
    var list = pool(), show = list.slice(0, st.page * st.per);
    $("#catCount").textContent = list.length;
    $("#chips").innerHTML = ["All"].concat(d.subcats).map(function(s2){
      var n = s2 === "All" ? d.items.length : (d.bySub[s2] || []).length;
      return '<button class="cat-chip'+(st.sub === s2 ? " on" : "")+'" data-sub="'+E(s2)+'">'+E(s2)+' <span>'+n+'</span></button>';
    }).join("");
    $("#catres").innerHTML = show.length
      ? '<div class="cat-grid">'+show.map(D.card).join("")+'</div>'
      : '<div class="cat-empty"><h3>Nothing matches that combination</h3><p>Try a different brand, or clear the sub-category filter.</p>'+
        '<button class="cat-morebtn" id="reset">Clear filters</button></div>';
    $("#moreWrap").hidden = show.length >= list.length;
    if (!$("#moreWrap").hidden) $("#more").textContent = "Load more — " + (list.length - show.length) + " remaining";
    $$("#chips .cat-chip").forEach(function(c){
      c.addEventListener("click", function(){ st.sub = c.dataset.sub; st.page = 1; draw(); });
    });
    if ($("#reset")) $("#reset").addEventListener("click", function(){ st.sub = "All"; st.brand = "All"; $("#fbrand").value = "All"; st.page = 1; draw(); });
  }
  $("#fbrand").addEventListener("change", function(e){ st.brand = e.target.value; st.page = 1; draw(); });
  $("#fsort").addEventListener("change", function(e){ st.sort = e.target.value; st.page = 1; draw(); });
  $("#more").addEventListener("click", function(){ st.page++; draw(); });
  draw();
  document.title = d.label + " — UK Computer Shop";
}

/* ------------------------------------------------ basket */
function basket(D){
  function render(){
    var d = Pages.basket();
    mount(D.header() + D.crumbs(d.crumbs) +
      '<div class="wrap"><div class="bk-head"><h1>Your basket</h1>'+
        (d.empty ? "" : '<span>'+d.t.count+' item'+(d.t.count === 1 ? "" : "s")+'</span>')+'</div>'+
      (d.empty
        ? '<div class="bk-empty">'+icon("i-bag",34,34)+'<h3>Your basket is empty</h3>'+
          '<p>Once you add something it will show here, with delivery and VAT worked out.</p>'+
          '<a class="bk-cta" href="'+S.url("home")+'">Browse the catalogue</a></div>'
        : '<div class="bk-layout"><div class="bk-lines">'+
            d.t.lines.map(function(l){
              var stk = S.stockText(l.p);
              return '<div class="bk-line" data-id="'+l.p.id+'">'+
                '<a class="bk-fig" href="'+S.url("product",{id:l.p.id})+'">'+thumb(l.p,86,62)+'</a>'+
                '<div class="bk-info"><a class="bk-brand" href="'+S.url("brand",{b:l.p.brand})+'">'+E(l.p.brand)+'</a>'+
                  '<h3><a href="'+S.url("product",{id:l.p.id})+'">'+E(l.p.name)+'</a></h3>'+
                  '<div class="bk-meta"><span>SKU '+E(l.p.sku)+'</span><span class="bk-'+stk.cls+'">'+E(stk.text)+'</span></div></div>'+
                '<div class="bk-qty"><button data-act="dec">−</button><input value="'+l.qty+'" data-act="qty" inputmode="numeric"><button data-act="inc">+</button></div>'+
                '<div class="bk-money"><b>'+M(l.line)+'</b>'+
                  (l.qty > 1 ? '<span>'+M(l.p.price)+' each</span>' : "")+
                  (l.p.was ? '<span class="bk-save">Saving '+M((l.p.was - l.p.price) * l.qty)+'</span>' : "")+
                  '<button class="bk-rm" data-act="rm">Remove</button></div>'+
              '</div>';
            }).join("")+
            '<a class="bk-continue" href="'+S.url("home")+'">← Continue shopping</a>'+
          '</div>'+
          '<aside class="bk-sum"><h2>Summary</h2>'+
            '<div class="bk-row"><span>Goods total</span><b>'+M(d.t.goods)+'</b></div>'+
            (d.t.saved ? '<div class="bk-row bk-disc"><span>You save</span><b>−'+M(d.t.saved)+'</b></div>' : "")+
            '<div class="bk-row"><span>'+E(d.t.method.label)+'</span><b>'+(d.t.shippingFree ? "Free" : M(d.t.shipping))+'</b></div>'+
            (d.t.toFreeDelivery > 0
              ? '<div class="bk-nudge">Add '+M(d.t.toFreeDelivery)+' more for free delivery</div>' : "")+
            '<div class="bk-row bk-total"><span>Total</span><b>'+M(d.t.total)+'</b></div>'+
            '<div class="bk-vat">Includes '+M(d.t.vat)+' VAT · '+M(d.t.exVat)+' ex. VAT</div>'+
            '<a class="bk-cta" href="'+S.url("checkout")+'">Checkout '+icon("i-arr",15,15)+'</a>'+
            '<div class="bk-pay"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>PAYPAL</span><span>KLARNA</span></div>'+
            '<ul class="bk-perks"><li>'+icon("i-truck",14,14)+'<span>Free next-day delivery over £75</span></li>'+
              '<li>'+icon("i-shield",14,14)+'<span>30-day returns, UK warranty support</span></li>'+
              '<li>'+icon("i-card",14,14)+'<span>0% finance available at checkout</span></li></ul>'+
          '</aside></div>')+
      '</div>'+
      (d.goesWith.length ? D.section("Goes with what's in your basket", "Compatibility checked against the items above.", d.goesWith) : "")+
      (d.empty ? D.section("Recommended for you", "Popular right now across the catalogue.", d.recommended) : "")+
      (d.recentlyViewed.length ? D.section("Recently viewed", null, d.recentlyViewed) : "")+
      D.footer());

    $$(".bk-line").forEach(function(row){
      var id = Number(row.dataset.id);
      row.addEventListener("click", function(e){
        var b = e.target.closest("[data-act]"); if (!b) return;
        var a = b.dataset.act;
        var cur = S.Basket.raw().filter(function(l){ return l.id === id; })[0];
        if (a === "inc") S.Basket.setQty(id, (cur ? cur.qty : 0) + 1);
        else if (a === "dec") S.Basket.setQty(id, (cur ? cur.qty : 0) - 1);
        else if (a === "rm") S.Basket.remove(id);
        else return;
        render();
      });
      var input = row.querySelector('[data-act="qty"]');
      if (input) input.addEventListener("change", function(){ S.Basket.setQty(id, input.value); render(); });
    });
    document.title = "Basket — UK Computer Shop";
  }
  render();
}

/* ------------------------------------------------ checkout
   A design prototype: the payment step shows the layout with placeholder values
   and inert inputs. It deliberately does not accept real card details. */
function checkout(D){
  var step = 1;
  function render(){
    var d = Pages.checkout();
    if (d.empty){
      mount(D.header() + D.crumbs(d.crumbs) +
        '<div class="wrap"><div class="bk-empty">'+icon("i-bag",34,34)+'<h3>There is nothing to check out</h3>'+
        '<p>Add something to your basket first.</p><a class="bk-cta" href="'+S.url("home")+'">Browse the catalogue</a></div></div>'+
        D.footer());
      return;
    }
    var steps = ["Delivery", "Payment", "Review"];
    mount(D.header() + D.crumbs(d.crumbs) +
      '<div class="wrap">'+
        '<div class="ck-steps">'+steps.map(function(s2,i){
          return '<div class="ck-step'+(i+1 === step ? " on" : "")+(i+1 < step ? " done" : "")+'"><span>'+(i+1)+'</span>'+s2+'</div>';
        }).join("")+'</div>'+
        '<div class="ck-note">Prototype checkout — no order is placed and no payment details are accepted.</div>'+
        '<div class="ck-layout"><div class="ck-main">'+
          (step === 1 ? deliveryStep(d) : step === 2 ? paymentStep(d) : reviewStep(d))+
        '</div>'+
        '<aside class="ck-sum"><h2>Order summary</h2>'+
          d.t.lines.map(function(l){
            return '<div class="ck-item"><span class="ck-thumb">'+thumb(l.p,44,32)+'</span>'+
              '<span class="ck-name">'+E(l.p.name)+'<em>Qty '+l.qty+'</em></span><b>'+M(l.line)+'</b></div>';
          }).join("")+
          '<div class="bk-row"><span>Goods</span><b>'+M(d.t.goods)+'</b></div>'+
          '<div class="bk-row"><span>'+E(d.t.method.label)+'</span><b>'+(d.t.shippingFree ? "Free" : M(d.t.shipping))+'</b></div>'+
          '<div class="bk-row bk-total"><span>Total</span><b>'+M(d.t.total)+'</b></div>'+
          '<div class="bk-vat">Includes '+M(d.t.vat)+' VAT</div>'+
          '<a class="ck-edit" href="'+S.url("basket")+'">Edit basket</a>'+
        '</aside></div></div>' + D.footer());

    $$("[data-step]").forEach(function(b){
      b.addEventListener("click", function(){
        var n = Number(b.dataset.step);
        if (n === 4){ placeOrder(D, d); return; }
        step = n; render(); window.scrollTo({ top:0, behavior:"smooth" });
      });
    });
    $$('input[name="ship"]').forEach(function(r){
      r.addEventListener("change", function(){ S.Basket.method(r.value); render(); });
    });
    var billSame = $("#billSame"), billFields = $("#billFields");
    if (billSame) billSame.addEventListener("change", function(){ billFields.hidden = billSame.checked; });
    document.title = "Checkout — UK Computer Shop";
  }
  function deliveryStep(d){
    return '<section class="ck-block"><h2>Delivery address</h2>'+
      '<div class="ck-addr">'+d.addresses.map(function(a){
        return '<label class="ck-card'+(a.default ? " on" : "")+'"><input type="radio" name="addr"'+(a.default ? " checked" : "")+'>'+
          '<span><b>'+E(a.label)+'</b>'+E(a.name)+'<br>'+a.lines.map(E).join("<br>")+'<br>'+E(a.phone)+'</span></label>';
      }).join("")+'</div>'+
      '<button class="ck-ghost">+ Add a new address</button></section>'+
      '<section class="ck-block"><h2>Billing address</h2>'+
        '<label class="od-returnrow" style="margin-bottom:12px"><input type="checkbox" id="billSame" checked>'+
          '<span class="ac-oiname">Same as delivery address</span></label>'+
        '<div id="billFields" hidden>'+
          '<div class="ck-two"><div class="ck-field"><label>Full name</label><input placeholder="Name on the invoice"></div>'+
            '<div class="ck-field"><label>Company (optional)</label><input placeholder="For a VAT invoice"></div></div>'+
          '<div class="ck-field"><label>Address line 1</label><input placeholder="Street address"></div>'+
          '<div class="ck-two"><div class="ck-field"><label>Town / city</label><input></div>'+
            '<div class="ck-field"><label>Postcode</label><input></div></div>'+
        '</div></section>'+
      '<section class="ck-block"><h2>Delivery method</h2><div class="ck-ship">'+
        d.delivery.map(function(m){
          var free = m.freeOver !== null && d.t.goods >= m.freeOver;
          return '<label class="ck-card'+(m.id === d.chosen ? " on" : "")+'"><input type="radio" name="ship" value="'+m.id+'"'+(m.id === d.chosen ? " checked" : "")+'>'+
            '<span><b>'+E(m.label)+'</b>'+E(m.note)+'</span><em>'+(free ? "Free" : M(m.price))+'</em></label>';
        }).join("")+'</div></section>'+
      '<div class="ck-actions"><a class="ck-back" href="'+S.url("basket")+'">← Back to basket</a>'+
        '<button class="ck-next" data-step="2">Continue to payment '+icon("i-arr",15,15)+'</button></div>';
  }
  function paymentStep(){
    return '<section class="ck-block"><h2>Payment</h2>'+
      '<div class="ck-pm">'+
        '<label class="ck-card on"><input type="radio" name="pay" checked><span><b>Card</b>Visa, Mastercard, Amex</span></label>'+
        '<label class="ck-card"><input type="radio" name="pay"><span><b>PayPal</b>Redirects to PayPal</span></label>'+
        '<label class="ck-card"><input type="radio" name="pay"><span><b>Klarna</b>Pay in 3, interest free</span></label>'+
        '<label class="ck-card"><input type="radio" name="pay"><span><b>0% finance</b>12 months, subject to status</span></label>'+
      '</div>'+
      '<div class="ck-fake"><div class="ck-fakebar">Layout preview · inputs disabled</div>'+
        '<div class="ck-field"><label>Name on card</label><input value="Placeholder name" disabled></div>'+
        '<div class="ck-field"><label>Card number</label><input value="•••• •••• •••• ••••" disabled></div>'+
        '<div class="ck-two"><div class="ck-field"><label>Expiry</label><input value="MM / YY" disabled></div>'+
          '<div class="ck-field"><label>Security code</label><input value="•••" disabled></div></div>'+
        '<p class="ck-disclaim">This is a design prototype. Card fields are disabled on purpose — in a real build this step would be handed to a payment provider rather than collected by the site.</p>'+
      '</div></section>'+
      '<div class="ck-actions"><button class="ck-back" data-step="1">← Back to delivery</button>'+
        '<button class="ck-next" data-step="3">Review order '+icon("i-arr",15,15)+'</button></div>';
  }
  function reviewStep(d){
    return '<section class="ck-block"><h2>Review your order</h2>'+
      '<div class="ck-rev"><div><h4>Delivering to</h4><p>'+E(d.address.name)+'<br>'+d.address.lines.map(E).join("<br>")+'</p></div>'+
        '<div><h4>Method</h4><p>'+E(d.t.method.label)+'<br>'+E(d.t.method.note)+'</p></div>'+
        '<div><h4>Paying by</h4><p>Card<br>Not collected in this prototype</p></div></div>'+
      '<div class="ck-lines">'+d.t.lines.map(function(l){
        return '<div class="ck-item"><span class="ck-thumb">'+thumb(l.p,44,32)+'</span>'+
          '<span class="ck-name">'+E(l.p.name)+'<em>SKU '+E(l.p.sku)+' · Qty '+l.qty+'</em></span><b>'+M(l.line)+'</b></div>';
      }).join("")+'</div></section>'+
      '<div class="ck-actions"><button class="ck-back" data-step="2">← Back to payment</button>'+
        '<button class="ck-next" data-step="4">Place order — '+M(d.t.total)+'</button></div>';
  }
  function placeOrder(D2, d){
    var ref = "UKCS-" + (210000 + Math.floor(Math.random() * 8999));
    var lines = d.t.lines.slice(), total = d.t.total, method = d.t.method;
    S.Basket.clear();
    mount(D2.header() +
      '<div class="wrap"><div class="ck-done">'+icon("i-shield",34,34)+
        '<h1>Order placed</h1><p class="ck-ref">Reference <b>'+ref+'</b></p>'+
        '<p>A confirmation would normally be emailed to you. Nothing was charged — this is a prototype.</p>'+
        '<div class="ck-donebox">'+lines.map(function(l){
          return '<div class="ck-item"><span class="ck-thumb">'+thumb(l.p,44,32)+'</span>'+
            '<span class="ck-name">'+E(l.p.name)+'<em>Qty '+l.qty+'</em></span><b>'+M(l.line)+'</b></div>';
        }).join("")+
        '<div class="bk-row bk-total"><span>Paid</span><b>'+M(total)+'</b></div>'+
        '<div class="bk-vat">'+E(method.label)+' · '+E(method.note)+'</div></div>'+
        '<div class="ck-doneacts"><a class="bk-cta" href="'+S.url("account",{tab:"orders"})+'">Track this order</a>'+
        '<a class="ck-back" href="'+S.url("home")+'">Continue shopping</a></div>'+
      '</div></div>' + D2.footer());
    document.title = "Order " + ref + " — UK Computer Shop";
  }
  render();
}

/* ------------------------------------------------ account */
function account(D){
  var d = Pages.account();
  var tab = d.tab;
  var TABS = [["overview","Overview"],["orders","Orders"],["wishlist","Wishlist"],["addresses","Addresses"],["details","Details"]];
  var body =
    tab === "orders"    ? ordersView(d) :
    tab === "wishlist"  ? wishView(d, D) :
    tab === "addresses" ? addrView(d) :
    tab === "details"   ? detailsView() : overview(d);
  mount(D.header() + D.crumbs(d.crumbs) +
    '<div class="wrap"><div class="ac-head"><div><h1>My account</h1><p>Signed in as <b>prolay@example.com</b> · member since 2021</p></div>'+
      '<button class="ac-out" id="acSignOut">Sign out</button></div>'+
      '<div class="ac-layout"><nav class="ac-nav">'+
        TABS.map(function(t){ return '<a class="'+(t[0] === tab ? "on" : "")+'" href="'+S.url("account",{tab:t[0]})+'">'+t[1]+'</a>'; }).join("")+
      '</nav><div class="ac-main">'+body+'</div></div></div>'+
    (tab === "overview" ? D.section("Recommended for you", "Based on your orders and browsing.", d.recommended) : "")+
    D.footer());
  document.title = "My account — UK Computer Shop";
  var signOutBtn = $("#acSignOut");
  if (signOutBtn) signOutBtn.addEventListener("click", function(){
    S.flash("Signed out — this is a design prototype, no account was created");
  });
  $$(".ac-check input").forEach(function(cb){
    cb.addEventListener("change", function(){ S.flash("Preference saved"); });
  });

  function overview(d2){
    return '<div class="ac-stats">'+
      '<div><b>'+d2.orders.length+'</b><span>Orders placed</span></div>'+
      '<div><b>'+M(d2.spend)+'</b><span>Lifetime spend</span></div>'+
      '<div><b>'+d2.wishlist.length+'</b><span>Saved items</span></div>'+
      '<div><b>'+d2.basketCount+'</b><span>In basket</span></div></div>'+
      '<section class="ac-block"><div class="ac-blockhead"><h2>Latest order</h2>'+
        '<a href="'+S.url("account",{tab:"orders"})+'">All orders →</a></div>'+
        orderCard(d2.orders[0])+'</section>'+
      '<section class="ac-block"><div class="ac-blockhead"><h2>Recently viewed</h2></div>'+
        (d2.recentlyViewed.length
          ? '<div class="ac-mini">'+d2.recentlyViewed.map(miniRow).join("")+'</div>'
          : '<p class="ac-none">Nothing viewed yet — browse the catalogue and it will start building up here.</p>')+
      '</section>';
  }
  function ordersView(d2){
    return '<section class="ac-block"><div class="ac-blockhead"><h2>Order history</h2><span>'+d2.orders.length+' orders</span></div>'+
      d2.orders.map(orderCard).join("")+'</section>';
  }
  function orderCard(o){
    if (!o) return '<p class="ac-none">No orders yet.</p>';
    var statusCls = o.status === "Delivered" ? "done" : o.status === "Cancelled" ? "cancel" : "live";
    var rolled = hasOrderPages();
    var ref = rolled ? '<a href="'+S.url("orderDetails",{ref:o.ref})+'">'+E(o.ref)+'</a>' : E(o.ref);
    var canCancel = rolled && o.status === "Processing";
    var canReturn = rolled && o.status === "Delivered" && !S.OrderState.get(o.ref).returnRequested;
    return '<div class="ac-order"><div class="ac-orderhead">'+
      '<div><b>'+ref+'</b><span>Placed '+E(o.date)+'</span></div>'+
      '<div class="ac-right"><span class="ac-status '+statusCls+'">'+E(o.status)+'</span>'+
      '<b>'+M(o.total)+'</b></div></div>'+
      (o.returnStatus ? '<div class="od-note" style="margin:0 16px 0">'+E(o.returnStatus)+'</div>' : "")+
      '<div class="ac-orderitems">'+o.items.map(function(it){
        return '<a class="ac-oi" href="'+S.url("product",{id:it.p.id})+'"><span>'+thumb(it.p,40,30)+'</span>'+
          '<span class="ac-oiname">'+E(it.p.name)+'<em>Qty '+it.qty+' · '+M(it.p.price)+'</em></span></a>';
      }).join("")+'</div>'+
      '<div class="ac-orderacts">'+
        (rolled ? '<a href="'+S.url("orderDetails",{ref:o.ref})+'">Order details</a>' : "")+
        '<button>Track parcel</button><button>Invoice (PDF)</button>'+
        (canCancel ? '<a href="'+S.url("orderCancel",{ref:o.ref})+'">Cancel order</a>' : "")+
        (canReturn ? '<a href="'+S.url("orderReturn",{ref:o.ref})+'">Return an item</a>' : (rolled ? "" : '<button>Return an item</button>'))+
        '<button data-reorder="'+o.items.map(function(i){ return i.p.id + ":" + i.qty; }).join(",")+'">Buy it again</button></div></div>';
  }
  function wishView(d2, D2){
    if (!d2.wishlist.length)
      return '<div class="ac-none-block"><h3>Nothing saved yet</h3><p>The heart icon on any product adds it here.</p>'+
             '<a class="bk-cta" href="'+S.url("home")+'">Browse the catalogue</a></div>';
    return '<section class="ac-block"><div class="ac-blockhead"><h2>Wishlist</h2><span>'+d2.wishlist.length+' saved</span></div>'+
      '<div class="cat-grid">'+d2.wishlist.map(D2.card).join("")+'</div></section>';
  }
  function addrView(d2){
    return '<section class="ac-block"><div class="ac-blockhead"><h2>Addresses</h2><button class="ac-add">+ Add address</button></div>'+
      '<div class="ac-addr">'+d2.addresses.map(function(a){
        return '<div class="ac-addrcard'+(a.default ? " on" : "")+'"><b>'+E(a.label)+(a.default ? '<em>Default</em>' : "")+'</b>'+
          '<p>'+E(a.name)+'<br>'+a.lines.map(E).join("<br>")+'<br>'+E(a.phone)+'</p>'+
          '<div class="ac-addracts"><button>Edit</button><button>Remove</button></div></div>';
      }).join("")+'</div></section>';
  }
  function detailsView(){
    return '<section class="ac-block"><div class="ac-blockhead"><h2>Your details</h2></div>'+
      '<div class="ac-fields">'+
        '<div class="ck-field"><label>Name</label><input value="P. Roy" disabled></div>'+
        '<div class="ck-field"><label>Email</label><input value="prolay@example.com" disabled></div>'+
        '<div class="ck-field"><label>Phone</label><input value="07700 900412" disabled></div>'+
        '<div class="ck-field"><label>Password</label><input value="••••••••" disabled></div>'+
      '</div><p class="ck-disclaim">Prototype — fields are disabled and no account data is stored or transmitted.</p></section>'+
      '<section class="ac-block"><div class="ac-blockhead"><h2>Preferences</h2></div>'+
      '<label class="ac-check"><input type="checkbox" checked> Email me about price drops on saved items</label>'+
      '<label class="ac-check"><input type="checkbox" checked> Restock alerts</label>'+
      '<label class="ac-check"><input type="checkbox"> Weekly deals newsletter</label></section>';
  }
  function miniRow(p){
    return '<a class="ac-oi" href="'+S.url("product",{id:p.id})+'"><span>'+thumb(p,40,30)+'</span>'+
      '<span class="ac-oiname">'+E(p.name)+'<em>'+M(p.price)+'</em></span></a>';
  }
  $$("[data-reorder]").forEach(function(b){
    b.addEventListener("click", function(){
      b.dataset.reorder.split(",").forEach(function(pair){
        var kv = pair.split(":"); S.Basket.add(Number(kv[0]), Number(kv[1]));
      });
      location.href = S.url("basket");
    });
  });
}


/* ------------------------------------------------ compare */
function compare(D){
  function render(){
    var d = Pages.compare();
    if (d.empty || d.needsMore){
      mount(D.header() + D.crumbs(d.crumbs) +
        '<div class="wrap"><div class="cmp-empty">'+icon("i-scale",34,34)+
        '<h3>'+(d.empty ? "Nothing to compare yet" : "Add one more to compare")+'</h3>'+
        '<p>'+(d.empty
          ? "Tick \u201cCompare\u201d on two or more products and they will line up here, spec by spec."
          : "You have one product queued. Add at least one more and this page will show the differences.")+'</p>'+
        '<a class="bk-cta" href="'+S.url("home")+'" style="display:inline-flex;padding:12px 26px">Browse the catalogue</a>'+
        '</div></div>' + D.footer());
      return;
    }
    var ps = d.products;
    var keys = S.uniq(ps.reduce(function(acc, p){ return acc.concat(Object.keys(p.specs)); }, []));
    function row(label, fn){
      var vals = ps.map(fn);
      var diff = S.uniq(vals.map(String)).length > 1;
      return '<tr><th>'+label+'</th>' + vals.map(function(v){
        return '<td'+(diff ? ' class="cmp-diff"' : '')+'>'+v+'</td>';
      }).join("") + '</tr>';
    }
    mount(D.header() + D.crumbs(d.crumbs) +
      '<div class="wrap"><div class="cmp-head"><h1>Comparing '+ps.length+' products</h1>'+
        '<p>Differing rows are highlighted. Remove one to swap it out, or add more from the catalogue.</p></div>'+
      '<div class="cmp-scroll"><table class="cmp-table"><thead><tr><th></th>'+
        ps.map(function(p){
          return '<th><div class="cmp-card">'+
            '<button class="cmp-rm" data-rm="'+p.id+'" title="Remove from compare">&times;</button>'+
            '<a href="'+S.url("product",{id:p.id})+'" class="cmp-fig">'+icon(p.icon,72,54)+'</a>'+
            '<a class="cmp-name" href="'+S.url("product",{id:p.id})+'">'+E(p.name)+'</a>'+
            '<span class="cmp-brand">'+E(p.brand)+'</span></div></th>';
        }).join("")+'</tr></thead><tbody>'+
        row("Price", function(p){ return '<b class="cmp-price">'+M(p.price)+'</b>'+(p.was ? ' <s>'+M(p.was)+'</s>' : ""); })+
        row("Rating", function(p){ return S.stars(p.rating)+' '+p.rating+' ('+p.reviews.toLocaleString("en-GB")+')'; })+
        row("Availability", function(p){ var st = S.stockText(p); return E(st.text); })+
        row("SKU", function(p){ return E(p.sku); })+
        row("Brand", function(p){ return '<a href="'+S.url("brand",{b:p.brand})+'">'+E(p.brand)+'</a>'; })+
        keys.map(function(k){ return row(k, function(p){ return p.specs[k] ? E(p.specs[k]) : '<span class="cmp-na">—</span>'; }); }).join("")+
      '</tbody></table></div>'+
      '<div class="cmp-actions"><button class="ck-back" id="cmpClearAll">Clear all</button>'+
        '<a class="ck-edit" href="'+S.url("home")+'">Continue shopping</a></div>'+
      '</div>'+
      D.section("Recommended for you", "Other products worth a look.", d.recommended) +
      D.footer());
    $$("[data-rm]").forEach(function(b){
      b.addEventListener("click", function(){ S.Compare.remove(b.dataset.rm); S.refreshCompareUI(); render(); });
    });
    var clearBtn = $("#cmpClearAll");
    if (clearBtn) clearBtn.addEventListener("click", function(){ S.Compare.clear(); S.refreshCompareUI(); render(); });
    document.title = "Compare products — UK Computer Shop";
  }
  render();
}


/* ------------------------------------------------ auth: login / register / forgotten password
   All three are static in the sense the rest of this prototype already is —
   no session is created and nothing is authenticated. Submitting shows the
   same kind of confirmation used everywhere else (basket, checkout) and moves
   on to where a successful attempt would actually land. */
function login(D){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Sign in" }]) +
    '<div class="wrap"><div class="auth-wrap"><div class="auth-card">'+
      '<h1>Sign in</h1><p class="auth-sub">Welcome back — enter your details to continue.</p>'+
      '<form id="loginForm">'+
        '<div class="ck-field"><label>Email address</label><input type="email" placeholder="you@example.com" required></div>'+
        '<div class="ck-field"><label>Password</label><input type="password" placeholder="••••••••" required></div>'+
        '<div class="auth-row"><label style="display:flex;align-items:center;gap:8px;color:var(--c-muted)"><input type="checkbox"> Remember me</label>'+
          '<a class="auth-link" href="'+S.url("forgotPassword")+'">Forgotten your password?</a></div>'+
        '<button class="bk-cta" type="submit" style="width:100%">Sign in</button>'+
      '</form>'+
      '<p class="auth-foot">New to UK Computer Shop? <a href="'+S.url("register")+'">Create an account</a></p>'+
    '</div></div></div>' + D.footer());
  var f = $("#loginForm");
  if (f) f.addEventListener("submit", function(e){
    e.preventDefault();
    S.flash("Signed in — this is a design prototype, no account was created");
    setTimeout(function(){ location.href = S.url("account"); }, 500);
  });
  document.title = "Sign in — UK Computer Shop";
}

function register(D){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Create account" }]) +
    '<div class="wrap"><div class="auth-wrap"><div class="auth-card">'+
      '<h1>Create your account</h1><p class="auth-sub">Faster checkout, order tracking and a wishlist that remembers you.</p>'+
      '<form id="registerForm">'+
        '<div class="ck-two"><div class="ck-field"><label>First name</label><input placeholder="Jordan" required></div>'+
          '<div class="ck-field"><label>Last name</label><input placeholder="Reid" required></div></div>'+
        '<div class="ck-field"><label>Email address</label><input type="email" placeholder="you@example.com" required></div>'+
        '<div class="ck-field"><label>Password</label><input type="password" placeholder="At least 8 characters" minlength="8" required></div>'+
        '<label style="display:flex;align-items:flex-start;gap:9px;color:var(--c-muted);font-size:12.5px;margin-bottom:18px">'+
          '<input type="checkbox" required style="margin-top:2px"> I agree to the <a class="auth-link" href="#">Terms</a> and <a class="auth-link" href="#">Privacy Policy</a></label>'+
        '<button class="bk-cta" type="submit" style="width:100%">Create account</button>'+
      '</form>'+
      '<p class="auth-foot">Already have an account? <a href="'+S.url("login")+'">Sign in</a></p>'+
    '</div></div></div>' + D.footer());
  var f = $("#registerForm");
  if (f) f.addEventListener("submit", function(e){
    e.preventDefault();
    S.flash("Account created — this is a design prototype, nothing was stored");
    setTimeout(function(){ location.href = S.url("account"); }, 500);
  });
  document.title = "Create account — UK Computer Shop";
}

function forgotPassword(D){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Forgotten password" }]) +
    '<div class="wrap"><div class="auth-wrap"><div class="auth-card" id="fpCard">'+
      '<h1>Forgotten your password?</h1><p class="auth-sub">Enter the email address on your account and we will send you a link to reset it.</p>'+
      '<form id="fpForm">'+
        '<div class="ck-field"><label>Email address</label><input type="email" id="fpEmail" placeholder="you@example.com" required></div>'+
        '<button class="bk-cta" type="submit" style="width:100%">Send reset link</button>'+
      '</form>'+
      '<p class="auth-foot"><a href="'+S.url("login")+'">← Back to sign in</a></p>'+
    '</div></div></div>' + D.footer());
  var f = $("#fpForm");
  if (f) f.addEventListener("submit", function(e){
    e.preventDefault();
    var email = $("#fpEmail").value || "that address";
    $("#fpCard").innerHTML =
      '<div class="auth-icon">'+icon("i-shield",34,34)+'</div>'+
      '<h1>Check your inbox</h1>'+
      '<p class="auth-sub">If an account exists for <b>'+E(email)+'</b>, we have sent a link to reset the password. It can take a few minutes to arrive.</p>'+
      '<a class="bk-cta" href="'+S.url("login")+'" style="display:flex;justify-content:center">Back to sign in</a>';
  });
  document.title = "Forgotten password — UK Computer Shop";
}

/* ------------------------------------------------ order details / cancel / return */
function orderDetails(D){
  var d = Pages.orderDetails(); if (!d) return;
  var o = d.order;
  var statusCls = o.status === "Delivered" ? "done" : o.status === "Cancelled" ? "cancel" : "live";
  mount(D.header() + D.crumbs(d.crumbs) +
    '<div class="wrap"><div class="od-head"><div><h1>Order '+E(o.ref)+'</h1><p>Placed '+E(o.date)+'</p></div>'+
      '<span class="ac-status '+statusCls+'">'+E(o.status)+'</span></div>'+
      (o.returnStatus ? '<div class="od-note">'+E(o.returnStatus)+' — we will email you a returns label once it is approved.</div>' : "")+
      '<div class="od-grid">'+
        '<div><h4>Delivering to</h4><p>'+E(d.address.name)+'<br>'+d.address.lines.map(E).join("<br>")+'</p></div>'+
        '<div><h4>Delivery method</h4><p>'+E(d.method.label)+'<br>'+E(d.method.note)+'</p></div>'+
        '<div><h4>Payment</h4><p>Card ending 4242<br>Not collected in this prototype</p></div>'+
      '</div>'+
      '<h2 class="od-sub">Items</h2>'+
      '<div class="od-items">'+o.items.map(function(it){
        return '<a class="ac-oi" href="'+S.url("product",{id:it.p.id})+'" style="padding:12px 16px;border-bottom:1px solid var(--c-line)">'+
          '<span>'+thumb(it.p,48,36)+'</span><span class="ac-oiname">'+E(it.p.name)+'<em>Qty '+it.qty+' · '+M(it.p.price)+' each</em></span>'+
          '<b style="margin-left:auto;font-family:var(--c-num)">'+M(it.p.price*it.qty)+'</b></a>';
      }).join("")+'</div>'+
      '<div class="od-totals"><div class="bk-row"><span>Goods</span><b>'+M(o.goods)+'</b></div>'+
        '<div class="bk-row"><span>Delivery</span><b>'+(o.shipping ? M(o.shipping) : "Free")+'</b></div>'+
        '<div class="bk-row bk-total"><span>Total paid</span><b>'+M(o.total)+'</b></div></div>'+
      '<div class="od-actions">'+
        (d.canCancel ? '<a class="ck-next" href="'+S.url("orderCancel",{ref:o.ref})+'">Cancel this order</a>' : "")+
        (d.canReturn ? '<a class="ck-next" href="'+S.url("orderReturn",{ref:o.ref})+'">Request a return</a>' : "")+
        '<a class="ck-back" href="'+S.url("account",{tab:"orders"})+'">← Back to orders</a>'+
      '</div></div>' + D.footer());
  document.title = "Order " + o.ref + " — UK Computer Shop";
}

function orderCancel(D){
  function render(){
    var d = Pages.orderCancel(); if (!d) return;
    var o = d.order;
    if (d.alreadyCancelled){
      mount(D.header() + D.crumbs(d.crumbs) +
        '<div class="wrap"><div class="od-confirm">'+icon("i-shield",34,34)+
        '<h1>Order already cancelled</h1><p>'+E(o.ref)+' was cancelled.</p>'+
        '<a class="bk-cta" href="'+S.url("orderDetails",{ref:o.ref})+'" style="display:inline-flex;padding:12px 26px">View order</a></div></div>' + D.footer());
      return;
    }
    mount(D.header() + D.crumbs(d.crumbs) +
      '<div class="wrap"><div class="od-form"><h1>Cancel order '+E(o.ref)+'</h1>'+
        '<p>This cannot be undone. Any payment taken would normally be refunded within 3–5 working days.</p>'+
        '<div class="od-items">'+o.items.map(function(it){
          return '<div class="ac-oi" style="padding:12px 16px;border-bottom:1px solid var(--c-line)"><span>'+thumb(it.p,44,32)+'</span>'+
            '<span class="ac-oiname">'+E(it.p.name)+'<em>Qty '+it.qty+'</em></span></div>';
        }).join("")+'</div>'+
        '<div class="ck-field"><label>Reason (optional)</label><select id="cancelReason">'+
          '<option value="">Choose a reason</option><option>Ordered by mistake</option>'+
          '<option>Found it cheaper elsewhere</option><option>No longer needed</option>'+
          '<option>Delivery is taking too long</option><option>Other</option></select></div>'+
        '<div class="ck-actions"><a class="ck-back" href="'+S.url("orderDetails",{ref:o.ref})+'">← Keep my order</a>'+
          '<button class="ck-next" id="confirmCancel" style="background:var(--c-neg)">Confirm cancellation</button></div>'+
      '</div></div>' + D.footer());
    $("#confirmCancel").addEventListener("click", function(){
      S.OrderState.cancel(o.ref, $("#cancelReason").value || null);
      S.flash("Order cancelled");
      render();
    });
  }
  render();
  document.title = "Cancel order — UK Computer Shop";
}

function orderReturn(D){
  function render(){
    var d = Pages.orderReturn(); if (!d) return;
    var o = d.order;
    if (d.alreadyRequested){
      mount(D.header() + D.crumbs(d.crumbs) +
        '<div class="wrap"><div class="od-confirm">'+icon("i-shield",34,34)+
        '<h1>Return already requested</h1><p>We are reviewing the request for '+E(o.ref)+'.</p>'+
        '<a class="bk-cta" href="'+S.url("orderDetails",{ref:o.ref})+'" style="display:inline-flex;padding:12px 26px">View order</a></div></div>' + D.footer());
      return;
    }
    mount(D.header() + D.crumbs(d.crumbs) +
      '<div class="wrap"><div class="od-form"><h1>Return an item from '+E(o.ref)+'</h1>'+
        '<p>Select what you would like to return. We will email a prepaid returns label once it is approved.</p>'+
        '<div class="od-items" style="border:0;overflow:visible">'+o.items.map(function(it){
          return '<label class="od-returnrow"><input type="checkbox" name="ritem" value="'+it.p.id+'" checked>'+
            '<span>'+thumb(it.p,44,32)+'</span><span class="ac-oiname">'+E(it.p.name)+'<em>Qty '+it.qty+'</em></span></label>';
        }).join("")+'</div>'+
        '<div class="ck-field"><label>Reason</label><select id="returnReason" required>'+
          '<option value="">Choose a reason</option><option>Arrived faulty or damaged</option>'+
          '<option>Not as described</option><option>No longer needed</option>'+
          '<option>Ordered the wrong item</option><option>Other</option></select></div>'+
        '<div class="ck-field"><label>Anything we should know? (optional)</label><input id="returnNote" placeholder="A short note for our returns team"></div>'+
        '<div class="ck-actions"><a class="ck-back" href="'+S.url("orderDetails",{ref:o.ref})+'">← Cancel</a>'+
          '<button class="ck-next" id="confirmReturn">Submit return request</button></div>'+
      '</div></div>' + D.footer());
    $("#confirmReturn").addEventListener("click", function(){
      var items = $$('input[name="ritem"]:checked').map(function(i){ return i.value; });
      if (!items.length){ S.flash("Select at least one item to return"); return; }
      var reason = $("#returnReason").value;
      if (!reason){ S.flash("Choose a reason for the return"); return; }
      S.OrderState.requestReturn(o.ref, items, reason, $("#returnNote").value || null);
      S.flash("Return requested");
      render();
    });
  }
  render();
  document.title = "Return request — UK Computer Shop";
}


/* ------------------------------------------------ About, Contact, Store Locations
   Marketing/informational content — not legal documents. Reuses the same
   invented business facts already established elsewhere (address, phone,
   founding year) rather than adding new ones that would disagree with them. */
function about(D){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"About us" }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">Since 2009</span>'+
      '<h1>An independent computer shop that still builds what it sells</h1>'+
      '<p>We started as a two-person repair counter in Manchester and grew into a full-catalogue retailer without losing the habit of testing everything ourselves before it goes out the door.</p></div>'+
    '<div class="info-body">'+
      '<p>UK Computer Shop opened in 2009 as a repair and upgrade counter serving Manchester’s university district. Word travelled on the strength of straight answers rather than a sales pitch, and the catalogue grew from a shelf of spare parts into the six departments you can browse today — components, complete systems, laptops, peripherals, networking and accessories.</p>'+
      '<p>We are still run out of the same workshop, now expanded to hold a proper build room alongside the counter. Every system we assemble is built, cable-managed and stress-tested there before it is boxed, by the same team who will answer the phone if something goes wrong with it.</p>'+
      '<div class="about-stats">'+
        '<div><b>2009</b><span>Trading since</span></div>'+
        '<div><b>'+S.all.length+'</b><span>Products in the current catalogue</span></div>'+
        '<div><b>3&nbsp;years</b><span>Warranty on systems we build</span></div>'+
        '<div><b>4.8/5</b><span>Average customer rating</span></div>'+
      '</div>'+
      '<div class="about-fig" style="background-image:url(https://picsum.photos/seed/ukcs-about-bench/1000/700)"></div>'+
      '<h2>What that means in practice</h2>'+
      '<div class="about-principles">'+
        '<div class="about-principle"><b>Specification first</b><p>Every listing carries the SKU, manufacturer part number and full spec sheet we would want to see if we were buying it ourselves.</p></div>'+
        '<div class="about-principle"><b>Compatibility checked</b><p>Anything we suggest alongside a part you are looking at has actually been checked against socket, memory generation and power headroom.</p></div>'+
        '<div class="about-principle"><b>We answer our own phone</b><p>Support and the build room share a building. If a system we assembled has a problem, the person you speak to can walk over and look at it.</p></div>'+
      '</div>'+
      '<h2>Visit us</h2>'+
      '<p>The workshop and showroom are open to browse, collect an order, or bring in a machine for a look. See <a href="'+S.url("stores")+'">store details and opening hours</a>, or <a href="'+S.url("contact")+'">get in touch</a> before you come in for anything time-sensitive.</p>'+
    '</div></div>' + D.footer());
  document.title = "About us — UK Computer Shop";
}

function contact(D){
  function render(sent){
    mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Contact us" }]) +
      '<div class="wrap"><div class="info-hero"><span class="eyebrow">We’re around Monday to Saturday</span>'+
        '<h1>Get in touch</h1><p>For an existing order, the fastest route is usually your <a href="'+S.url("account",{tab:"orders"})+'">order details page</a> — otherwise, here is every other way to reach us.</p></div>'+
      '<div class="contact-grid">'+
        '<div><div class="contact-methods">'+
          '<div class="contact-method">'+icon("i-user",18,18)+'<span><b>Phone</b><a href="tel:01614960100">0161 496 0100</a><br><span>Mon–Sat, 9:00–18:00</span></span></div>'+
          '<div class="contact-method">'+icon("i-search",18,18)+'<span><b>Email</b><a href="mailto:help@ukcomputershop.example">help@ukcomputershop.example</a><br><span>We reply within one working day</span></span></div>'+
          '<div class="contact-method">'+icon("i-wrench",18,18)+'<span><b>Workshop &amp; showroom</b><span>Unit 7, Ardwick Green North, Manchester M12 6FZ</span><br><a href="'+S.url("stores")+'">Opening hours &amp; directions</a></span></div>'+
        '</div></div>'+
        '<div class="contact-form">'+(sent ? contactSent() : contactForm())+'</div>'+
      '</div></div>' + D.footer());
    var f = $("#contactForm");
    if (f) f.addEventListener("submit", function(e){ e.preventDefault(); render(true); window.scrollTo({top:0,behavior:"smooth"}); });
  }
  function contactForm(){
    return '<h2>Send us a message</h2><form id="contactForm">'+
      '<div class="ck-two"><div class="ck-field"><label>Name</label><input required></div>'+
        '<div class="ck-field"><label>Email address</label><input type="email" required></div></div>'+
      '<div class="ck-field"><label>Order reference (optional)</label><input placeholder="UKCS-000000"></div>'+
      '<div class="ck-field"><label>Subject</label><select required><option value="">Choose a topic</option>'+
        '<option>An existing order</option><option>Product advice before I buy</option><option>Warranty or repair</option>'+
        '<option>Returns or refunds</option><option>Trade or business account</option><option>Something else</option></select></div>'+
      '<div class="ck-field"><label>Message</label><textarea rows="5" required style="width:100%;border:1px solid var(--c-line-strong);background:var(--c-surface-2);color:var(--c-text);padding:11px 12px;border-radius:var(--c-radius);font-family:inherit;font-size:14px;resize:vertical"></textarea></div>'+
      '<button class="bk-cta" type="submit" style="width:100%">Send message</button></form>';
  }
  function contactSent(){
    return '<div class="contact-sent">'+icon("i-shield",34,34)+'<h2>Message sent</h2>'+
      '<p>Thanks — this is a design prototype, so nothing was actually sent, but a real submission here would reach us within one working day.</p></div>';
  }
  render(false);
  document.title = "Contact us — UK Computer Shop";
}

function stores(D){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Store locations" }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">One workshop, for now</span>'+
      '<h1>Visit the workshop</h1><p>We trade from a single site in Manchester — warehouse, build room and showroom all under one roof. No other locations exist yet, so this page is deliberately short rather than padded out with invented branches.</p></div>'+
      '<div class="store-card">'+
        '<div class="fig" style="background-image:url(https://picsum.photos/seed/ukcs-store-front/700/700)"></div>'+
        '<div class="body"><h2>Manchester — Ardwick Green</h2><span class="tag">Workshop, showroom &amp; collection point</span>'+
          '<div class="store-row">'+icon("i-wrench",18,18)+'<span><b>Address</b><span>Unit 7, Ardwick Green North, Manchester M12 6FZ</span></span></div>'+
          '<div class="store-row">'+icon("i-user",18,18)+'<span><b>Phone</b><span><a href="tel:01614960100">0161 496 0100</a></span></span></div>'+
          '<div class="store-row">'+icon("i-truck",18,18)+'<span><b>Opening hours</b><span>Monday–Friday 9:00–18:00<br>Saturday 10:00–16:00<br>Closed Sunday and bank holidays</span></span></div>'+
          '<div class="store-row">'+icon("i-shield",18,18)+'<span><b>Collection</b><span>Orders placed before 15:00 are usually ready to collect the same day — we will email you when it is ready.</span></span></div>'+
          '<div class="store-amenities"><span>Build service desk</span><span>PC configurator kiosk</span><span>Trade counter</span><span>Free parking</span><span>Wheelchair accessible</span></div>'+
        '</div></div>'+
      '<p style="color:var(--c-muted);font-size:13.5px;max-width:60ch">Planning to bring in a system for a repair or upgrade? A quick call ahead on the number above means we can have a technician free when you arrive.</p>'+
    '</div>' + D.footer());
  document.title = "Store locations — UK Computer Shop";
}



/* ------------------------------------------------ FAQ */
function faq(D){
  var uDelivery = S.url("delivery"), uReturns = S.url("returns"), uWarranty = S.url("warranty"),
      uPayment = S.url("paymentInfo"), uContact = S.url("contact"), uOrders = S.url("account",{tab:"orders"});
  var groups = [
    { t:"Orders & delivery", items:[
      ["What time do I need to order by for next-day delivery?",
       "Order before 17:00 Monday to Friday and, for in-stock items, we despatch the same day. Orders placed after 17:00 or over a weekend go out the next working day."],
      ["Can I change my delivery address after ordering?",
       "If the order has not yet been despatched, contact us with your order reference as soon as possible and we will update it. Once it has left the workshop we cannot redirect it."],
      ["Do you deliver outside the UK mainland?",
       "Not currently. We deliver to UK mainland addresses only — see our <a href=\"" + uDelivery + "\">delivery information</a> for the full list of options."],
      ["My order hasn't arrived — what do I do?",
       "Check your <a href=\"" + uOrders + "\">order details</a> first, then get in <a href=\"" + uContact + "\">touch with us</a> with your order reference if it is later than the estimate shown there."]
    ]},
    { t:"Products & compatibility", items:[
      ["How do I know a part will fit my existing build?",
       "Every product page lists the full specification — socket, memory type, dimensions and so on. On top of that, our \u201cfrequently bought together\u201d suggestions are compatibility-checked: we will not pair an AM5 processor with an LGA1851 board, or suggest a power supply that undersizes a given graphics card."],
      ["Do you build custom PCs to a spec I choose?",
       "Yes — every part in the catalogue can go into a custom build. Get in touch with the parts you have in mind, or start from one of our pre-built tiers and swap components before checkout."],
      ["What does \u201crefurbished\u201d mean on a listing?",
       "Refurbished systems and laptops have been tested, any faulty components replaced, and are graded before sale. Each listing states the grade and what was checked."]
    ]},
    { t:"Payment & finance", items:[
      ["What payment methods do you accept?",
       "Card, PayPal, Klarna, and 0% finance on orders over £600 — see <a href=\"" + uPayment + "\">payment information</a> for details."],
      ["How does the 0% finance option work?",
       "Available at checkout on orders over £600, spread over 12 months at no additional interest, subject to a standard credit check by our finance partner."],
      ["Do your prices include VAT?",
       "Yes, all prices shown are inclusive of VAT at the UK standard rate unless stated otherwise. The exclusive-of-VAT figure is shown alongside the price on every product and order page."]
    ]},
    { t:"Returns & warranty", items:[
      ["What is your returns window?",
       "30 days from delivery for most items in original condition. See our <a href=\"" + uReturns + "\">returns &amp; refunds</a> page for exceptions, including custom-built systems."],
      ["What warranty comes with a system you build?",
       "Three years collect-and-return on every system we assemble, on top of whatever warranty the individual components carry from their manufacturer. Full details are on our <a href=\"" + uWarranty + "\">warranty information</a> page."],
      ["An item arrived faulty — what happens?",
       "We collect, test and replace it at no cost to you either way. Start a return from your <a href=\"" + uOrders + "\">order details page</a> and select \u201carrived faulty or damaged\u201d as the reason."]
    ]}
  ];
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"FAQ" }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">Frequently asked</span>'+
      '<h1>Questions we hear a lot</h1><p>Can\'t find it here? <a href="'+uContact+'">Contact us</a> directly and we will answer it properly rather than pointing you back at this page.</p></div>'+
    '<div class="info-body" style="max-width:78ch">'+
    groups.map(function(g,gi){
      return '<div class="faq-group"><h2>'+E(g.t)+'</h2>'+
        g.items.map(function(item,i){
          return '<div class="faq-item" id="faq-'+gi+'-'+i+'"><div class="faq-q" data-faq="faq-'+gi+'-'+i+'">'+E(item[0])+icon("i-plus",16,16)+'</div>'+
            '<div class="faq-a"><div class="faq-a-inner"><p>'+item[1]+'</p></div></div></div>';
        }).join("")+'</div>';
    }).join("")+
    '</div></div>' + D.footer());
  $$(".faq-q").forEach(function(q){
    q.addEventListener("click", function(){ q.closest(".faq-item").classList.toggle("open"); });
  });
  document.title = "FAQ — UK Computer Shop";
}

/* ------------------------------------------------ support hub */
function support(D){
  var cards = [
    ["i-search","FAQ","Answers to the questions we hear most often, grouped by topic.", S.url("faq")],
    ["i-truck","Delivery information","Options, prices, despatch cut-off and how long things take.", S.url("delivery")],
    ["i-shield","Returns & refunds","Our 30-day window, how to start one, and what is not covered.", S.url("returns")],
    ["i-wrench","Warranty information","What is covered on systems we build versus individual components.", S.url("warranty")],
    ["i-card","Payment information","Accepted methods, 0% finance, and how VAT is shown.", S.url("paymentInfo")],
    ["i-user","Contact us","Phone, email and a contact form for anything not covered here.", S.url("contact")]
  ];
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Support" }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">Help centre</span>'+
      '<h1>How can we help?</h1><p>Everything about ordering, delivery, returns and warranty in one place, plus a direct line to us for anything more specific.</p></div>'+
    '<div class="support-grid">'+cards.map(function(c){
      return '<a class="support-card" href="'+c[3]+'"><span class="ic">'+icon(c[0],20,20)+'</span><h3>'+E(c[1])+'</h3><p>'+E(c[2])+'</p><span>Read more →</span></a>';
    }).join("")+'</div></div>' + D.footer());
  document.title = "Support — UK Computer Shop";
}


/* ------------------------------------------------ delivery / returns / warranty / payment
   Delivery pulls its options and prices straight from Shop.DELIVERY — the
   same data checkout uses — so this page can never disagree with what a
   customer is actually charged. */
function delivery(D){
  var rows = S.DELIVERY.map(function(m){
    return '<tr><td>'+E(m.label)+'</td><td>'+E(m.note)+'</td><td>'+
      (m.freeOver !== null ? M(m.price)+' (free over '+M(m.freeOver)+')' : M(m.price))+'</td></tr>';
  }).join("");
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Support", href:S.url("support") }, { label:"Delivery information" }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">Delivery</span>'+
      '<h1>Delivery information</h1><p>Every option we offer at checkout, what it costs, and where the cut-off times come from.</p></div>'+
    '<div class="info-body">'+
      '<h2>Delivery options</h2>'+
      '<table class="info-table"><tr><th>Method</th><th>Typically</th><th>Price</th></tr>'+rows+'</table>'+
      '<h2>Despatch cut-off</h2>'+
      '<p>Orders placed before <strong>17:00, Monday to Friday</strong>, are despatched the same day for any item shown as in stock. Orders placed after the cut-off, or over a weekend or bank holiday, go out on the next working day.</p>'+
      '<h2>Where we deliver</h2>'+
      '<p>UK mainland addresses only at present. We are not currently able to deliver to the Scottish Highlands and Islands, Northern Ireland, the Channel Islands, or outside the UK — get in <a href="'+S.url("contact")+'">touch</a> before ordering if you are unsure whether your postcode is covered.</p>'+
      '<h2>Large and heavy items</h2>'+
      '<p>Complete systems, monitors and other bulky items are sent on a tracked courier service appropriate to their size and weight. You will receive tracking details by email once your order has despatched.</p>'+
      '<h2>Collection</h2>'+
      '<p>Every order can be collected free of charge from our <a href="'+S.url("stores")+'">Manchester workshop</a> instead of being delivered. Orders placed before 15:00 are usually ready the same day; we will email you as soon as yours is.</p>'+
      '<div class="info-note"><b>Related:</b> see <a href="'+S.url("returns")+'">returns &amp; refunds</a> for what happens if a delivery arrives damaged.</div>'+
    '</div></div>' + D.footer());
  document.title = "Delivery information — UK Computer Shop";
}

function returns(D){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Support", href:S.url("support") }, { label:"Returns & refunds" }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">Returns</span>'+
      '<h1>Returns &amp; refunds</h1><p>How our 30-day window works, and how to start a return on an order you have already placed.</p></div>'+
    '<div class="info-body">'+
      '<h2>The 30-day window</h2>'+
      '<p>Most items can be returned within 30 days of delivery, unused and in the condition you received them, for a full refund. This is in addition to your statutory rights under the Consumer Rights Act 2015 and the Consumer Contracts Regulations 2013 as a UK online shopper.</p>'+
      '<h2>How to start a return</h2>'+
      '<p>Go to <a href="'+S.url("account",{tab:"orders"})+'">My account → Orders</a>, open the order, and select \u201cRequest a return\u201d. Choose which items and a reason, and we will email a prepaid returns label once it is approved.</p>'+
      '<h2>If something arrives faulty or damaged</h2>'+
      '<p>Select \u201cArrived faulty or damaged\u201d as the reason and we will collect it, test it, and either repair, replace or refund it — carriage is free both ways in this case.</p>'+
      '<h2>What can\'t be returned</h2>'+
      '<ul>'+
        '<li>Custom-built systems, once assembly has started, unless faulty</li>'+
        '<li>Software licence keys and digital downloads, once activated</li>'+
        '<li>Consumables such as thermal paste, once the seal is broken</li>'+
        '<li>Items returned outside the 30-day window without a fault</li>'+
      '</ul>'+
      '<h2>Refund timing</h2>'+
      '<p>Once we have received and checked a returned item, refunds are issued to the original payment method within 3–5 working days.</p>'+
      '<div class="info-note"><b>Note:</b> this is a design prototype — starting a return here records a demo state in your browser rather than notifying a real returns team.</div>'+
    '</div></div>' + D.footer());
  document.title = "Returns & refunds — UK Computer Shop";
}

function warranty(D){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Support", href:S.url("support") }, { label:"Warranty information" }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">Warranty</span>'+
      '<h1>Warranty information</h1><p>What is covered depends on whether you bought a system we built or an individual component — here is the difference.</p></div>'+
    '<div class="info-body">'+
      '<h2>Systems we build</h2>'+
      '<p>Every gaming PC, workstation or custom build assembled in our workshop carries a <strong>three-year collect-and-return warranty</strong>, covering workmanship and any component we fitted. If it develops a fault, we arrange collection, diagnose and repair it, and return it — at no cost to you within that period.</p>'+
      '<h2>Individual components and peripherals</h2>'+
      '<p>These carry whatever warranty the manufacturer offers, which we state on every product page under the <strong>Warranty</strong> field where the manufacturer specifies one. This commonly ranges from one year on accessories to a lifetime warranty on some memory and cooling products.</p>'+
      '<h2>Laptops and pre-built computers from other manufacturers</h2>'+
      '<p>Covered by the manufacturer\'s own warranty, which we will help you claim against if needed — get in <a href="'+S.url("contact")+'">touch</a> with your order reference.</p>'+
      '<h2>What a warranty does not cover</h2>'+
      '<ul>'+
        '<li>Accidental damage, liquid damage, or damage from unauthorised repair attempts</li>'+
        '<li>Normal wear and tear on consumable parts, such as fans reaching end of life</li>'+
        '<li>Performance changes caused by manual overclocking beyond rated specifications</li>'+
      '</ul>'+
      '<h2>Making a claim</h2>'+
      '<p>Start from <a href="'+S.url("account",{tab:"orders"})+'">My account → Orders</a> if the item is a system we built, or <a href="'+S.url("contact")+'">contact us</a> directly with your order reference for anything else.</p>'+
    '</div></div>' + D.footer());
  document.title = "Warranty information — UK Computer Shop";
}

function paymentInfo(D){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:"Support", href:S.url("support") }, { label:"Payment information" }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">Payment</span>'+
      '<h1>Payment information</h1><p>What we accept, how VAT is shown, and how the 0% finance option works.</p></div>'+
    '<div class="info-body">'+
      '<h2>Accepted payment methods</h2>'+
      '<ul><li>Visa and Mastercard, debit or credit</li><li>American Express</li><li>PayPal</li><li>Klarna, including Pay in 3</li><li>0% finance on orders over £600 — see below</li></ul>'+
      '<h2>0% finance</h2>'+
      '<p>Available at checkout on orders over £600, spread over 12 months at no additional interest, subject to a standard credit check by our finance partner. Representative terms are shown at checkout before you confirm.</p>'+
      '<h2>VAT</h2>'+
      '<p>All prices shown on the site are inclusive of VAT at the UK standard rate. The VAT-exclusive figure is shown alongside the price on every product page, in your basket, and on your order confirmation, for business customers who need it for their own accounts.</p>'+
      '<h2>Payment security</h2>'+
      '<p>Card and finance payments are processed by our payment partners rather than handled directly on our own servers. We do not store full card numbers.</p>'+
      '<div class="info-note"><b>Note:</b> this is a design prototype. The checkout payment step is a layout preview — no card details are collected and no payment is actually processed anywhere in this site.</div>'+
    '</div></div>' + D.footer());
  document.title = "Payment information — UK Computer Shop";
}


/* ------------------------------------------------ Terms, Privacy, Cookie Policy
   These are the one category of content in this whole prototype that carries
   real legal weight if anyone mistook it for the genuine article, so every
   one of the three opens with an explicit, impossible-to-miss notice. The
   substance below is a realistic UK e-commerce template — Consumer Rights
   Act 2015, the 2013 distance-selling regulations, UK GDPR — not filler
   text, but it has not been near a solicitor and must not go live as-is. */
function legalNotice(){
  return '<div class="info-note" style="border-color:var(--c-neg);background:color-mix(in srgb, var(--c-neg) 8%, var(--c-surface-2))">'+
    '<b>This is placeholder text for design review.</b> It is a realistic template, not verified legal advice, and must be reviewed and approved by a qualified legal adviser before this site accepts a real order.</div>';
}
function legalPage(D, opts){
  mount(D.header() + D.crumbs([{ label:"Home", href:S.url("home") }, { label:opts.title }]) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">Legal</span><h1>'+opts.title+'</h1>'+
      '<p>'+opts.intro+'</p></div>'+
    legalNotice()+
    '<div class="legal-layout">'+
      '<nav class="legal-toc"><div class="h">Contents</div>'+
        opts.sections.map(function(sec){ return '<a href="#'+sec.id+'">'+sec.h+'</a>'; }).join("")+
      '</nav>'+
      '<div><p class="legal-updated">Last updated 1 August 2026 (template)</p>'+
        opts.sections.map(function(sec){
          return '<section id="'+sec.id+'"><h2>'+sec.h+'</h2>'+sec.body+'</section>';
        }).join("")+
      '</div>'+
    '</div></div>' + D.footer());
  document.title = opts.title + " — UK Computer Shop";
}

function terms(D){
  legalPage(D, {
    title: "Terms & Conditions",
    intro: "The terms that apply when you buy from UK Computer Shop, in plain language wherever the law lets us.",
    sections: [
      { id:"who", h:"Who we are", body:
        '<p>UK Computer Shop Ltd, company number 07234891, trading from Unit 7, Ardwick Green North, Manchester M12 6FZ. VAT registration GB 123 4567 89. These terms apply to any order placed through this website.</p>' },
      { id:"contract", h:"Placing an order", body:
        '<p>Adding an item to your basket is not an offer to buy — you make that offer when you complete checkout, and we accept it when we send order confirmation. We may decline an order, for example if a listed price or stock level was wrong, and if we do we will not take payment.</p>' },
      { id:"pricing", h:"Pricing and payment", body:
        '<p>All prices are shown in pounds sterling, inclusive of VAT unless stated otherwise. We take reasonable care to ensure prices are correct but errors can occur; if we find one after you have ordered, we will contact you before proceeding. Payment is taken at checkout via the methods described in our <a href="'+S.url("paymentInfo")+'">payment information</a>.</p>' },
      { id:"delivery", h:"Delivery", body:
        '<p>Estimated delivery times are given in good faith and are not guaranteed delivery dates. Risk in goods passes to you on delivery. Full detail is in our <a href="'+S.url("delivery")+'">delivery information</a>.</p>' },
      { id:"cancellation", h:"Your right to cancel", body:
        '<p>As a UK consumer buying online, you generally have 14 days from delivery to cancel your order under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, in addition to our own 30-day <a href="'+S.url("returns")+'">returns policy</a>, whichever gives you the longer period.</p>' },
      { id:"warranty-liability", h:"Warranties and liability", body:
        '<p>Nothing in these terms affects your statutory rights under the Consumer Rights Act 2015, including your right to goods that are of satisfactory quality, fit for purpose and as described. See our <a href="'+S.url("warranty")+'">warranty information</a> for what we additionally provide on systems we build.</p>'+
        '<p>We are not liable for indirect or consequential loss, and our liability for any claim is limited to the amount you paid for the relevant order, except where liability cannot be limited by law (for example, death or personal injury caused by our negligence).</p>' },
      { id:"ip", h:"Intellectual property", body:
        '<p>The content of this site — text, images, logos and design — belongs to UK Computer Shop Ltd or its licensors and may not be reproduced without permission.</p>' },
      { id:"privacy-ref", h:"Your data", body:
        '<p>How we collect and use your information is set out in full in our <a href="'+S.url("privacy")+'">Privacy Policy</a>.</p>' },
      { id:"law", h:"Governing law", body:
        '<p>These terms are governed by the law of England and Wales, and any dispute will be handled by the courts of England and Wales.</p>' },
      { id:"changes", h:"Changes to these terms", body:
        '<p>We may update these terms from time to time; the version that applies to your order is the one in force at the time you placed it.</p>' }
    ]
  });
}

function privacy(D){
  legalPage(D, {
    title: "Privacy Policy",
    intro: "What we collect when you use this site, why, and the rights you have over it under UK GDPR.",
    sections: [
      { id:"controller", h:"Who is responsible for your data", body:
        '<p>UK Computer Shop Ltd, Unit 7, Ardwick Green North, Manchester M12 6FZ, is the data controller for information collected through this site.</p>' },
      { id:"what", h:"What we collect", body:
        '<ul><li>Account details: name, email, delivery and billing addresses, phone number</li>'+
        '<li>Order history and basket contents</li><li>Payment confirmation from our payment partners — we do not store full card numbers</li>'+
        '<li>Browsing activity on this site, such as recently viewed products and wishlist items, largely held in your browser rather than on our servers</li>'+
        '<li>Communications you send us, for example through the <a href="'+S.url("contact")+'">contact form</a></li></ul>' },
      { id:"why", h:"Why we use it", body:
        '<p>To take and fulfil your orders, provide customer support, meet our legal and accounting obligations, and — only with your consent, as described in our <a href="'+S.url("cookiePolicy")+'">Cookie Policy</a> — to understand how the site is used and improve it.</p>' },
      { id:"sharing", h:"Who we share it with", body:
        '<p>Delivery carriers, to get your order to you; payment and finance partners, to process payment; and, where required, HMRC and other authorities. We do not sell personal data to third parties.</p>' },
      { id:"retention", h:"How long we keep it", body:
        '<p>Order and account records are kept for as long as needed to meet our legal, tax and warranty obligations, then deleted or anonymised.</p>' },
      { id:"rights", h:"Your rights", body:
        '<p>Under UK GDPR and the Data Protection Act 2018 you can ask to access, correct, delete, or receive a copy of your personal data, and object to or restrict some uses of it. Contact us via our <a href="'+S.url("contact")+'">contact page</a> to exercise any of these, or to complain to the Information Commissioner\'s Office if you are unhappy with how we have handled a request.</p>' },
      { id:"cookies-ref", h:"Cookies", body:
        '<p>Covered separately in our <a href="'+S.url("cookiePolicy")+'">Cookie Policy</a>.</p>' },
      { id:"changes", h:"Changes to this policy", body:
        '<p>We may update this policy from time to time; material changes will be reflected here with an updated date.</p>' }
    ]
  });
}

function cookiePolicy(D){
  legalPage(D, {
    title: "Cookie Policy",
    intro: "What cookies this site uses, and how to control them.",
    sections: [
      { id:"what", h:"What cookies are", body:
        '<p>Small text files stored in your browser that let a site remember information between visits — such as what is in your basket, or your saved wishlist.</p>' },
      { id:"how", h:"How we use them", body:
        '<p>This prototype stores its demo state — basket, wishlist, compare list, and your cookie choice itself — directly in your browser\'s local storage rather than in a traditional cookie, but it serves the same purpose and is covered by the same choice you make below.</p>' },
      { id:"types", h:"Types of cookie we use", body:
        '<table class="info-table"><tr><th>Type</th><th>Purpose</th><th>Can you opt out?</th></tr>'+
        '<tr><td>Essential</td><td>Basket, checkout and account features working at all</td><td>No — the site cannot function without these</td></tr>'+
        '<tr><td>Analytics</td><td>Understanding which pages and products are popular, to improve the site</td><td>Yes</td></tr>'+
        '<tr><td>Marketing</td><td>Showing you more relevant offers, on this site or elsewhere</td><td>Yes</td></tr></table>' },
      { id:"managing", h:"Managing your choice", body:
        '<p>You can accept or reject non-essential cookies from the banner shown on your first visit, or clear your browser\'s site data at any time to reset your choice and be asked again.</p>' },
      { id:"third-party", h:"Third-party cookies", body:
        '<p>Our payment and delivery partners may set their own cookies when you reach the parts of checkout they are involved in — these are governed by their own cookie policies, not this one.</p>' },
      { id:"changes", h:"Changes to this policy", body:
        '<p>We may update this policy as the site changes; the version here always reflects current practice.</p>' }
    ]
  });
}


/* ------------------------------------------------ blog */
function blogCard(post, author){
  return '<a class="blog-card" href="'+S.url("blogPost",{slug:post.slug})+'">'+
    '<span class="cover" style="background-image:url(https://picsum.photos/seed/'+post.cover+'/480/300)"></span>'+
    '<div class="body"><span class="cat">'+E(post.category)+'</span><h3>'+E(post.title)+'</h3><p>'+E(post.excerpt)+'</p>'+
    '<div class="meta"><span>'+(author ? E(author.name) : "")+'</span><span>'+E(post.readMins)+' min read</span></div>'+
    '</div></a>';
}
function blogSidebar(d){
  return '<aside class="blog-sidebar">'+
    '<div class="blog-widget"><h4>Categories</h4><ul>'+d.categories.map(function(c){
      return '<li><a href="'+S.url("blog",{cat:c})+'"'+(d.cat===c?' style="color:var(--c-accent);font-weight:600"':'')+'>'+E(c)+'</a></li>'; }).join("")+'</ul></div>'+
    '<div class="blog-widget"><h4>Tags</h4><div class="blog-tags">'+d.tags.map(function(t){
      return '<a href="'+S.url("blog",{tag:t})+'"'+(d.tag===t?' style="border-color:var(--c-accent);color:var(--c-accent)"':'')+'>'+E(t)+'</a>'; }).join("")+'</div></div>'+
    '<div class="blog-widget"><h4>Archive</h4><ul>'+d.months.map(function(m){
      var label = new Date(m.key+"-02").toLocaleDateString("en-GB",{month:"long",year:"numeric"});
      return '<li><a href="'+S.url("blog",{month:m.key})+'"'+(d.month===m.key?' style="color:var(--c-accent);font-weight:600"':'')+'>'+label+'<span>'+m.count+'</span></a></li>'; }).join("")+'</ul></div>'+
  '</aside>';
}
function blog(D){
  function render(){
    var d = Pages.blog(); if (!d) return;
    var activeLabel = d.cat ? "Category: " + d.cat : d.tag ? "Tag: " + d.tag : d.authorSlug ? "By " + (S.BLOG_AUTHORS.filter(function(a){return a.slug===d.authorSlug;})[0]||{}).name : d.month ? "From " + new Date(d.month+"-02").toLocaleDateString("en-GB",{month:"long",year:"numeric"}) : null;
    mount(D.header() + D.crumbs(d.crumbs) +
      '<div class="wrap"><div class="info-hero"><span class="eyebrow">From the workshop</span>'+
        '<h1>The blog</h1><p>Buying guides, explainers and comparisons written by the technicians who build what we sell — not marketing copy.</p></div>'+
      '<div class="blog-layout"><div>'+
        '<form class="blog-search" id="blogSearch"><input id="blogQ" placeholder="Search articles…" value="'+E(d.q||"")+'"><button type="submit">Search</button></form>'+
        (activeLabel ? '<div class="blog-active-filter">'+E(activeLabel)+' <a href="'+S.url("blog")+'">Clear ×</a></div>' : "")+
        (d.empty
          ? '<div class="cmp-empty"><h3>No articles match that search</h3><p>Try a different term, or <a href="'+S.url("blog")+'">browse everything</a>.</p></div>'
          : '<div class="blog-grid">'+d.posts.map(function(x){ return blogCard(x.post, x.author); }).join("")+'</div>')+
      '</div>'+blogSidebar(d)+'</div></div>'+
      D.section("Recommended for you", "Popular products right now.", d.recommended)+
      D.footer());
    var form = $("#blogSearch");
    if (form) form.addEventListener("submit", function(e){
      e.preventDefault();
      location.href = S.url("blog", { q: $("#blogQ").value });
    });
  }
  render();
  document.title = "Blog — UK Computer Shop";
}

function blogPost(D){
  var d = Pages.blogPost(); if (!d) return;
  var p = d.post, a = d.author;
  mount(D.header() + D.crumbs(d.crumbs) +
    '<div class="wrap"><div class="blog-post-hero"><span class="cat">'+E(p.category)+'</span>'+
      '<h1>'+E(p.title)+'</h1>'+
      '<div class="blog-byline"><a class="avatar" href="'+S.url("blogAuthor",{slug:a.slug})+'" style="background-image:url(https://picsum.photos/seed/'+a.avatarSeed+'/100/100);display:block"></a>'+
        '<span><b><a href="'+S.url("blogAuthor",{slug:a.slug})+'" style="color:inherit;text-decoration:none">'+E(a.name)+'</a></b>'+
        '<span>'+E(new Date(p.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}))+' · '+p.readMins+' min read</span></span></div></div>'+
    '<div class="blog-cover" style="background-image:url(https://picsum.photos/seed/'+p.cover+'/1200/600)"></div>'+
    '<div class="blog-post-body">'+p.body.map(function(para){ return '<p>'+para+'</p>'; }).join("")+
      '<div class="blog-post-tags">'+p.tags.map(function(t){ return '<a class="blog-tags" style="display:inline-block" href="'+S.url("blog",{tag:t})+'">'+E(t)+'</a>'; }).join("")+'</div>'+
      '<div class="author-card"><span class="avatar" style="background-image:url(https://picsum.photos/seed/'+a.avatarSeed+'/120/120)"></span>'+
        '<div><b>'+E(a.name)+'</b><span class="role">'+E(a.role)+'</span><p>'+E(a.bio)+'</p></div></div>'+
    '</div>'+
    '<h2 class="od-sub" style="margin-top:10px">Related articles</h2>'+
    '<div class="blog-grid">'+d.related.map(function(rp){
      var ra = S.BLOG_AUTHORS.filter(function(x){ return x.slug === rp.author; })[0];
      return blogCard(rp, ra);
    }).join("")+'</div>'+
    '</div>'+
    D.section("Recommended for you", "Popular products right now.", d.recommended)+
    D.footer());
  document.title = p.title + " — UK Computer Shop";
}

function blogAuthor(D){
  var d = Pages.blogAuthor(); if (!d) return;
  var a = d.author;
  mount(D.header() + D.crumbs(d.crumbs) +
    '<div class="wrap"><div class="author-hero">'+
      '<span class="avatar" style="background-image:url(https://picsum.photos/seed/'+a.avatarSeed+'/200/200)"></span>'+
      '<div><h1>'+E(a.name)+'</h1><span class="role">'+E(a.role)+'</span><p>'+E(a.bio)+'</p></div>'+
    '</div>'+
    '<h2 class="od-sub">Articles by '+E(a.name)+'</h2>'+
    '<div class="blog-grid">'+d.posts.map(function(p){ return blogCard(p, a); }).join("")+'</div>'+
    '</div>' + D.footer());
  document.title = a.name + " — UK Computer Shop";
}


/* ------------------------------------------------ deals & clearance
   Same reusable-template principle as the category page: one function,
   a ?view=clearance switch, not a parallel page. */
function deals(D){
  var d = Pages.deals(); if (!d) return;
  mount(D.header() + D.crumbs(d.crumbs) +
    '<div class="wrap"><div class="info-hero"><span class="eyebrow">'+(d.view==="clearance"?"Final stock — won't be restocked":"Reduced for a limited time")+'</span>'+
      '<h1>'+(d.view==="clearance"?"Clearance":"Deals &amp; offers")+'</h1>'+
      '<p>'+(d.view==="clearance"
        ? "The deepest reductions in the catalogue, on stock we are not bringing back at this price once it is gone."
        : E(d.allCount)+" products currently reduced across the catalogue.")+'</p></div>'+
      '<div class="cat-chips" style="margin-bottom:22px">'+
        '<a class="cat-chip'+(d.view==="all"?" on":"")+'" href="'+S.url("deals")+'">All offers <span>'+d.allCount+'</span></a>'+
        '<a class="cat-chip'+(d.view==="clearance"?" on":"")+'" href="'+S.url("deals",{view:"clearance"})+'">Clearance <span>'+d.clearanceCount+'</span></a>'+
      '</div>'+
      (d.items.length
        ? '<div class="cat-grid">'+d.items.map(D.card).join("")+'</div>'
        : '<div class="cat-empty"><h3>Nothing in clearance right now</h3><p>Check back soon, or see <a href="'+S.url("deals")+'">all current offers</a>.</p></div>')+
    '</div>'+
    D.section("Recommended for you", "Popular products right now.", d.recommended)+
    D.footer());
  document.title = (d.view==="clearance" ? "Clearance" : "Deals & offers") + " — UK Computer Shop";
}

/* ------------------------------------------------ error & system pages
   Static, deliberately simple — the value of a 404 page is getting a lost
   visitor back on track quickly, not decoration. */
function errorPage(D, opts){
  mount(D.header() +
    '<div class="wrap"><div class="error-page">'+
      (opts.code ? '<div class="code">'+E(opts.code)+'</div>' : "")+
      icon(opts.icon, 40, 40).replace('width="40"','class="ic" width="40"')+
      '<h1>'+E(opts.title)+'</h1><p>'+opts.body+'</p>'+
      '<div class="error-actions">'+opts.actions+'</div>'+
      (opts.links ? '<div class="error-links">'+opts.links+'</div>' : "")+
    '</div></div>' + D.footer());
  document.title = opts.title + " — UK Computer Shop";
}
function error404(D){
  errorPage(D, {
    code: "404", icon:"i-search", title:"We can't find that page",
    body:"The link might be out of date, or the page may have moved. Try searching, or head back to somewhere that exists.",
    actions:'<a class="bk-cta" href="'+S.url("home")+'" style="display:inline-flex;padding:12px 26px">Back to the home page</a>'+
      '<a class="ck-back" href="'+S.url("support")+'" style="display:inline-flex;align-items:center;padding:12px 20px;border:1px solid var(--c-line-strong);border-radius:var(--c-radius)">Visit support</a>',
    links:'<a href="'+S.url("category",{})+'">All products</a><a href="'+S.url("brands")+'">All brands</a><a href="'+S.url("blog")+'">Blog</a><a href="'+S.url("contact")+'">Contact us</a>'
  });
}
function error403(D){
  errorPage(D, {
    code: "403", icon:"i-shield", title:"This area is restricted",
    body:"You don't have access to this page — it may be limited to trade or business accounts, or you may need to sign in first.",
    actions:'<a class="bk-cta" href="'+S.url("login")+'" style="display:inline-flex;padding:12px 26px">Sign in</a>'+
      '<a class="ck-back" href="'+S.url("home")+'" style="display:inline-flex;align-items:center;padding:12px 20px;border:1px solid var(--c-line-strong);border-radius:var(--c-radius)">Back to home</a>',
    links:'<a href="'+S.url("contact")+'">Think this is a mistake? Contact us</a>'
  });
}
function error500(D){
  errorPage(D, {
    code: "500", icon:"i-wrench", title:"Something went wrong on our end",
    body:"Not something you did — an unexpected error occurred while loading this page. Try again in a moment.",
    actions:'<button class="bk-cta" style="padding:12px 26px" onclick="location.reload()">Try again</button>'+
      '<a class="ck-back" href="'+S.url("home")+'" style="display:inline-flex;align-items:center;padding:12px 20px;border:1px solid var(--c-line-strong);border-radius:var(--c-radius)">Back to home</a>',
    links:'<a href="'+S.url("contact")+'">Still broken? Let us know</a>'
  });
}
function maintenance(D){
  errorPage(D, {
    icon:"i-wrench", title:"Back shortly",
    body:"We are carrying out scheduled maintenance. The site will be back to normal within the hour — thanks for your patience.",
    actions:'<a class="bk-cta" href="'+S.url("contact")+'" style="display:inline-flex;padding:12px 26px">Contact us</a>',
    links:""
  });
}
function comingSoon(D){
  errorPage(D, {
    icon:"i-shield", title:"Coming soon",
    body:"This part of the site is not live yet. Check back soon, or get in touch if you have a question in the meantime.",
    actions:'<a class="bk-cta" href="'+S.url("home")+'" style="display:inline-flex;padding:12px 26px">Back to the home page</a>',
    links:'<a href="'+S.url("contact")+'">Contact us</a>'
  });
}

root.Commerce = { category:category, basket:basket, checkout:checkout, account:account, compare:compare,
  login:login, register:register, forgotPassword:forgotPassword,
  orderDetails:orderDetails, orderCancel:orderCancel, orderReturn:orderReturn,
  about:about, contact:contact, stores:stores, faq:faq, support:support,
  delivery:delivery, returns:returns, warranty:warranty, paymentInfo:paymentInfo,
  terms:terms, privacy:privacy, cookiePolicy:cookiePolicy,
  blog:blog, blogPost:blogPost, blogAuthor:blogAuthor, deals:deals,
  error404:error404, error403:error403, error500:error500, maintenance:maintenance, comingSoon:comingSoon };
})(window);
