"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/lib/storefront-client";
import { getOrder, cancelOrder, getReturnable, Order, type ReturnableItem } from "@/lib/account-api";
import { ReturnStatusBadge } from "@/components/pages/ReturnParts";
import { money } from "@/lib/catalogue";
import { PAID_PAYMENT_STATUSES } from "@/lib/invoice";
import { useHref } from "@/lib/design-context";
import { Icon, ProductVisual } from "@/components/Icon";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";

export default function OrderDetailPage() {
  const params = useParams<{ uuid: string }>();
  const href = useHref();
  const { isLoggedIn } = useCustomerAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [returnable, setReturnable] = useState<Map<number, ReturnableItem> | null>(null);

  // See the equivalent note in AccountPage: isLoggedIn's first client
  // render always matches the server's logged-out snapshot, even for a
  // logged-in visitor - gate the redirect on a post-mount render. A hard
  // navigation, not router.replace, for the same reason as AccountPage's
  // sign-out (see that file's note).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && isLoggedIn === false) window.location.href = href.login({ next: href.order(params.uuid) });
  }, [mounted, isLoggedIn, href, params.uuid]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getOrder(params.uuid)
      .then(setOrder)
      .catch(() => setError(true));
  }, [isLoggedIn, params.uuid]);
  // Per-item return eligibility (quantities already returned, deadline) once goods have arrived.
  const delivered = order ? ["DELIVERED", "PARTIALLY_RETURNED", "RETURNED"].includes(order.status) : false;
  useEffect(() => {
    if (!isLoggedIn || !delivered) return;
    getReturnable(params.uuid).then((data) => setReturnable(new Map(data.items.map((item) => [item.orderItemId, item])))).catch(() => undefined);
  }, [isLoggedIn, delivered, params.uuid]);

  const CANCELLABLE = ["PENDING", "AWAITING_PAYMENT", "PROCESSING"];
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

  if (!isLoggedIn) return null;
  if (error) {
    return (
      <>
        <Header />
        <div className="wrap" style={{ padding: "60px 0", textAlign: "center" }}>
          <p>We couldn&rsquo;t find that order.</p>
          <Link className="bk-cta" href={href.account({ tab: "orders" })} style={{ display: "inline-flex" }}>
            Back to orders
          </Link>
        </div>
        <Footer />
      </>
    );
  }
  if (!order) return <div className="wrap" style={{ padding: "60px 0", textAlign: "center", color: "var(--body)" }}>Loading…</div>;

  const shipment = order.shipments?.[0];
  const canStartReturn = !!returnable && [...returnable.values()].some((item) => item.eligible);
  // Every return made against this order (an order can have several).
  const orderReturns = [...new Map(order.items.flatMap((item) => item.returnItems ?? []).map((ri) => [ri.returnRequest.returnNumber, ri.returnRequest])).values()];

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "My account", href: href.account() }, { label: "Orders & deliveries", href: href.account({ tab: "orders" }) }, { label: order.orderNumber }]} />
      <div className="wrap">
        <div className="ac-head">
          <h1>Order {order.orderNumber}</h1>
          <p>
            Placed {new Date(order.placedAt).toLocaleDateString("en-GB")} · <b>{order.status.replace(/_/g, " ")}</b>
          </p>
          {PAID_PAYMENT_STATUSES.includes(order.paymentStatus) ? (
            <Link className="bk-cta" href={href.invoice(order.uuid)} style={{ display: "inline-flex", padding: "10px 20px", marginTop: 8, marginRight: 8 }}>
              View / download invoice
            </Link>
          ) : null}
          {canStartReturn ? (
            <Link className="bk-cta" href={href.returnNew(order.uuid)} style={{ display: "inline-flex", padding: "10px 20px", marginTop: 8, marginRight: 8 }}>
              Return products
            </Link>
          ) : null}
          {CANCELLABLE.includes(order.status) ? (
            <>
              <button type="button" className="bk-cta" onClick={handleCancel} disabled={cancelling} style={{ display: "inline-flex", padding: "10px 20px", marginTop: 8 }}>
                {cancelling ? "Cancelling…" : "Cancel order"}
              </button>
              {cancelError ? <p style={{ color: "#c0392b", fontSize: 13, margin: "8px 0 0" }}>{cancelError}</p> : null}
            </>
          ) : null}
        </div>
        <div className="ac-order" style={{ marginBottom: 16 }}>
          <div className="ac-orderitems">
            {order.items.map((item) => {
              const info = returnable?.get(item.id);
              return (
                <div className="ac-oi" key={item.id} style={{ flexWrap: "wrap" }}>
                  <span>
                    <ProductVisual productId={item.productId} iconId="package" w={40} h={28} />
                  </span>
                  <span className="ac-oiname">
                    {item.titleSnapshot}
                    <em>
                      Qty {item.quantity} · {money(Number(item.unitPrice))}
                    </em>
                    {info ? (
                      <em style={{ display: "block", marginTop: 4 }}>
                        Delivered {info.delivered} · Previously returned {info.previouslyReturned} · Returnable {info.returnable}
                        {info.eligible && info.returnDeadline ? ` · Return by ${new Date(info.returnDeadline).toLocaleDateString("en-GB")}` : ""}
                        {!info.eligible && info.reason ? ` · ${info.reason}` : ""}
                      </em>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="ck-lines" style={{ padding: "12px 16px" }}>
            <div className="bk-row">
              <span>Subtotal</span>
              <b>{money(Number(order.subtotal))}</b>
            </div>
            {Number(order.discountTotal) > 0 ? (
              <div className="bk-row bk-disc">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <b>−{money(Number(order.discountTotal))}</b>
              </div>
            ) : null}
            <div className="bk-row">
              <span>Delivery{order.shippingMethod ? ` — ${order.shippingMethod.title}` : ""}</span>
              <b>{money(Number(order.shippingCharge))}</b>
            </div>
            <div className="bk-row bk-total">
              <span>Total</span>
              <b>{money(Number(order.total))}</b>
            </div>
          </div>
        </div>
        {orderReturns.length ? (
          <div className="ac-block" style={{ marginBottom: 16 }}>
            <div className="ac-blockhead">
              <h2>Returns for this order</h2>
            </div>
            {orderReturns.map((ret) => (
              <div key={ret.returnNumber} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--c-line)", fontSize: 13 }}>
                <Link href={href.returnDetail(ret.returnNumber)} style={{ fontWeight: 700 }}>{ret.returnNumber}</Link>
                <ReturnStatusBadge status={ret.status} />
              </div>
            ))}
          </div>
        ) : null}
        <div className="ck-rev" style={{ marginBottom: 16 }}>
          <div>
            <h4>Delivering to</h4>
            <p>
              {order.shippingFullName}
              <br />
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
              <br />
              {order.shippingCity}, {order.shippingPostcode}
            </p>
          </div>
          <div>
            <h4>Payment</h4>
            <p>{order.paymentStatus.replace(/_/g, " ")}</p>
          </div>
          {shipment ? (
            <div>
              <h4>Tracking</h4>
              <p>
                {shipment.carrier}
                {shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ""}
                <br />
                {shipment.status.replace(/_/g, " ")}
              </p>
            </div>
          ) : null}
        </div>
        {shipment && shipment.events.length ? (
          <div className="ac-block">
            <div className="ac-blockhead">
              <h2>Tracking history</h2>
            </div>
            {shipment.events.map((event) => (
              <div key={event.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--c-line)", fontSize: 13 }}>
                <span>
                  {event.status.replace(/_/g, " ")}
                  {event.description ? ` — ${event.description}` : ""}
                </span>
                <span style={{ color: "var(--c-muted)" }}>{new Date(event.occurredAt).toLocaleString("en-GB")}</span>
              </div>
            ))}
          </div>
        ) : null}
        <Link className="bk-continue" href={href.account({ tab: "orders" })}>
          <Icon id="i-arr" w={14} /> Back to orders
        </Link>
      </div>
      <Footer />
    </>
  );
}
