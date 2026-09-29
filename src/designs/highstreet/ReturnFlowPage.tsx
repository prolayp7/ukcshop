"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";
import { useCustomerAuth } from "@/lib/storefront-client";
import { createReturn, getReturnable, type ReturnableOrder, type ReturnReason } from "@/lib/account-api";
import { money } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import { ProductVisual } from "@/components/Icon";
import Crumbs from "@/components/Crumbs";
import styles from "@/components/pages/returns.module.css";
import Header from "./Header";
import Footer from "./Footer";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Draft = { quantity: number; reason: ReturnReason | ""; reasonOther: string; description: string; photos: { file: File; url: string }[] };
const STEPS = ["Select products", "Return details", "Collection address", "Review"] as const;

const subscribeToMount = () => () => {};

export default function ReturnFlowPage() {
  const href = useHref();
  const router = useRouter();
  const orderUuid = useSearchParams().get("order") ?? "";
  const { isLoggedIn } = useCustomerAuth();
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);

  const [data, setData] = useState<ReturnableOrder | null>(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [addressId, setAddressId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mounted && isLoggedIn === false) window.location.href = href.login({ next: href.returnNew(orderUuid) });
  }, [mounted, isLoggedIn, href, orderUuid]);
  useEffect(() => {
    if (!isLoggedIn || !orderUuid) return;
    getReturnable(orderUuid).then(setData).catch((err) => setLoadError(err instanceof Error ? err.message : "We couldn’t load this order."));
  }, [isLoggedIn, orderUuid]);
  // Free preview URLs only when the page goes away (removing a photo frees its own URL).
  const draftsRef = useRef(drafts);
  useEffect(() => { draftsRef.current = drafts; }, [drafts]);
  useEffect(() => () => Object.values(draftsRef.current).forEach((draft) => draft.photos.forEach((photo) => URL.revokeObjectURL(photo.url))), []);

  const items = useMemo(() => data?.items ?? [], [data]);
  const chosen = items.filter((item) => selected.includes(item.orderItemId));
  const draftOf = (id: number): Draft => drafts[id] ?? { quantity: 1, reason: "", reasonOther: "", description: "", photos: [] };
  const update = (id: number, patch: Partial<Draft>) => setDrafts((current) => ({ ...current, [id]: { ...draftOf(id), ...patch } }));
  const reasonLabel = (value: ReturnReason | "") => data?.reasons.find((reason) => reason.value === value)?.label ?? "";
  const address = addressId ? data?.savedAddresses.find((saved) => saved.id === addressId) : data?.deliveryAddress;
  const estimated = chosen.reduce((sum, item) => sum + item.unitRefund * draftOf(item.orderItemId).quantity, 0);

  function toggle(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function addPhotos(id: number, files: FileList | null) {
    if (!files) return;
    const draft = draftOf(id);
    const accepted: { file: File; url: string }[] = [];
    for (const file of Array.from(files)) {
      if (!PHOTO_TYPES.includes(file.type)) { setError(`${file.name}: photos must be JPG, PNG or WEBP.`); continue; }
      if (file.size > MAX_PHOTO_BYTES) { setError(`${file.name}: each photo must be 10 MB or smaller.`); continue; }
      if (draft.photos.length + accepted.length >= MAX_PHOTOS) { setError(`Up to ${MAX_PHOTOS} photos per product.`); break; }
      accepted.push({ file, url: URL.createObjectURL(file) });
    }
    update(id, { photos: [...draft.photos, ...accepted] });
  }

  function removePhoto(id: number, index: number) {
    const draft = draftOf(id);
    URL.revokeObjectURL(draft.photos[index].url);
    update(id, { photos: draft.photos.filter((_, i) => i !== index) });
  }

  function next() {
    setError("");
    if (step === 0 && !chosen.length) return setError("Select at least one product to return.");
    if (step === 1) {
      for (const item of chosen) {
        const draft = draftOf(item.orderItemId);
        if (!draft.reason) return setError(`Choose a reason for ${item.title}.`);
        if (draft.reason === "OTHER" && !draft.reasonOther.trim()) return setError(`Tell us the reason for returning ${item.title}.`);
      }
    }
    setStep((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const created = await createReturn({
        orderUuid,
        addressId: addressId ?? undefined,
        items: chosen.map((item) => {
          const draft = draftOf(item.orderItemId);
          return {
            orderItemId: item.orderItemId, quantity: draft.quantity, reason: draft.reason as ReturnReason,
            ...(draft.reason === "OTHER" ? { reasonOther: draft.reasonOther.trim() } : {}),
            ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
            photos: draft.photos.map((photo) => photo.file),
          };
        }),
      });
      router.push(`${href.returnDetail(created.returnNumber)}?submitted=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t submit your return. Please try again.");
      setSubmitting(false);
    }
  }

  if (!isLoggedIn) return null;
  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "My account", href: href.account() }, { label: "Returns", href: href.account({ tab: "returns" }) }, { label: "New return" }]} />
      <div className={`wrap ${styles.page}`}>
        <div className={styles.head}>
          <div>
            <h1>Return products</h1>
            <p>{data ? <>Order <Link href={href.order(data.order.uuid)} style={{ textDecoration: "underline" }}>{data.order.orderNumber}</Link></> : "Loading your order…"}</p>
          </div>
        </div>

        {!orderUuid || loadError ? (
          <div className={styles.panel}><p className={styles.error}>{loadError || "Choose an order to return from Orders & deliveries."}</p><Link className={styles.ghost} href={href.account({ tab: "orders" })}>Back to orders</Link></div>
        ) : !data ? (
          <div className={styles.panel}><p className={styles.muted} role="status">Loading…</p></div>
        ) : (
          <>
            <ol className={styles.steps} aria-label="Return steps">{STEPS.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined}>{index + 1}. {label}</li>)}</ol>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}

            {step === 0 ? (
              <section className={styles.panel}>
                <h2>Select products to return</h2>
                {items.map((item) => (
                  <label className={styles.item} key={item.orderItemId} data-disabled={!item.eligible}>
                    <input type="checkbox" className={styles.check} checked={selected.includes(item.orderItemId)} disabled={!item.eligible} onChange={() => toggle(item.orderItemId)} aria-label={`Return ${item.title}`} />
                    <span className={styles.thumb}><ProductVisual productId={item.productId} iconId="package" w={40} h={28} /></span>
                    <span className={styles.itemInfo}>
                      <strong>{item.title}</strong>
                      {item.variant ? <p>{item.variant}</p> : null}
                      <span className={styles.facts}>
                        <span>Ordered <b>{item.ordered}</b></span>
                        <span>Delivered <b>{item.delivered}</b></span>
                        <span>Previously returned <b>{item.previouslyReturned}</b></span>
                        <span>Returnable <b>{item.returnable}</b></span>
                        {item.returnDeadline ? <span>Return by <b>{new Date(item.returnDeadline).toLocaleDateString("en-GB")}</b></span> : null}
                      </span>
                      {!item.eligible && item.reason ? <p>{item.reason}</p> : null}
                    </span>
                  </label>
                ))}
                <div className={styles.actions}><button type="button" className={styles.button} onClick={next}>Continue</button></div>
              </section>
            ) : null}

            {step === 1 ? (
              <section className={styles.panel}>
                <h2>Tell us about each product</h2>
                {chosen.map((item) => {
                  const draft = draftOf(item.orderItemId);
                  return (
                    <div className={styles.itemForm} key={item.orderItemId}>
                      <h3>{item.title}</h3>
                      <div className={styles.grid}>
                        <label className={styles.field}><span>Quantity</span>
                          <select value={draft.quantity} onChange={(event) => update(item.orderItemId, { quantity: Number(event.target.value) })}>
                            {Array.from({ length: item.returnable }, (_, i) => i + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
                          </select>
                          <small>Up to {item.returnable}</small>
                        </label>
                        <label className={styles.field}><span>Reason for return</span>
                          <select value={draft.reason} onChange={(event) => update(item.orderItemId, { reason: event.target.value as ReturnReason })} required>
                            <option value="">Choose a reason…</option>
                            {data.reasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                          </select>
                        </label>
                      </div>
                      {draft.reason === "OTHER" ? (
                        <label className={styles.field}><span>Your reason</span><input value={draft.reasonOther} onChange={(event) => update(item.orderItemId, { reasonOther: event.target.value })} maxLength={300} required /></label>
                      ) : null}
                      <label className={styles.field}><span>Describe the problem (optional)</span>
                        <textarea value={draft.description} onChange={(event) => update(item.orderItemId, { description: event.target.value })} maxLength={2000} placeholder="e.g. The fan makes a rattling noise at startup." />
                      </label>
                      <div className={styles.field}>
                        <span>Product photos (optional, up to {MAX_PHOTOS})</span>
                        <div className={styles.photos}>
                          {draft.photos.map((photo, index) => (
                            <div className={styles.photo} key={photo.url}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.url} alt={`Photo ${index + 1} of ${item.title}`} />
                              <button type="button" onClick={() => removePhoto(item.orderItemId, index)} aria-label={`Remove photo ${index + 1}`}><X size={14} /></button>
                            </div>
                          ))}
                          {draft.photos.length < MAX_PHOTOS ? (
                            <label className={styles.addPhoto}>
                              <ImagePlus size={20} />{draft.photos.length ? "Add more" : "Add photos"}
                              <input type="file" accept={PHOTO_TYPES.join(",")} multiple hidden onChange={(event) => { addPhotos(item.orderItemId, event.target.files); event.target.value = ""; }} />
                            </label>
                          ) : null}
                        </div>
                        <small>JPG, PNG or WEBP, up to 10 MB each. Photos help us process your return faster.</small>
                      </div>
                    </div>
                  );
                })}
                <div className={styles.actions}><button type="button" className={styles.ghost} onClick={() => setStep(0)}>Back</button><button type="button" className={styles.button} onClick={next}>Continue</button></div>
              </section>
            ) : null}

            {step === 2 ? (
              <section className={styles.panel}>
                <h2>Where should we collect from?</h2>
                <label className={styles.address}>
                  <input type="radio" name="collect" checked={addressId === null} onChange={() => setAddressId(null)} />
                  <p><b>Delivery address for this order</b><br />{formatAddress(data.deliveryAddress)}</p>
                </label>
                {data.savedAddresses.map((saved) => (
                  <label className={styles.address} key={saved.id}>
                    <input type="radio" name="collect" checked={addressId === saved.id} onChange={() => setAddressId(saved.id)} />
                    <p><b>{saved.label || "Saved address"}</b><br />{formatAddress(saved)}</p>
                  </label>
                ))}
                <p className={styles.muted}>Collections are available from UK addresses in your address book. To use another address, add it under Delivery addresses first.</p>
                <div className={styles.actions}><button type="button" className={styles.ghost} onClick={() => setStep(1)}>Back</button><button type="button" className={styles.button} onClick={next}>Continue</button></div>
              </section>
            ) : null}

            {step === 3 ? (
              <div className={styles.twoCol}>
                <section className={styles.panel}>
                  <h2>Review your return</h2>
                  {chosen.map((item) => {
                    const draft = draftOf(item.orderItemId);
                    return (
                      <div className={styles.item} key={item.orderItemId}>
                        <span className={styles.thumb}><ProductVisual productId={item.productId} iconId="package" w={40} h={28} /></span>
                        <span className={styles.itemInfo}>
                          <strong>{item.title}</strong>
                          <span className={styles.facts}>
                            <span>Quantity <b>{draft.quantity}</b></span>
                            <span>Reason <b>{draft.reason === "OTHER" ? draft.reasonOther : reasonLabel(draft.reason)}</b></span>
                            <span>Photos <b>{draft.photos.length}</b></span>
                          </span>
                          {draft.description ? <p>{draft.description}</p> : null}
                        </span>
                        <span className={styles.money}>{money(item.unitRefund * draft.quantity)}</span>
                      </div>
                    );
                  })}
                </section>
                <aside className={styles.panel}>
                  <h2>Summary</h2>
                  <div className={styles.summaryRow}><span>Estimated refund</span><b className={styles.money}>{money(estimated)}</b></div>
                  <div className={styles.summaryRow}><span>Refund method</span><span>Original payment method</span></div>
                  <div className={styles.summaryRow}><span>Collect from</span><span style={{ textAlign: "right" }}>{address ? formatAddress(address) : ""}</span></div>
                  <p className={styles.muted}>This is an estimate. The final refund is confirmed after we receive and inspect the items. If every item in the order is returned, the delivery charge is refunded too.</p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.ghost} onClick={() => setStep(2)} disabled={submitting}>Back</button>
                    <button type="button" className={styles.button} onClick={() => void submit()} disabled={submitting}>{submitting ? "Submitting…" : "Submit return request"}</button>
                  </div>
                </aside>
              </div>
            ) : null}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

function formatAddress(address: { fullName: string; line1: string; line2: string | null; city: string; county: string | null; postcode: string }) {
  return [address.fullName, address.line1, address.line2, address.city, address.county, address.postcode].filter(Boolean).join(", ");
}
