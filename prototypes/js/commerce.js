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

root.Commerce = { category:category, basket:basket, checkout:checkout, account:account, compare:compare,
  login:login, register:register, forgotPassword:forgotPassword,
  orderDetails:orderDetails, orderCancel:orderCancel, orderReturn:orderReturn };
})(window);
