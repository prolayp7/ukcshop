"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/lib/storefront-client";
import { cancelReturn, getReturn, type ReturnView } from "@/lib/account-api";
import { money } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import { ProductVisual } from "@/components/Icon";
import Crumbs from "@/components/Crumbs";
import { EvidencePhoto, RETURN_STATUS_MESSAGE, ReturnStatusBadge, ReturnTimeline } from "@/components/pages/ReturnParts";
import styles from "@/components/pages/returns.module.css";
import Header from "./Header";
import Footer from "./Footer";

const subscribeToMount = () => () => {};
const METHOD: Record<string, string> = { STRIPE: "Card (Stripe)", PAYPAL: "PayPal", TWOCHECKOUT: "Card (2Checkout)" };
const REFUND_STATUS: Record<string, string> = { PENDING: "Pending", PROCESSING: "Processing", PROCESSED: "Successful", FAILED: "Failed - we are retrying", CANCELLED: "Cancelled" };

export default function ReturnDetailPage() {
  const href = useHref();
  const { returnNumber } = useParams<{ returnNumber: string }>();
  const justSubmitted = useSearchParams().get("submitted") === "1";
  const { isLoggedIn } = useCustomerAuth();
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  const [ret, setRet] = useState<ReturnView | null>(null);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (mounted && isLoggedIn === false) window.location.href = href.login({ next: href.returnDetail(returnNumber) });
  }, [mounted, isLoggedIn, href, returnNumber]);
  useEffect(() => {
    if (!isLoggedIn) return;
    getReturn(returnNumber).then(setRet).catch(() => setError(true));
  }, [isLoggedIn, returnNumber]);

  async function cancel() {
    if (!window.confirm("Cancel this return request?")) return;
    setCancelling(true);
    setCancelError("");
    try {
      setRet(await cancelReturn(returnNumber));
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "We couldn’t cancel this return.");
    } finally {
      setCancelling(false);
    }
  }

  if (!isLoggedIn) return null;
  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "My account", href: href.account() }, { label: "Returns", href: href.account({ tab: "returns" }) }, { label: returnNumber }]} />
      <div className={`wrap ${styles.page}`}>
        {error ? (
          <div className={styles.panel}><p className={styles.error}>We couldn’t find that return.</p><Link className={styles.ghost} href={href.account({ tab: "returns" })}>Back to returns</Link></div>
        ) : !ret ? (
          <div className={styles.panel}><p className={styles.muted} role="status">Loading…</p></div>
        ) : (
          <>
            <div className={styles.head}>
              <div>
                <h1>Return {ret.returnNumber}</h1>
                <p>Order <Link href={href.order(ret.order.uuid)} style={{ textDecoration: "underline" }}>{ret.order.orderNumber}</Link> · Requested {new Date(ret.createdAt).toLocaleDateString("en-GB")}</p>
              </div>
              <ReturnStatusBadge status={ret.status} />
            </div>

            {justSubmitted && ret.status === "RETURN_REQUESTED" ? <div className={`${styles.notice} ${styles.good}`}><strong>Return request submitted successfully.</strong>We’ve emailed you a confirmation and will review it shortly.</div> : null}
            <div className={`${styles.notice} ${ret.status === "RETURN_REJECTED" ? styles.bad : ret.status === "COMPLETED" ? styles.good : ""}`}>
              <strong>{RETURN_STATUS_MESSAGE[ret.status]}</strong>
              {ret.status === "RETURN_REJECTED" && ret.rejectionReason ? <>Reason: {ret.rejectionReason}</> : null}
            </div>

            <div className={styles.twoCol}>
              <div>
                {ret.pickup ? (
                  <section className={styles.panel}>
                    <h2>Collection</h2>
                    {ret.pickup.date ? <div className={styles.summaryRow}><span>Pickup date</span><b>{new Date(ret.pickup.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</b></div> : null}
                    {ret.pickup.window ? <div className={styles.summaryRow}><span>Time window</span><b>{ret.pickup.window}</b></div> : null}
                    {ret.pickup.courier ? <div className={styles.summaryRow}><span>Courier</span><b>{ret.pickup.courier}</b></div> : null}
                    {ret.pickup.trackingNumber ? <div className={styles.summaryRow}><span>Tracking number</span><b>{ret.pickup.trackingNumber}</b></div> : null}
                  </section>
                ) : null}

                <section className={styles.panel}>
                  <h2>Items</h2>
                  {ret.items.map((item) => (
                    <div className={styles.item} key={item.id}>
                      <span className={styles.thumb}><ProductVisual productId={item.productId} iconId="package" w={40} h={28} /></span>
                      <span className={styles.itemInfo}>
                        <strong>{item.title}</strong>
                        {item.variant ? <p>{item.variant}</p> : null}
                        <span className={styles.facts}>
                          <span>Returning <b>{item.quantity}</b> of {item.orderedQuantity}</span>
                          {item.approvedQuantity !== null ? <span>Approved <b>{item.approvedQuantity}</b></span> : null}
                          {item.receivedQuantity !== null ? <span>Received <b>{item.receivedQuantity}</b></span> : null}
                          {item.acceptedQuantity !== null ? <span>Accepted <b>{item.acceptedQuantity}</b></span> : null}
                          <span>Reason <b>{item.reason === "OTHER" && item.reasonOther ? item.reasonOther : item.reasonLabel}</b></span>
                        </span>
                        {item.description ? <p>{item.description}</p> : null}
                        {item.inspectionResult === "REJECTED" && item.inspectionRejectionReason ? <p><b>Not accepted at inspection:</b> {item.inspectionRejectionReason}</p> : null}
                        {item.deductionAmount > 0 ? <p><b>Deduction {money(item.deductionAmount)}:</b> {item.deductionReason}</p> : null}
                        {item.imageIds.length ? <span className={styles.photos} style={{ marginTop: 10 }}>{item.imageIds.map((id) => <EvidencePhoto key={id} returnNumber={ret.returnNumber} imageId={id} />)}</span> : null}
                      </span>
                      <span className={styles.money}>{money(item.refundAmount)}</span>
                    </div>
                  ))}
                </section>

                <section className={styles.panel}>
                  <h2>Refund</h2>
                  <div className={styles.summaryRow}><span>{ret.items.every((item) => item.refundIsFinal) ? "Refund amount" : "Estimated refund"}</span><b className={styles.money}>{money(ret.refundTotal)}</b></div>
                  {ret.shippingRefund > 0 ? <div className={styles.summaryRow}><span>Includes delivery charge</span><span className={styles.money}>{money(ret.shippingRefund)}</span></div> : null}
                  <div className={styles.summaryRow}><span>Refund method</span><span>Original payment method</span></div>
                  {ret.refunds.map((refund, index) => (
                    <div className={styles.summaryRow} key={index}>
                      <span>{METHOD[refund.method] ?? refund.method} · {REFUND_STATUS[refund.status] ?? refund.status}{refund.providerRefundId ? <small className={styles.muted} style={{ display: "block" }}>Refund ID {refund.providerRefundId}</small> : null}{refund.processedAt ? <small className={styles.muted} style={{ display: "block" }}>Completed {new Date(refund.processedAt).toLocaleDateString("en-GB")}</small> : null}</span>
                      <b className={styles.money}>{money(refund.amount)}</b>
                    </div>
                  ))}
                  {!ret.items.every((item) => item.refundIsFinal) ? <p className={styles.muted}>The final amount is confirmed after we receive and inspect your items.</p> : null}
                </section>
              </div>

              <aside>
                <section className={styles.panel}>
                  <h2>Return progress</h2>
                  <ReturnTimeline ret={ret} />
                </section>
                <section className={styles.panel}>
                  <h2>Collect from</h2>
                  <p className={styles.muted} style={{ margin: 0 }}>{[ret.pickupAddress.fullName, ret.pickupAddress.line1, ret.pickupAddress.line2, ret.pickupAddress.city, ret.pickupAddress.county, ret.pickupAddress.postcode].filter(Boolean).join(", ")}</p>
                </section>
                {ret.status === "RETURN_REQUESTED" ? (
                  <section className={styles.panel}>
                    <p className={styles.muted} style={{ marginTop: 0 }}>Changed your mind? You can cancel this return until we’ve reviewed it.</p>
                    {cancelError ? <p className={styles.error}>{cancelError}</p> : null}
                    <button type="button" className={styles.ghost} onClick={() => void cancel()} disabled={cancelling}>{cancelling ? "Cancelling…" : "Cancel return request"}</button>
                  </section>
                ) : null}
              </aside>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
