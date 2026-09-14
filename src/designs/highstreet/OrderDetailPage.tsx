"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/lib/storefront-client";
import { getOrder, Order } from "@/lib/account-api";
import { money } from "@/lib/catalogue";
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

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "My account", href: href.account({ tab: "orders" }) }, { label: order.orderNumber }]} />
      <div className="wrap">
        <div className="ac-head">
          <h1>Order {order.orderNumber}</h1>
          <p>
            Placed {new Date(order.placedAt).toLocaleDateString("en-GB")} · <b>{order.status.replace(/_/g, " ")}</b>
          </p>
        </div>
        <div className="ac-order" style={{ marginBottom: 16 }}>
          <div className="ac-orderitems">
            {order.items.map((item) => (
              <div className="ac-oi" key={item.id}>
                <span>
                  <ProductVisual productId={item.productId} iconId="package" w={40} h={28} />
                </span>
                <span className="ac-oiname">
                  {item.titleSnapshot}
                  <em>
                    Qty {item.quantity} · {money(Number(item.unitPrice))}
                  </em>
                </span>
              </div>
            ))}
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
