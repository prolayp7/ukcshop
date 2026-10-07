"use client";

import { toast } from "@/lib/notifications";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useCustomerAuth } from "@/lib/storefront-client";
import { Address, ShippingQuote, Order, listAddresses, listShippingMethods, checkout, CheckoutAddress } from "@/lib/account-api";
import { listPaymentMethods, createPaymentAttempt, capturePaymentAttempt, PAYMENT_RETURN_ORDER_KEY, PaymentProvider } from "@/lib/payments-api";
import { money } from "@/lib/catalogue";
import { Icon, ProductVisual } from "@/components/Icon";
import { useHref } from "@/lib/design-context";
import { useApi } from "@/lib/use-api";
import { createUuid } from "@/lib/uuid";
import type { Product } from "@/lib/types";
import Header from "@/designs/highstreet/Header";
import Footer from "@/designs/highstreet/Footer";
import Crumbs from "@/components/Crumbs";

const STEPS = ["Delivery", "Payment", "Review"];

const EMPTY_ADDRESS: CheckoutAddress = { fullName: "", line1: "", line2: "", city: "", county: "", postcode: "", country: "GB", phone: "" };

// Survives the full-page round trip to PayPal/Stripe and back (sessionStorage, not
// React state, since returning from the provider is a fresh page load) - holds the
// placed order so the success screen and the capture call both have what
// they need regardless of whether the customer was logged in or a guest.
type Provider = Extract<PaymentProvider, "STRIPE" | "PAYPAL">;
const PROVIDERS: { id: Provider; label: string; blurb: string; redirect: string }[] = [
  { id: "STRIPE", label: "Card payment (Stripe)", blurb: "Pay securely by debit or credit card", redirect: "Stripe" },
  { id: "PAYPAL", label: "PayPal", blurb: "Pay securely with your PayPal account or a card via PayPal", redirect: "PayPal" },
];

export default function CheckoutPage() {
  const href = useHref();
  const { isLoggedIn } = useCustomerAuth();
  const { cart, loaded } = useCart();
  const searchParams = useSearchParams();
  const paypalAttemptId = searchParams.get("paypalAttempt") ?? searchParams.get("stripeAttempt");
  const paypalWasCancelled = searchParams.get("paypalCancelled") === "1" || searchParams.get("stripeCancelled") === "1";

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
  const successProductIds = order?.items.map((item) => item.productId).join(",") ?? "";
  const successProducts = useApi<{ items: Product[] }>(paid && successProductIds ? `/api/products?ids=${successProductIds}` : null);
  const [enabledProviders, setEnabledProviders] = useState<Provider[]>([]);
  const [chosen, setChosen] = useState<Provider | null>(null);
  const provider = chosen && enabledProviders.includes(chosen) ? chosen : (enabledProviders[0] ?? null);
  const providerInfo = PROVIDERS.find((p) => p.id === provider);

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [email, setEmail] = useState("");

  const [shippingMethods, setShippingMethods] = useState<ShippingQuote[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);
  const placingRef = useRef(false);

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
    listPaymentMethods().then((methods) => setEnabledProviders(PROVIDERS.filter((p) => methods.some((m) => m.provider === p.id && m.enabled)).map((p) => p.id)));
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
    const raw = sessionStorage.getItem(PAYMENT_RETURN_ORDER_KEY);
    const saved = raw ? (JSON.parse(raw) as Order) : null;
    if (saved) setOrder(saved);

    if (paypalWasCancelled) {
      setPlaceError("Payment was cancelled — you can try again below.");
      toast.warning("Payment cancelled", { id: "payment-status", description: "You can try again below." });
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
          toast.success("Payment successful", { id: "payment-status", description: `Order ${saved.orderNumber} has been paid.` });
          sessionStorage.removeItem(PAYMENT_RETURN_ORDER_KEY);
        } else {
          setPlaceError(result.error?.message || "Payment could not be completed — please try again.");
          toast.error("Payment was unsuccessful", { id: "payment-status", description: result.error?.message || "Please try again." });
        }
      })
      .catch(() => {
        setPlaceError("Payment could not be completed — please try again.");
        toast.error("Unable to confirm payment", { id: "payment-status", description: "Check your order status before trying again, or contact support if you were charged." });
      })
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

  // one key per checkout page visit: a double click or retry returns the same order
  const checkoutKey = useRef(createUuid());
  const placeOrder = async () => {
    if (!shippingAddress || !shippingMethodId || !provider || placingRef.current) return;
    placingRef.current = true;
    setPlacing(true);
    setPlaceError("");
    try {
      // Reuse the order from an earlier attempt in this session (e.g. the
      // customer cancelled or the provider declined) instead of creating a second one.
      const currentOrder = order ?? (await checkout({ email: isLoggedIn ? undefined : email.trim(), shippingAddress, shippingMethodId }, checkoutKey.current));
      if (!order) setOrder(currentOrder);
      const attempt = await createPaymentAttempt({ orderUuid: currentOrder.uuid, email: currentOrder.email, provider });
      if (!attempt.redirectUrl) throw new Error("No redirect URL returned");
      sessionStorage.setItem(PAYMENT_RETURN_ORDER_KEY, JSON.stringify(currentOrder));
      window.location.href = attempt.redirectUrl;
    } catch {
      placingRef.current = false;
      setPlaceError(order ? `We couldn't start ${providerInfo?.redirect ?? "the"} payment — please try again.` : "We couldn't place your order — check your details and try again.");
      toast.error("Could not start payment", { description: "Check your details and try again." });
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
          <div className="ck-done ck-success">
            <section className="ck-success-main" aria-labelledby="order-success-title">
              <div className="ck-success-badge"><Icon id="i-shield" w={30} /></div>
              <p className="ck-success-status">Payment confirmed</p>
              <h1 id="order-success-title">Order placed</h1>
              <p className="ck-success-lead">A confirmation has been sent to <b>{order.email}</b>.</p>
              <dl className="ck-success-facts">
                <div>
                  <dt>Order reference</dt>
                  <dd>{order.orderNumber}</dd>
                </div>
                <div className="ck-success-delivery">
                  <dt>Delivering to</dt>
                  <dd>{order.shippingFullName}<br />{order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ""}<br />{order.shippingCity}, {order.shippingPostcode}</dd>
                </div>
              </dl>
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
            </section>
            <section className="ck-success-order" aria-labelledby="order-summary-title">
              <header className="ck-success-orderhead">
                <h2 id="order-summary-title">Order summary</h2>
                <span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span>
              </header>
              <div className="ck-success-items">
                {order.items.map((item) => {
                  const product = successProducts.data?.items.find((entry) => entry.id === item.productId);
                  return (
                    <article className="ck-success-item" key={item.id}>
                      <span className="ck-success-image" aria-hidden="true">
                        {product?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt="" />
                        ) : (
                          <ProductVisual productId={item.productId} iconId="package" w={66} h={54} />
                        )}
                      </span>
                      <span className="ck-success-product">
                        <b>{item.titleSnapshot}</b>
                        {item.variantTitleSnapshot ? <em>{item.variantTitleSnapshot}</em> : null}
                        <small>Qty {item.quantity}{item.skuSnapshot ? ` · SKU ${item.skuSnapshot}` : ""}</small>
                      </span>
                      <strong className="ck-success-line-total">{money(Number(item.subtotal))}</strong>
                    </article>
                  );
                })}
              </div>
              <div className="ck-success-total">
                <span>Paid</span>
                <strong>{money(Number(order.total))}</strong>
              </div>
            </section>
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
                      <label>Email address <span className="ck-required" aria-hidden="true">*</span></label>
                      <input type="email" aria-required="true" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    <p style={{ fontSize: 14, color: "var(--c-muted)", margin: "8px 0 0" }}>
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
                        <label>Full name <span className="ck-required" aria-hidden="true">*</span></label>
                        <input aria-required="true" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} />
                      </div>
                      <div className="ck-field">
                        <label>Address line 1 <span className="ck-required" aria-hidden="true">*</span></label>
                        <input aria-required="true" value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} />
                      </div>
                      <div className="ck-field">
                        <label>Address line 2 (optional)</label>
                        <input value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} />
                      </div>
                      <div className="ck-two">
                        <div className="ck-field">
                          <label>City <span className="ck-required" aria-hidden="true">*</span></label>
                          <input aria-required="true" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                        </div>
                        <div className="ck-field">
                          <label>Postcode <span className="ck-required" aria-hidden="true">*</span></label>
                          <input aria-required="true" value={addressForm.postcode} onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })} />
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
                        <input type="radio" name="ship" checked={m.id === shippingMethodId} onChange={() => { setShippingMethodId(m.id); toast.info("Delivery option updated", { id: "shipping-method", description: `${m.title} · ${money(m.rate)}` }); }} />
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
                    {PROVIDERS.filter((p) => enabledProviders.includes(p.id)).map((p) => (
                      <label className={`ck-card${provider === p.id ? " on" : ""}`} key={p.id}>
                        <input type="radio" name="pay" checked={provider === p.id} onChange={() => setChosen(p.id)} />
                        <span>
                          <b>{p.label}</b>
                          {p.blurb}
                        </span>
                      </label>
                    ))}
                  </div>
                  {!provider ? (
                    <p className="ck-disclaim">No payment method is currently available — please contact us to place this order.</p>
                  ) : (
                    <p className="ck-disclaim">You&rsquo;ll be redirected to {providerInfo?.redirect} to complete payment securely, then brought back here.</p>
                  )}
                </section>
                <div className="ck-actions">
                  <button className="ck-back" onClick={() => setStep(1)}>
                    ← Back to delivery
                  </button>
                  <button className="ck-next" disabled={!provider} onClick={() => setStep(3)}>
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
                      <p>{providerInfo?.label ?? "—"}</p>
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
                  <button className="ck-next" disabled={placing || !provider} aria-busy={placing} onClick={() => void placeOrder()}>
                    {placing ? `Redirecting to ${providerInfo?.redirect}…` : `Pay with ${providerInfo?.redirect} — ${money(order ? Number(order.total) : total)}`}
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
