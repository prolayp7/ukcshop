"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, CircleAlert, CreditCard, FileText, MapPin, PackageCheck, RotateCcw, Truck, X } from "lucide-react";
import { useCustomerAuth } from "@/lib/storefront-client";
import { getOrder, cancelOrder, getReturnable, listAddresses, listOrders, Order, type ReturnableItem } from "@/lib/account-api";
import { ReturnStatusBadge } from "@/components/pages/ReturnParts";
import AccountHeader from "@/components/pages/AccountHeader";
import { createPaymentAttempt, listPaymentMethods, PAYMENT_RETURN_ORDER_KEY, type PaymentProvider } from "@/lib/payments-api";
import { money } from "@/lib/catalogue";
import { PAID_PAYMENT_STATUSES } from "@/lib/invoice";
import { useHref } from "@/lib/design-context";
import { useWishlist } from "@/lib/basket";
import { ProductVisual } from "@/components/Icon";
import Crumbs from "@/components/Crumbs";
import styles from "./OrderDetailPage.module.css";
import Header from "./Header";
import Footer from "./Footer";

const CANCELLABLE = ["PENDING", "AWAITING_PAYMENT", "PROCESSING"];
const PAYABLE = ["PENDING", "AWAITING_PAYMENT", "FAILED"];
type CheckoutProvider = Extract<PaymentProvider, "STRIPE" | "PAYPAL">;
const subscribeToMount = () => () => {};

function statusTone(status: string): "success" | "danger" | "progress" | "neutral" {
  if (["DELIVERED", "PARTIALLY_RETURNED", "RETURNED"].includes(status)) return "success";
  if (["CANCELLED", "FAILED", "PAYMENT_FAILED"].includes(status)) return "danger";
  if (["PROCESSING", "PACKED", "SHIPPED", "AWAITING_PAYMENT"].includes(status)) return "progress";
  return "neutral";
}

export default function OrderDetailPage() {
  const params = useParams<{ uuid: string }>();
  const href = useHref();
  const { customer, isLoggedIn } = useCustomerAuth();
  const { items: wishlist } = useWishlist();
  const [order, setOrder] = useState<Order | null>(null);
  const [accountOrders, setAccountOrders] = useState<Order[] | null>(null);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [addressCount, setAddressCount] = useState<number | null>(null);
  const [availablePaymentProviders, setAvailablePaymentProviders] = useState<CheckoutProvider[] | null>(null);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<CheckoutProvider | null>(null);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [startingPayment, setStartingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [returnable, setReturnable] = useState<Map<number, ReturnableItem> | null>(null);

  // See the equivalent note in AccountPage: isLoggedIn's first client
  // render always matches the server's logged-out snapshot, even for a
  // logged-in visitor - gate the redirect on a post-mount render. A hard
  // navigation, not router.replace, for the same reason as AccountPage's
  // sign-out (see that file's note).
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  useEffect(() => {
    if (mounted && isLoggedIn === false) window.location.href = href.login({ next: href.order(params.uuid) });
  }, [mounted, isLoggedIn, href, params.uuid]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getOrder(params.uuid)
      .then(setOrder)
      .catch(() => setError(true));
  }, [isLoggedIn, params.uuid]);
  useEffect(() => {
    if (!isLoggedIn) return;
    listOrders().then((result) => {
      setAccountOrders(result.items);
      setTotalOrders(result.meta.total);
    }).catch(() => undefined);
    listAddresses().then((addresses) => setAddressCount(addresses.length)).catch(() => undefined);
    listPaymentMethods().then((methods) => {
      const available = methods
        .filter((method) => method.enabled && (method.provider === "STRIPE" || method.provider === "PAYPAL"))
        .map((method) => method.provider as CheckoutProvider);
      setAvailablePaymentProviders(available);
      setSelectedPaymentProvider((current) => current && available.includes(current) ? current : available[0] ?? null);
    }).catch(() => setAvailablePaymentProviders([]));
  }, [isLoggedIn]);
  // Per-item return eligibility (quantities already returned, deadline) once goods have arrived.
  const delivered = order ? ["DELIVERED", "PARTIALLY_RETURNED", "RETURNED"].includes(order.status) : false;
  useEffect(() => {
    if (!isLoggedIn || !delivered) return;
    getReturnable(params.uuid).then((data) => setReturnable(new Map(data.items.map((item) => [item.orderItemId, item])))).catch(() => undefined);
  }, [isLoggedIn, delivered, params.uuid]);

  async function handleCancel() {
    if (!window.confirm("Cancel this order? This can't be undone.")) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelOrder(params.uuid);
      setOrder(updated);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Couldn't cancel this order.");
    } finally {
      setCancelling(false);
    }
  }

  async function handlePayNow() {
    if (!order || !selectedPaymentProvider || startingPayment) return;
    setStartingPayment(true);
    setPaymentError("");
    try {
      const attempt = await createPaymentAttempt({ orderUuid: order.uuid, email: order.email, provider: selectedPaymentProvider });
      if (!attempt.redirectUrl) throw new Error("The payment provider did not return a checkout link.");
      sessionStorage.setItem(PAYMENT_RETURN_ORDER_KEY, JSON.stringify(order));
      window.location.href = attempt.redirectUrl;
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "We couldn’t start your payment. Please try again.");
      setStartingPayment(false);
    }
  }

  if (!isLoggedIn || !customer) return null;
  if (error) {
    return (
      <>
        <Header />
        <div className={`wrap ${styles.page}`}>
          <section className={styles.messagePanel} role="alert">
            <span className={styles.messageIcon}><CircleAlert size={22} /></span>
            <h1>We couldn’t find that order</h1>
            <p>Check the order link or return to your order history.</p>
            <Link className={styles.secondaryAction} href={href.account({ tab: "orders" })}><ArrowLeft size={16} /> Back to orders</Link>
          </section>
        </div>
        <Footer />
      </>
    );
  }
  if (!order) {
    return (
      <>
        <Header />
        <div className={`wrap ${styles.page}`}><div className={styles.loading} role="status">Loading order details<span /></div></div>
        <Footer />
      </>
    );
  }

  const shipment = order.shipments?.[0];
  const trackingCarrier = order.trackingCarrier || shipment?.carrier || order.shippingMethod?.carrier;
  const trackingNumber = order.trackingNumber || shipment?.trackingNumber;
  const trackingStatus = shipment?.status.replace(/_/g, " ");
  const trackingUrl = order.trackingUrl || shipment?.trackingUrl;
  const safeTrackingUrl = trackingUrl && /^https?:\/\//i.test(trackingUrl) ? trackingUrl : null;
  const canStartReturn = !!returnable && [...returnable.values()].some((item) => item.eligible);
  // Every return made against this order (an order can have several).
  const orderReturns = [...new Map(order.items.flatMap((item) => item.returnItems ?? []).map((ri) => [ri.returnRequest.returnNumber, ri.returnRequest])).values()];
  const orderStatus = order.status.replace(/_/g, " ");
  const paymentStatus = order.paymentStatus.replace(/_/g, " ");
  const canPay = !PAID_PAYMENT_STATUSES.includes(order.paymentStatus) && PAYABLE.includes(order.status);

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "My account", href: href.account() }, { label: "Orders & deliveries", href: href.account({ tab: "orders" }) }, { label: order.orderNumber }]} />
      <AccountHeader activeTab="orders" customer={customer} orders={accountOrders} totalOrders={totalOrders} wishlistCount={wishlist.length} addressCount={addressCount} />
      <div className={`wrap ${styles.page}`}>
        <header className={styles.pageHeader}>
          <Link className={styles.backLink} href={href.account({ tab: "orders" })}><ArrowLeft size={16} /> Orders &amp; deliveries</Link>
          <div className={styles.headingRow}>
            <div className={styles.headingCopy}>
              <h1>Order <span>{order.orderNumber}</span></h1>
              <p><CalendarDays size={15} /> Placed {new Date(order.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <span className={styles.status} data-tone={statusTone(order.status)}><span className={styles.statusDot} />{orderStatus}</span>
          </div>
          <div className={styles.actions}>
            {PAID_PAYMENT_STATUSES.includes(order.paymentStatus) ? (
              <Link className={styles.primaryAction} href={href.invoice(order.uuid)}><FileText size={16} /> View / download invoice</Link>
            ) : null}
            {canStartReturn ? (
              <Link className={styles.secondaryAction} href={href.returnNew(order.uuid)}><RotateCcw size={16} /> Return products</Link>
            ) : null}
            {CANCELLABLE.includes(order.status) ? (
              <button type="button" className={styles.cancelAction} onClick={handleCancel} disabled={cancelling}>
                <X size={16} /> {cancelling ? "Cancelling…" : "Cancel order"}
              </button>
            ) : null}
          </div>
          {cancelError ? <p className={styles.cancelError} role="alert">{cancelError}</p> : null}
        </header>

        <section className={styles.overview} aria-label="Order summary">
          <div className={styles.overviewTotal}>
            <span>Order total</span>
            <strong>{money(Number(order.total))}</strong>
          </div>
          <div className={styles.overviewMeta}>
            <div><span>Payment</span><strong data-tone={statusTone(order.paymentStatus)}>{PAID_PAYMENT_STATUSES.includes(order.paymentStatus) ? <Check size={15} /> : <CreditCard size={15} />}{paymentStatus}</strong></div>
            <div><span>Items</span><strong>{order.items.length} {order.items.length === 1 ? "product" : "products"}</strong></div>
            <div><span>Delivery</span><strong>{order.shippingMethod?.title ?? "Standard delivery"}</strong></div>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.panel} aria-labelledby="items-heading">
              <div className={styles.sectionHeading}>
                <div><span className={styles.headingIcon}><PackageCheck size={19} /></span><div><h2 id="items-heading">Items in this order</h2><p>{order.items.length} {order.items.length === 1 ? "product" : "products"}</p></div></div>
              </div>
              <div className={styles.items}>
                {order.items.map((item) => {
                  const info = returnable?.get(item.id);
                  return (
                    <article className={styles.item} key={item.id}>
                      <span className={styles.thumbnail}><ProductVisual productId={item.productId} iconId="package" w={76} h={58} /></span>
                      <div className={styles.itemInfo}>
                        <h3>{item.titleSnapshot}</h3>
                        {item.variantTitleSnapshot ? <p>{item.variantTitleSnapshot}</p> : null}
                        <span className={styles.itemMeta}>Qty {item.quantity} <span>·</span> {money(Number(item.unitPrice))} each</span>
                        {info ? <span className={styles.returnInfo}>Delivered {info.delivered} <span>·</span> Previously returned {info.previouslyReturned} <span>·</span> Returnable {info.returnable}{info.eligible && info.returnDeadline ? ` · Return by ${new Date(info.returnDeadline).toLocaleDateString("en-GB")}` : ""}{!info.eligible && info.reason ? ` · ${info.reason}` : ""}</span> : null}
                      </div>
                      <strong className={styles.itemPrice}>{money(Number(item.subtotal))}</strong>
                    </article>
                  );
                })}
              </div>
              <div className={styles.totals}>
                <div><span>Subtotal</span><strong>{money(Number(order.subtotal))}</strong></div>
                {Number(order.discountTotal) > 0 ? <div className={styles.discount}><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><strong>−{money(Number(order.discountTotal))}</strong></div> : null}
                <div><span>Delivery{order.shippingMethod ? ` · ${order.shippingMethod.title}` : ""}</span><strong>{money(Number(order.shippingCharge))}</strong></div>
                <div className={styles.grandTotal}><span>Order total</span><strong>{money(Number(order.total))}</strong></div>
              </div>
            </section>

            {shipment && shipment.events.length ? (
              <section className={styles.panel} aria-labelledby="tracking-history-heading">
                <div className={styles.sectionHeading}><div><span className={styles.headingIcon}><Truck size={19} /></span><div><h2 id="tracking-history-heading">Tracking history</h2><p>Updates from {shipment.carrier}</p></div></div></div>
                <ol className={styles.events}>
                  {shipment.events.map((event, index) => (
                    <li key={event.id} data-current={index === 0}>
                      <span className={styles.eventMark} />
                      <div><strong>{event.status.replace(/_/g, " ")}</strong>{event.description ? <p>{event.description}</p> : null}<time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.panel} aria-labelledby="delivery-heading">
              <div className={styles.sectionHeading}><div><span className={styles.headingIcon}><MapPin size={19} /></span><div><h2 id="delivery-heading">Delivering to</h2><p>Shipping address</p></div></div></div>
              <address className={styles.address}>
                <strong>{order.shippingFullName}</strong>
                <span>{order.shippingLine1}</span>
                {order.shippingLine2 ? <span>{order.shippingLine2}</span> : null}
                <span>{order.shippingCity}, {order.shippingPostcode}</span>
              </address>
              {trackingCarrier || trackingNumber || trackingStatus ? <div className={styles.trackingSummary}><span className={styles.trackingIcon}><Truck size={17} /></span><div>{trackingCarrier ? <span>{trackingCarrier}</span> : null}<strong>{trackingNumber ?? trackingStatus}</strong>{safeTrackingUrl ? <a href={safeTrackingUrl} target="_blank" rel="noopener noreferrer">Track package</a> : null}</div></div> : null}
            </section>

            <section className={styles.panel} aria-labelledby="payment-heading">
              <div className={styles.sectionHeading}><div><span className={styles.headingIcon}><CreditCard size={19} /></span><div><h2 id="payment-heading">Payment</h2><p>Payment status</p></div></div></div>
              <div className={styles.paymentState} data-tone={statusTone(order.paymentStatus)}>
                <span>{PAID_PAYMENT_STATUSES.includes(order.paymentStatus) ? <Check size={16} /> : <CreditCard size={16} />}</span>
                <div><strong>{paymentStatus}</strong><small>{PAID_PAYMENT_STATUSES.includes(order.paymentStatus) ? "Payment received" : "Payment for this order"}</small></div>
              </div>
              {canPay ? (
                <div className={styles.paymentActions}>
                  {availablePaymentProviders === null ? <p className={styles.paymentHint} role="status">Loading payment methods…</p> : availablePaymentProviders.length ? (
                    <>
                      {availablePaymentProviders.length > 1 ? (
                        <fieldset className={styles.paymentOptions}>
                          <legend>Choose how to pay</legend>
                          {availablePaymentProviders.map((provider) => (
                            <label className={styles.paymentOption} key={provider}>
                              <input type="radio" name={`payment-provider-${order.uuid}`} checked={selectedPaymentProvider === provider} onChange={() => setSelectedPaymentProvider(provider)} />
                              <span>{provider === "PAYPAL" ? "PayPal" : "Debit or credit card"}</span>
                            </label>
                          ))}
                        </fieldset>
                      ) : null}
                      {paymentError ? <p className={styles.paymentError} role="alert">{paymentError}</p> : null}
                      <button className={styles.payAction} type="button" onClick={() => void handlePayNow()} disabled={startingPayment || !selectedPaymentProvider} aria-busy={startingPayment}>
                        {startingPayment ? "Redirecting to payment…" : `Pay now${selectedPaymentProvider ? ` with ${selectedPaymentProvider === "PAYPAL" ? "PayPal" : "card"}` : ""}`}
                      </button>
                    </>
                  ) : <p className={styles.paymentHint} role="status">No payment method is available right now. Please contact customer support.</p>}
                </div>
              ) : null}
            </section>

            {orderReturns.length ? (
              <section className={styles.panel} aria-labelledby="returns-heading">
                <div className={styles.sectionHeading}><div><span className={styles.headingIcon}><RotateCcw size={19} /></span><div><h2 id="returns-heading">Returns</h2><p>For this order</p></div></div></div>
                <div className={styles.returnList}>
                  {orderReturns.map((ret) => (
                    <Link className={styles.returnRow} href={href.returnDetail(ret.returnNumber)} key={ret.returnNumber}>
                      <span><strong>{ret.returnNumber}</strong><ReturnStatusBadge status={ret.status} /></span><ArrowLeft className={styles.returnArrow} size={16} />
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>

        <Link className={styles.bottomBack} href={href.account({ tab: "orders" })}><ArrowLeft size={16} /> Back to orders</Link>
      </div>
      <Footer />
    </>
  );
}
