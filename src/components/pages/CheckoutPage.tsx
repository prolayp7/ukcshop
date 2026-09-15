"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DesignParts } from "@/lib/parts";
import { useCart } from "@/lib/cart";
import { useCustomerAuth } from "@/lib/storefront-client";
import { Address, ShippingQuote, Order, listAddresses, listShippingMethods, checkout, CheckoutAddress } from "@/lib/account-api";
import { listPaymentMethods, createPaymentAttempt, capturePaymentAttempt } from "@/lib/payments-api";
import { money } from "@/lib/catalogue";
import { Icon, ProductVisual } from "@/components/Icon";
import { useHref } from "@/lib/design-context";

const STEPS = ["Delivery", "Payment", "Review"];

const EMPTY_ADDRESS: CheckoutAddress = { fullName: "", line1: "", line2: "", city: "", county: "", postcode: "", country: "GB", phone: "" };

// Survives the full-page round trip to PayPal and back (sessionStorage, not
// React state, since returning from PayPal is a fresh page load) - holds the
// placed order so the success screen and the capture call both have what
// they need regardless of whether the customer was logged in or a guest.
const PAYPAL_RETURN_KEY = "ukcs.paypalCheckout";

export default function CheckoutPage({ parts }: { parts: DesignParts }) {
  const { Header, Footer, Crumbs } = parts;
  const href = useHref();
  const { isLoggedIn } = useCustomerAuth();
  const { cart, loaded } = useCart();
  const searchParams = useSearchParams();
  const paypalAttemptId = searchParams.get("paypalAttempt");
  const paypalWasCancelled = searchParams.get("paypalCancelled") === "1";

  // step is safe to seed from paypalAttemptId directly (URL-derived, identical on
  // server and client). order/capturing/placeError are NOT seeded here even though
  // they also depend on paypalAttemptId - they need sessionStorage, which only
  // exists client-side, so reading it during the initial render (or a lazy
  // useState initializer, which also runs during SSR) would make the server-
  // rendered HTML disagree with the client's first render and break hydration.
  // The effect below sets them after mount instead.
  const [step, setStep] = useState(() => (paypalAttemptId ? 3 : 1));
  const [order, setOrder] = useState<Order | null>(null);
  const [paid, setPaid] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);

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
    listPaymentMethods().then((methods) => setPaypalEnabled(methods.some((m) => m.provider === "PAYPAL" && m.enabled)));
  }, [isLoggedIn]);

  // Handles the return trip from PayPal (redirect back to /checkout?paypalAttempt=...).
  // Reads sessionStorage and calls setState directly in the effect body rather than
  // during render - deliberately, since this syncs in browser-only state (see the
  // note above the useState calls) rather than something computable during render.
  /* eslint-disable react-hooks/set-state-in-effect -- syncing in browser-only
     sessionStorage state post-mount, not something computable during render; see
     the note above the useState calls. */
  useEffect(() => {
    if (!paypalAttemptId) return;
    const raw = sessionStorage.getItem(PAYPAL_RETURN_KEY);
    const saved = raw ? (JSON.parse(raw) as Order) : null;
    if (saved) setOrder(saved);

    if (paypalWasCancelled) {
      setPlaceError("Payment was cancelled — you can try again below.");
      return;
    }
    if (!saved) {
      setPlaceError("We couldn't confirm your payment — please contact us with your order reference if you were charged.");
      return;
    }
    setCapturing(true);
    capturePaymentAttempt(paypalAttemptId, saved.email)
      .then((result) => {
        if (result.status === "CAPTURED") {
          setPaid(true);
          sessionStorage.removeItem(PAYPAL_RETURN_KEY);
        } else {
          setPlaceError(result.error?.message || "Payment could not be completed — please try again.");
        }
      })
      .catch(() => setPlaceError("Payment could not be completed — please try again."))
      .finally(() => setCapturing(false));
    // Intentionally runs once on mount only - paypalAttemptId/paypalWasCancelled are
    // stable for the lifetime of this page load (they come from the URL, which
    // nothing here navigates away from without a full reload).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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
      // Reuse the order from an earlier attempt in this session (e.g. the
      // customer cancelled or PayPal declined) instead of creating a second one.
      const currentOrder = order ?? (await checkout({ email: isLoggedIn ? undefined : email.trim(), shippingAddress, shippingMethodId }));
      if (!order) setOrder(currentOrder);
      const attempt = await createPaymentAttempt({ orderUuid: currentOrder.uuid, email: currentOrder.email, provider: "PAYPAL" });
      if (!attempt.redirectUrl) throw new Error("PayPal did not return a redirect URL");
      sessionStorage.setItem(PAYPAL_RETURN_KEY, JSON.stringify(currentOrder));
      window.location.href = attempt.redirectUrl;
    } catch {
      setPlaceError(order ? "We couldn't start PayPal payment — please try again." : "We couldn't place your order — check your details and try again.");
      setPlacing(false);
    }
  };

  if (capturing) {
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="ck-done">
            <Icon id="i-shield" w={34} />
            <h1>Confirming your payment…</h1>
            <p>Please wait, this only takes a moment.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (order && paid) {
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="ck-done">
            <Icon id="i-shield" w={34} />
            <h1>Order placed</h1>
            <p className="ck-ref">
              Reference <b>{order.orderNumber}</b>
            </p>
            <p>A confirmation has been emailed to you.</p>
            <div className="ck-donebox">
              {order.items.map((item) => (
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
                <b>{money(Number(order.total))}</b>
              </div>
            </div>
            <div className="ck-doneacts">
              {isLoggedIn ? (
                <Link className="bk-cta" href={href.order(order.uuid)}>
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

  if (loaded && !lines.length && !order) {
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
                    <label className={`ck-card${paypalEnabled ? " on" : ""}`}>
                      <input type="radio" name="pay" checked={paypalEnabled} readOnly disabled={!paypalEnabled} />
                      <span>
                        <b>PayPal</b>Pay securely with your PayPal account or a card via PayPal
                      </span>
                    </label>
                  </div>
                  {!paypalEnabled ? (
                    <p className="ck-disclaim">No payment method is currently available — please contact us to place this order.</p>
                  ) : (
                    <p className="ck-disclaim">You&rsquo;ll be redirected to PayPal to complete payment securely, then brought back here.</p>
                  )}
                </section>
                <div className="ck-actions">
                  <button className="ck-back" onClick={() => setStep(1)}>
                    ← Back to delivery
                  </button>
                  <button className="ck-next" disabled={!paypalEnabled} onClick={() => setStep(3)}>
                    Review order <Icon id="i-arr" w={15} />
                  </button>
                </div>
              </>
            )}
            {step === 3 && (shippingAddress || order) && (
              <>
                <section className="ck-block">
                  <h2>Review your order</h2>
                  <div className="ck-rev">
                    <div>
                      <h4>Delivering to</h4>
                      <p>
                        {order ? order.shippingFullName : shippingAddress!.fullName}
                        <br />
                        {order ? (
                          <>
                            {order.shippingLine1}, {order.shippingCity}, {order.shippingPostcode}
                          </>
                        ) : (
                          <>
                            {shippingAddress!.line1}, {shippingAddress!.city}, {shippingAddress!.postcode}
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <h4>Method</h4>
                      <p>{order ? order.shippingMethod?.title : selectedShipping?.title}</p>
                    </div>
                    <div>
                      <h4>Paying by</h4>
                      <p>PayPal</p>
                    </div>
                  </div>
                  <div className="ck-lines">
                    {order
                      ? order.items.map((item) => (
                          <div className="ck-item" key={item.id}>
                            <span className="ck-name">
                              {item.titleSnapshot}
                              <em>Qty {item.quantity}</em>
                            </span>
                            <b>{money(Number(item.subtotal))}</b>
                          </div>
                        ))
                      : lines.map((l) => (
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
                  {!order ? (
                    <button className="ck-back" onClick={() => setStep(2)}>
                      ← Back to payment
                    </button>
                  ) : <span />}
                  <button className="ck-next" disabled={placing || !paypalEnabled} onClick={() => void placeOrder()}>
                    {placing ? "Redirecting to PayPal…" : `Pay with PayPal — ${money(order ? Number(order.total) : total)}`}
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Once an order exists, Step 3's own review section is the source of
              truth (the cart is cleared server-side as soon as the order is
              placed, so `lines`/`subtotal` would just show stale/empty data here). */}
          {!order ? (
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
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  );
}
