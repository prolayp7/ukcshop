"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { returnImage, type ReturnStatus, type ReturnView } from "@/lib/account-api";
import { money } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import styles from "./returns.module.css";

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  RETURN_REQUESTED: "Requested",
  RETURN_APPROVED: "Approved",
  RETURN_REJECTED: "Rejected",
  PICKUP_SCHEDULED: "Pickup scheduled",
  PICKED_UP: "Picked up",
  RETURN_RECEIVED: "Received",
  INSPECTION: "Inspection",
  REFUND_APPROVED: "Refund approved",
  REFUND_PROCESSING: "Refund processing",
  COMPLETED: "Refunded",
  CANCELLED: "Cancelled",
};

/** What the customer is told at each stage (docs: ecom refund flow). */
export const RETURN_STATUS_MESSAGE: Record<ReturnStatus, string> = {
  RETURN_REQUESTED: "We are reviewing your return request.",
  RETURN_APPROVED: "Your return request has been approved. Pickup will be scheduled shortly.",
  RETURN_REJECTED: "Your return request was not approved.",
  PICKUP_SCHEDULED: "Your collection is booked. Please have the items packed and ready.",
  PICKED_UP: "Your returned product has been picked up.",
  RETURN_RECEIVED: "We have received your returned product. It is now being inspected.",
  INSPECTION: "Inspection in progress.",
  REFUND_APPROVED: "Your refund has been approved and will be sent to your original payment method.",
  REFUND_PROCESSING: "Your refund is being processed.",
  COMPLETED: "Refund completed successfully.",
  CANCELLED: "You cancelled this return request.",
};

export function statusTone(status: ReturnStatus): "good" | "bad" | "info" | undefined {
  if (status === "COMPLETED") return "good";
  if (status === "RETURN_REJECTED") return "bad";
  if (status === "CANCELLED") return undefined;
  return "info";
}

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <span className={styles.badge} data-tone={statusTone(status)}>{RETURN_STATUS_LABEL[status]}</span>;
}

// The ten customer-facing steps, placed on the status order; "Under review" (0.5) is the wait in RETURN_REQUESTED.
const ORDER: ReturnStatus[] = ["RETURN_REQUESTED", "RETURN_APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "RETURN_RECEIVED", "INSPECTION", "REFUND_APPROVED", "REFUND_PROCESSING", "COMPLETED"];
const STEPS: { label: string; position: number; status?: ReturnStatus }[] = [
  { label: "Return requested", position: 0, status: "RETURN_REQUESTED" },
  { label: "Under review", position: 0.5 },
  ...ORDER.slice(1).map((status, index) => ({ label: ["Return approved", "Pickup scheduled", "Picked up", "Product received", "Inspection", "Refund approved", "Refund processing", "Refund completed"][index], position: index + 1, status })),
];

export function ReturnTimeline({ ret }: { ret: ReturnView }) {
  const stopped = ret.status === "RETURN_REJECTED" || ret.status === "CANCELLED";
  // Where the return is: a stopped one shows how far it got, a completed one has every step done.
  const reached = stopped ? [...ret.events].reverse().find((event) => event.status && ORDER.includes(event.status))?.status ?? "RETURN_REQUESTED" : ret.status;
  const index = ORDER.indexOf(reached);
  const currentPosition = ret.status === "COMPLETED" ? Infinity : index === 0 ? 0.5 : index;
  const dateOf = (status?: ReturnStatus) => status ? [...ret.events].reverse().find((event) => event.status === status)?.createdAt : undefined;
  return (
    <ol className={styles.timeline}>
      {STEPS.map((step) => {
        const done = stopped ? step.position <= index : step.position < currentPosition;
        const current = !stopped && step.position === currentPosition;
        const when = done || current ? dateOf(step.status) : undefined;
        return (
          <li key={step.label} data-state={done ? "done" : current ? "current" : "todo"}>
            <span>{step.label}{when ? <small>{new Date(when).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</small> : null}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Evidence photos are private: fetched with the customer's credentials and shown from memory.
 * Clicking a thumbnail opens an in-page viewer with previous/next. */
export function EvidenceGallery({ returnNumber, imageIds }: { returnNumber: string; imageIds: number[] }) {
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [index, setIndex] = useState<number | null>(null);
  const viewer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let active = true;
    const created: string[] = [];
    imageIds.forEach((id) => returnImage(returnNumber, id).then((blob) => {
      const url = URL.createObjectURL(blob);
      if (!active) return URL.revokeObjectURL(url);
      created.push(url);
      setUrls((current) => ({ ...current, [id]: url }));
    }).catch(() => undefined));
    return () => { active = false; created.forEach((url) => URL.revokeObjectURL(url)); };
  }, [returnNumber, imageIds]);

  const count = imageIds.length;
  const open = (i: number) => { setIndex(i); viewer.current?.showModal(); };
  const step = (by: number) => setIndex((current) => current === null ? current : Math.min(count - 1, Math.max(0, current + by)));
  return (
    <>
      <span className={styles.photos} style={{ marginTop: 10 }}>
        {imageIds.map((id, i) => (
          <button type="button" key={id} className={styles.photo} onClick={() => open(i)} aria-label={`View photo ${i + 1} of ${count}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {urls[id] ? <img src={urls[id]} alt="" /> : null}
          </button>
        ))}
      </span>
      <dialog ref={viewer} className={styles.viewer} aria-label="Return photos" onClose={() => setIndex(null)}
        onClick={(event) => { if (event.target === event.currentTarget) viewer.current?.close(); }}
        onKeyDown={(event) => { if (event.key === "ArrowLeft") step(-1); if (event.key === "ArrowRight") step(1); }}>
        {index !== null ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {urls[imageIds[index]] ? <img src={urls[imageIds[index]]} alt={`Return photo ${index + 1} of ${count}`} /> : null}
            <button type="button" className={`${styles.viewerButton} ${styles.viewerClose}`} onClick={() => viewer.current?.close()} aria-label="Close"><X size={22} /></button>
            {count > 1 ? (
              <>
                <button type="button" className={`${styles.viewerButton} ${styles.viewerPrev}`} onClick={() => step(-1)} disabled={index === 0} aria-label="Previous photo"><ChevronLeft size={24} /></button>
                <button type="button" className={`${styles.viewerButton} ${styles.viewerNext}`} onClick={() => step(1)} disabled={index === count - 1} aria-label="Next photo"><ChevronRight size={24} /></button>
                <p className={styles.viewerCount} aria-live="polite">{index + 1} / {count}</p>
              </>
            ) : null}
          </>
        ) : null}
      </dialog>
    </>
  );
}

/** My Account > Returns. */
export function ReturnsTab({ returns, error, onRetry }: { returns: ReturnView[] | null; error: boolean; onRetry: () => void }) {
  const href = useHref();
  if (error) return <section className={styles.panel}><p className={styles.error} role="alert">We couldn’t load your returns.</p><button className={styles.ghost} onClick={onRetry}>Try again</button></section>;
  if (!returns) return <section className={styles.panel}><p className={styles.muted} role="status">Loading your returns…</p></section>;
  return (
    <section className={styles.panel}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><RotateCcw size={18} />Returns</h2>
      {!returns.length ? (
        <p className={styles.muted}>You haven’t returned anything. To start a return, open a delivered order from <Link href={href.account({ tab: "orders" })} style={{ textDecoration: "underline" }}>Orders &amp; deliveries</Link>.</p>
      ) : (
        <table className={styles.table}>
          <thead><tr><th>Return</th><th>Order</th><th>Items</th><th>Amount</th><th>Requested</th><th>Status</th></tr></thead>
          <tbody>
            {returns.map((ret) => (
              <tr key={ret.returnNumber}>
                <td><Link href={href.returnDetail(ret.returnNumber)}>{ret.returnNumber}</Link></td>
                <td><Link href={href.order(ret.order.uuid)} style={{ fontWeight: 400 }}>{ret.order.orderNumber}</Link></td>
                <td>{ret.items.length} item{ret.items.length === 1 ? "" : "s"}</td>
                <td className={styles.money}>{money(ret.refundTotal)}</td>
                <td>{new Date(ret.createdAt).toLocaleDateString("en-GB")}</td>
                <td><ReturnStatusBadge status={ret.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
