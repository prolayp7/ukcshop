"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
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

/** Evidence photos are private: fetched with the customer's credentials and shown from memory. */
export function EvidencePhoto({ returnNumber, imageId }: { returnNumber: string; imageId: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;
    returnImage(returnNumber, imageId).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (active) setUrl(objectUrl);
    }).catch(() => undefined);
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [returnNumber, imageId]);
  return (
    <a className={styles.photo} href={url ?? undefined} target="_blank" rel="noopener noreferrer" aria-label="Open photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="Return evidence" /> : null}
    </a>
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
