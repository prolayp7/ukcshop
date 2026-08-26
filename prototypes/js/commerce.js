/* Category, basket, checkout and account pages.
   The structure is shared across all four designs; each design supplies its own
   chrome and product card, and its own stylesheet gives these classes their look. */
(function (root) {
"use strict";
var S = root.Shop, E = S.esc, M = S.money;
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
    document.title = "Checkout — UK Computer Shop";
  }
  function deliveryStep(d){
    return '<section class="ck-block"><h2>Delivery address</h2>'+
      '<div class="ck-addr">'+d.addresses.map(function(a){
        return '<label class="ck-card'+(a.default ? " on" : "")+'"><input type="radio" name="addr"'+(a.default ? " checked" : "")+'>'+
          '<span><b>'+E(a.label)+'</b>'+E(a.name)+'<br>'+a.lines.map(E).join("<br>")+'<br>'+E(a.phone)+'</span></label>';
      }).join("")+'</div>'+
      '<button class="ck-ghost">+ Add a new address</button></section>'+
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
      '<button class="ac-out">Sign out</button></div>'+
      '<div class="ac-layout"><nav class="ac-nav">'+
        TABS.map(function(t){ return '<a class="'+(t[0] === tab ? "on" : "")+'" href="'+S.url("account",{tab:t[0]})+'">'+t[1]+'</a>'; }).join("")+
      '</nav><div class="ac-main">'+body+'</div></div></div>'+
    (tab === "overview" ? D.section("Recommended for you", "Based on your orders and browsing.", d.recommended) : "")+
    D.footer());
  document.title = "My account — UK Computer Shop";

  function overview(d2){
    return '<div class="ac-stats">'+
      '<div><b>'+d2.orders.length+'</b><span>Orders placed</span></div>'+
      '<div><b>'+M(d2.spend)+'</b><span>Lifetime spend</span></div>'+
      '<div><b>'+d2.wishlist.length+'</b><span>Saved items</span></div>'+
      '<div><b>'+d2.basketCount+'</b><span>In basket</span></div></div>'+
      '<section class="ac-block"><div class="ac-blockhead"><h2>Latest order</h2>'+
        '<a href="'+S.url("account",{tab:"orders"})+'">All orders →</a></div>'+
        orderCard(d2.orders[0])+'</section>'+
      (d2.recentlyViewed.length ? '<section class="ac-block"><div class="ac-blockhead"><h2>Recently viewed</h2></div>'+
        '<div class="ac-mini">'+d2.recentlyViewed.map(miniRow).join("")+'</div></section>' : "");
  }
  function ordersView(d2){
    return '<section class="ac-block"><div class="ac-blockhead"><h2>Order history</h2><span>'+d2.orders.length+' orders</span></div>'+
      d2.orders.map(orderCard).join("")+'</section>';
  }
  function orderCard(o){
    if (!o) return '<p class="ac-none">No orders yet.</p>';
    return '<div class="ac-order"><div class="ac-orderhead">'+
      '<div><b>'+E(o.ref)+'</b><span>Placed '+E(o.date)+'</span></div>'+
      '<div class="ac-right"><span class="ac-status '+(o.status === "Delivered" ? "done" : "live")+'">'+E(o.status)+'</span>'+
      '<b>'+M(o.total)+'</b></div></div>'+
      '<div class="ac-orderitems">'+o.items.map(function(it){
        return '<a class="ac-oi" href="'+S.url("product",{id:it.p.id})+'"><span>'+thumb(it.p,40,30)+'</span>'+
          '<span class="ac-oiname">'+E(it.p.name)+'<em>Qty '+it.qty+' · '+M(it.p.price)+'</em></span></a>';
      }).join("")+'</div>'+
      '<div class="ac-orderacts"><button>Track parcel</button><button>Invoice (PDF)</button><button>Return an item</button>'+
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

root.Commerce = { category:category, basket:basket, checkout:checkout, account:account };
})(window);
