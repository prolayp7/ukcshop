"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DesignParts } from "@/lib/parts";
import { useCart } from "@/lib/cart";
import { useCustomerAuth } from "@/lib/storefront-client";
import { Address, ShippingQuote, Order, listAddresses, listShippingMethods, checkout, CheckoutAddress } from "@/lib/account-api";
import { money } from "@/lib/catalogue";
import { Icon, ProductVisual } from "@/components/Icon";
import { useHref } from "@/lib/design-context";

const STEPS = ["Delivery", "Payment", "Review"];

const EMPTY_ADDRESS: CheckoutAddress = { fullName: "", line1: "", line2: "", city: "", county: "", postcode: "", country: "GB", phone: "" };

export default function CheckoutPage({ parts }: { parts: DesignParts }) {
  const { Header, Footer, Crumbs } = parts;
  const href = useHref();
  const { isLoggedIn } = useCustomerAuth();
  const { cart, loaded } = useCart();
  const [step, setStep] = useState(1);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [email, setEmail] = useState("");

  const [shippingMethods, setShippingMethods] = useState<ShippingQuote[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      listAddresses().then((addresses) => {
        setSavedAddresses(addresses);
        const def = addresses.find((a) => a.isDefault) ?? addresses[0];
        if (def) setSelectedSavedId(def.id);
      });
    }
    listShippingMethods().then((methods) => {
      setShippingMethods(methods);
      if (methods[0]) setShippingMethodId(methods[0].id);
    });
  }, [isLoggedIn]);

  const lines = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethodId) ?? null;
  const total = subtotal + (selectedShipping?.rate ?? 0);

  const shippingAddress: CheckoutAddress | null =
    selectedSavedId !== null
      ? (() => {
          const a = savedAddresses.find((x) => x.id === selectedSavedId);
          return a
            ? { fullName: a.fullName, companyName: a.companyName ?? undefined, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, county: a.county ?? undefined, postcode: a.postcode, country: a.country, phone: a.phone ?? undefined }
            : null;
        })()
      : addressForm.fullName && addressForm.line1 && addressForm.city && addressForm.postcode
        ? addressForm
        : null;

  const canContinueFromDelivery = shippingAddress !== null && shippingMethodId !== null && (isLoggedIn || email.trim().length > 3);

  const crumbs = [{ label: "Home", href: href.home() }, { label: "Basket", href: href.basket() }, { label: "Checkout" }];

  const placeOrder = async () => {
    if (!shippingAddress || !shippingMethodId) return;
    setPlacing(true);
    setPlaceError("");
    try {
      const order = await checkout({
        email: isLoggedIn ? undefined : email.trim(),
        shippingAddress,
        shippingMethodId,
      });
      setPlaced(order);
    } catch {
      setPlaceError("We couldn't place your order — check your details and try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="ck-done">
            <Icon id="i-shield" w={34} />
            <h1>Order placed</h1>
            <p className="ck-ref">
              Reference <b>{placed.orderNumber}</b>
            </p>
            <p>A confirmation has been emailed to you.</p>
            <div className="ck-donebox">
              {placed.items.map((item) => (
                <div className="ck-item" key={item.id}>
                  <span className="ck-name">
                    {item.titleSnapshot}
                    <em>Qty {item.quantity}</em>
                  </span>
                  <b>{money(Number(item.subtotal))}</b>
                </div>
              ))}
              <div className="bk-row bk-total">
                <span>Paid</span>
                <b>{money(Number(placed.total))}</b>
              </div>
            </div>
            <div className="ck-doneacts">
              {isLoggedIn ? (
                <Link className="bk-cta" href={href.order(placed.uuid)}>
                  Track this order
                </Link>
              ) : null}
              <Link className="ck-back" href={href.home()}>
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loaded && !lines.length) {
    return (
      <>
        <Header />
        <Crumbs items={crumbs} />
        <div className="wrap">
          <div className="bk-empty">
            <Icon id="i-bag" w={34} />
            <h3>There is nothing to check out</h3>
            <p>Add something to your basket first.</p>
            <Link className="bk-cta" href={href.home()}>
              Browse the catalogue
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Crumbs items={crumbs} />
      <div className="wrap">
        <div className="ck-steps">
          {STEPS.map((s, i) => (
            <div className={`ck-step${i + 1 === step ? " on" : ""}${i + 1 < step ? " done" : ""}`} key={s}>
              <span>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <div className="ck-layout">
          <div className="ck-main">
            {step === 1 && (
              <>
                {!isLoggedIn && (
                  <section className="ck-block">
                    <h2>Contact email</h2>
                    <div className="ck-field">
                      <label>Email address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--c-muted)", margin: "8px 0 0" }}>
                      Already have an account? <Link href={href.login({ next: href.checkout() })}>Sign in</Link>
                    </p>
                  </section>
                )}
                <section className="ck-block">
                  <h2>Delivery address</h2>
                  {savedAddresses.length ? (
                    <div className="ck-addr">
                      {savedAddresses.map((a) => (
                        <label className={`ck-card${selectedSavedId === a.id ? " on" : ""}`} key={a.id}>
                          <input type="radio" name="addr" checked={selectedSavedId === a.id} onChange={() => setSelectedSavedId(a.id)} />
                          <span>
                            <b>{a.label || "Address"}</b>
                            {a.fullName}
                            <br />
                            {a.line1}, {a.city}, {a.postcode}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                  <label className={`ck-card${selectedSavedId === null ? " on" : ""}`} style={{ marginBottom: 12 }}>
                    <input type="radio" name="addr" checked={selectedSavedId === null} onChange={() => setSelectedSavedId(null)} />
                    <span>
                      <b>New address</b>
                      Enter delivery details below
                    </span>
                  </label>
                  {selectedSavedId === null && (
                    <>
                      <div className="ck-field">
                        <label>Full name</label>
                        <input value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} />
                      </div>
                      <div className="ck-field">
                        <label>Address line 1</label>
                        <input value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} />
                      </div>
                      <div className="ck-field">
                        <label>Address line 2 (optional)</label>
                        <input value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} />
                      </div>
                      <div className="ck-two">
                        <div className="ck-field">
                          <label>City</label>
                          <input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                        </div>
                        <div className="ck-field">
                          <label>Postcode</label>
                          <input value={addressForm.postcode} onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })} />
                        </div>
                      </div>
                      <div className="ck-field">
                        <label>Phone (optional)</label>
                        <input value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                      </div>
                    </>
                  )}
                </section>
                <section className="ck-block">
                  <h2>Delivery method</h2>
                  <div className="ck-ship">
                    {shippingMethods.map((m) => (
                      <label className={`ck-card${m.id === shippingMethodId ? " on" : ""}`} key={m.id}>
                        <input type="radio" name="ship" checked={m.id === shippingMethodId} onChange={() => setShippingMethodId(m.id)} />
                        <span>
                          <b>{m.title}</b>
                          {m.estimatedDaysMin !== null ? `${m.estimatedDaysMin}–${m.estimatedDaysMax} working days` : m.carrier}
                        </span>
                        <em>{m.rate === 0 ? "Free" : money(m.rate)}</em>
                      </label>
                    ))}
                    {!shippingMethods.length ? <p className="ac-none">No delivery methods are available for this basket.</p> : null}
                  </div>
                </section>
                <div className="ck-actions">
                  <Link className="ck-back" href={href.basket()}>
                    ← Back to basket
                  </Link>
                  <button className="ck-next" disabled={!canContinueFromDelivery} onClick={() => setStep(2)}>
                    Continue to payment <Icon id="i-arr" w={15} />
                  </button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <section className="ck-block">
                  <h2>Payment</h2>
                  <div className="ck-pm">
                    <label className="ck-card on">
                      <input type="radio" name="pay" defaultChecked />
                      <span>
                        <b>Card</b>Visa, Mastercard, Amex
                      </span>
                    </label>
                  </div>
                  <div className="ck-fake">
                    <div className="ck-fakebar">Layout preview · inputs disabled</div>
                    <div className="ck-field">
                      <label>Name on card</label>
                      <input defaultValue="Placeholder name" disabled />
                    </div>
                    <div className="ck-field">
                      <label>Card number</label>
                      <input defaultValue="•••• •••• •••• ••••" disabled />
                    </div>
                    <p className="ck-disclaim">
                      Card payment collection isn&rsquo;t wired up yet in this build — placing an order below creates a real order awaiting
                      payment, but no card details are collected or charged.
                    </p>
                  </div>
                </section>
                <div className="ck-actions">
                  <button className="ck-back" onClick={() => setStep(1)}>
                    ← Back to delivery
                  </button>
                  <button className="ck-next" onClick={() => setStep(3)}>
                    Review order <Icon id="i-arr" w={15} />
                  </button>
                </div>
              </>
            )}
            {step === 3 && shippingAddress && (
              <>
                <section className="ck-block">
                  <h2>Review your order</h2>
                  <div className="ck-rev">
                    <div>
                      <h4>Delivering to</h4>
                      <p>
                        {shippingAddress.fullName}
                        <br />
                        {shippingAddress.line1}, {shippingAddress.city}, {shippingAddress.postcode}
                      </p>
                    </div>
                    <div>
                      <h4>Method</h4>
                      <p>{selectedShipping?.title}</p>
                    </div>
                    <div>
                      <h4>Paying by</h4>
                      <p>
                        Card
                        <br />
                        Not collected in this build
                      </p>
                    </div>
                  </div>
                  <div className="ck-lines">
                    {lines.map((l) => (
                      <div className="ck-item" key={l.productVariantId}>
                        <span className="ck-thumb">
                          <ProductVisual productId={l.productId} iconId="package" w={44} h={32} />
                        </span>
                        <span className="ck-name">
                          {l.variant.product.title}
                          <em>Qty {l.quantity}</em>
                        </span>
                        <b>{money(l.unitPrice * l.quantity)}</b>
                      </div>
                    ))}
                  </div>
                  {placeError ? (
                    <p className="cart-detail-error" role="alert" style={{ marginTop: 12 }}>
                      {placeError}
                    </p>
                  ) : null}
                </section>
                <div className="ck-actions">
                  <button className="ck-back" onClick={() => setStep(2)}>
                    ← Back to payment
                  </button>
                  <button className="ck-next" disabled={placing} onClick={() => void placeOrder()}>
                    {placing ? "Placing order…" : `Place order — ${money(total)}`}
                  </button>
                </div>
              </>
            )}
          </div>
          <aside className="ck-sum">
            <h2>Order summary</h2>
            {lines.map((l) => (
              <div className="ck-item" key={l.productVariantId}>
                <span className="ck-thumb">
                  <ProductVisual productId={l.productId} iconId="package" w={44} h={32} />
                </span>
                <span className="ck-name">
                  {l.variant.product.title}
                  <em>Qty {l.quantity}</em>
                </span>
                <b>{money(l.unitPrice * l.quantity)}</b>
              </div>
            ))}
            <div className="bk-row">
              <span>Goods</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="bk-row">
              <span>{selectedShipping?.title ?? "Delivery"}</span>
              <b>{selectedShipping ? (selectedShipping.rate === 0 ? "Free" : money(selectedShipping.rate)) : "—"}</b>
            </div>
            <div className="bk-row bk-total">
              <span>Total</span>
              <b>{money(total)}</b>
            </div>
            <Link className="ck-edit" href={href.basket()}>
              Edit basket
            </Link>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
