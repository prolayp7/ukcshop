"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Heart, LockKeyhole, Mail, MapPin, Package, Plus, Save, Settings, ShoppingBag, Trash2, Truck, UserRound, X } from "lucide-react";
import { useHref } from "@/lib/design-context";
import { money } from "@/lib/catalogue";
import { Wishlist, type WishlistItem } from "@/lib/basket";
import { createAddress, deleteAddress, type Address, type Order } from "@/lib/account-api";
import { changePassword, updateProfile, type Customer } from "@/lib/storefront-client";
import { productImageUrl } from "@/lib/productImages";
import { PAID_PAYMENT_STATUSES } from "@/lib/invoice";
import shared from "./account-overview.module.css";
import styles from "./account-tabs.module.css";

function label(status: string) { return status.toLowerCase().replaceAll("_", " ").replace(/^./, letter => letter.toUpperCase()); }
function date(value: string) { return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function errorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }

export function OrdersTab({ orders, total, error, onRetry, onLoadMore, loadingMore, moreError }: { orders: Order[] | null; total: number | null; error: boolean; onRetry: () => void; onLoadMore: () => void; loadingMore: boolean; moreError: string }) {
  const href = useHref();
  return <>
    <section className={shared.welcome}><div><h2>Orders &amp; deliveries</h2><p>Track your deliveries, review past purchases and find all your order details in one place.</p></div><Link href={href.category()} className={shared.primaryButton}><ShoppingBag size={14} />Continue shopping</Link></section>
    <div className={styles.summary}><span><Truck size={18} /><strong>{total ?? "—"}</strong> total orders</span><span>{orders ? `${orders.length} loaded` : "Loading order history…"}</span></div>
    {error ? <section className={styles.panel}><div className={styles.empty} role="alert"><Package size={30} /><h3>Orders are unavailable</h3><p>We couldn’t retrieve your order history.</p><button className={shared.primaryButton} onClick={onRetry}>Try again</button></div></section> : !orders ? <section className={styles.panel}><p role="status">Loading your orders…</p></section> : !orders.length ? <section className={styles.panel}><div className={styles.empty}><Package size={32} /><h3>Your order history starts here</h3><p>Your purchases and delivery updates will appear here.</p><Link className={shared.primaryButton} href={href.category()}>Explore the shop <ArrowRight size={14} /></Link></div></section> : orders.map(order => <article className={styles.order} key={order.uuid}>
      <header className={styles.orderHeader}><div><Link href={href.order(order.uuid)} className={styles.orderNumber}>{order.orderNumber}</Link><p>Placed {date(order.placedAt)}</p></div><div className={styles.orderStatus}><span className={shared.status} data-status={order.status}>{label(order.status)}</span><strong>{money(Number(order.total))}</strong></div></header>
      <div className={styles.orderProducts}>{order.items.map(item => <div className={styles.item} key={item.id}><span className={styles.thumbnail}><ProductThumbnail id={item.productId} /></span><div className={styles.itemInfo}><strong>{item.titleSnapshot}</strong>{item.variantTitleSnapshot && <p>{item.variantTitleSnapshot}</p>}<small>Qty {item.quantity} · {money(Number(item.unitPrice))} each</small></div><strong className={styles.itemTotal}>{money(Number(item.subtotal))}</strong></div>)}</div>
      <div className={styles.orderBottom}><div><MapPin size={15} /><span>Delivering to <strong>{order.shippingCity}, {order.shippingPostcode}</strong></span></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{PAID_PAYMENT_STATUSES.includes(order.paymentStatus) && <Link className={shared.secondaryButton} href={href.invoice(order.uuid)}>View invoice</Link>}<Link className={shared.secondaryButton} href={href.order(order.uuid)}>View order &amp; tracking <ArrowRight size={14} /></Link></div></div>
    </article>)}
    {!!orders?.length && <div className={styles.pagination}><p>Showing {orders.length} of {total ?? orders.length} orders</p>{total !== null && orders.length < total && <button className={shared.secondaryButton} disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? "Loading…" : "Load more orders"}</button>}{moreError && <p className={styles.error} role="alert">{moreError}</p>}</div>}
  </>;
}

export function WishlistTab({ items }: { items: WishlistItem[] }) {
  const href = useHref();
  return <>
    <section className={shared.welcome}><div><h2>Saved products</h2><p>A shortlist for your next setup. Keep your favourite components and accessories close at hand.</p></div><Link href={href.category()} className={shared.primaryButton}><Plus size={14} />Find more products</Link></section>
    <div className={styles.summary}><span><Heart size={18} /><strong>{items.length}</strong> saved {items.length === 1 ? "product" : "products"}</span><span>Your personal shortlist</span></div>
    <section className={styles.panel}>{items.length ? <div className={styles.savedList}>{items.map(item => <SavedItem key={item.productVariantId} item={item} />)}</div> : <div className={styles.empty}><Heart size={32} /><h3>Make room for your next upgrade</h3><p>Use the heart on any product to save it to your wishlist.</p><Link href={href.category()} className={shared.primaryButton}>Explore products <ArrowRight size={14} /></Link></div>}</section>
  </>;
}

function SavedItem({ item }: { item: WishlistItem }) {
  const href = useHref();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <article className={styles.savedItem}><Link className={styles.savedImage} href={href.product(item.productSlug)} aria-label={item.productTitle}><ProductThumbnail id={item.productId} /></Link><div className={styles.itemInfo}><h3><Link href={href.product(item.productSlug)}>{item.productTitle}</Link></h3><p>{item.variantTitle}</p><strong className={styles.price}>{money(item.salePrice ?? item.price)}</strong>{item.salePrice !== null && item.salePrice < item.price && <s>{money(item.price)}</s>}{error && <p role="alert" className={styles.error}>{error}</p>}</div><div className={styles.savedActions}><Link className={shared.primaryButton} href={href.product(item.productSlug)}>View product <ArrowRight size={14} /></Link><button type="button" className={styles.removeButton} disabled={busy} aria-label={`Remove ${item.productTitle} from wishlist`} onClick={async () => { setBusy(true); setError(""); try { await Wishlist.toggle(item.productId, item.productVariantId); } catch { setError("Couldn’t remove this product. Please try again."); } finally { setBusy(false); } }}><Trash2 size={14} />{busy ? "Removing…" : "Remove"}</button></div></article>;
}

const emptyAddress = { label: "", fullName: "", line1: "", line2: "", city: "", postcode: "", phone: "" };
export function AddressesTab({ addresses, error, onRetry, onChange }: { addresses: Address[] | null; error: boolean; onRetry: () => void; onChange: (addresses: Address[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const input = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as typeof emptyAddress;
    if (!input.fullName || !input.line1 || !input.city || !input.postcode) { setSaveError("Enter a full name, address, city and postcode."); return; }
    setSaving(true); setSaveError(""); setNotice("");
    try {
      const address = await createAddress({ ...input, country: "GB", addressType: "BOTH", isDefault: (addresses ?? []).length === 0 });
      onChange([...(addresses ?? []), address]); setForm(emptyAddress); setAdding(false); setNotice("Your address has been saved.");
    } catch (error) { setSaveError(errorMessage(error, "Couldn’t save your address. Please try again.")); }
    finally { setSaving(false); }
  }
  return <>
    <section className={shared.welcome}><div><h2>Delivery addresses</h2><p>Keep your delivery details ready for checkout. Manage the places you send your orders.</p></div><button className={shared.primaryButton} disabled={adding || !addresses} onClick={() => { setAdding(true); setNotice(""); }}><Plus size={14} />Add address</button></section>
    {notice && <p className={styles.success} role="status"><CheckCircle2 size={17} />{notice}</p>}
    {error ? <section className={styles.panel}><p role="alert">We couldn’t load your addresses.</p><button className={shared.secondaryButton} onClick={onRetry}>Try again</button></section> : !addresses ? <section className={styles.panel}><p role="status">Loading your addresses…</p></section> : <>
      {addresses.length > 0 && <div className={styles.addressGrid}>{addresses.map(address => <AddressCard key={address.id} address={address} onDelete={() => { onChange(addresses.filter(item => item.id !== address.id)); setNotice("Address removed."); }} />)}</div>}
      {!addresses.length && !adding && <section className={styles.panel}><div className={styles.empty}><MapPin size={32} /><h3>No saved addresses yet</h3><p>Add your home or work address for a quicker checkout.</p><button className={shared.primaryButton} onClick={() => setAdding(true)}><Plus size={14} />Add your first address</button></div></section>}
    </>}
    {adding && <section className={styles.panel}><div className={styles.panelHeading}><h3><MapPin size={19} />Add a delivery address</h3><button aria-label="Cancel adding address" disabled={saving} onClick={() => { setAdding(false); setSaveError(""); }}><X size={20} /></button></div><form className={styles.form} onSubmit={submit} aria-busy={saving}>
      <div className={styles.fields}>{[{ key: "label", label: "Address label (optional)", complete: "off", max: 80 }, { key: "fullName", label: "Full name", complete: "name", max: 120 }, { key: "line1", label: "Address line 1", complete: "address-line1", max: 255 }, { key: "line2", label: "Address line 2 (optional)", complete: "address-line2", max: 255 }, { key: "city", label: "City", complete: "address-level2", max: 120 }, { key: "postcode", label: "Postcode", complete: "postal-code", max: 20 }, { key: "phone", label: "Phone number (optional)", complete: "tel", max: 30 }].map(field => <div className={styles.field} key={field.key}><label htmlFor={`address-${field.key}`}>{field.label}</label><input id={`address-${field.key}`} name={field.key} type={field.key === "phone" ? "tel" : "text"} maxLength={field.max} required={["fullName", "line1", "city", "postcode"].includes(field.key)} autoComplete={field.complete} value={form[field.key as keyof typeof form]} onChange={event => setForm({ ...form, [field.key]: event.target.value })} /></div>)}<div className={styles.field}><label htmlFor="address-country">Country</label><input id="address-country" value="United Kingdom" readOnly /></div></div>
      {saveError && <p className={styles.error} role="alert">{saveError}</p>}<div className={styles.formActions}><button className={shared.primaryButton} disabled={saving} type="submit"><Save size={15} />{saving ? "Saving address…" : "Save address"}</button><button type="button" className={shared.secondaryButton} disabled={saving} onClick={() => { setAdding(false); setSaveError(""); }}>Cancel</button></div>
    </form></section>}
  </>;
}

function AddressCard({ address, onDelete }: { address: Address; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <article className={styles.addressCard}><div className={styles.addressHeading}><span><MapPin size={18} /><strong>{address.label || "Saved address"}</strong></span>{address.isDefault && <span className={shared.addressBadge}>Default</span>}</div><strong>{address.fullName}</strong><address>{address.companyName && <>{address.companyName}<br /></>}{address.line1}<br />{address.line2 && <>{address.line2}<br /></>}{address.city}, {address.postcode}<br />{address.country === "GB" ? "United Kingdom" : address.country}</address>{address.phone && <p>{address.phone}</p>}{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.addressActions}>{confirming ? <><p>Remove this saved address?</p><button className={styles.removeButton} disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await deleteAddress(address.id); onDelete(); } catch (error) { setError(errorMessage(error, "Couldn’t remove this address.")); } finally { setBusy(false); } }}>{busy ? "Removing…" : "Yes, remove"}</button><button className={shared.secondaryButton} disabled={busy} onClick={() => setConfirming(false)}>Keep address</button></> : <button className={styles.removeButton} onClick={() => setConfirming(true)}><Trash2 size={14} />Remove address</button>}</div></article>;
}

export function DetailsTab({ customer }: { customer: Customer }) {
  const [form, setForm] = useState({ firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone || "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordBusy) return;
    if (passwordForm.newPassword.length < 10) { setPasswordError("Your new password must be at least 10 characters."); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError("New passwords do not match."); return; }
    setPasswordBusy(true); setPasswordError(""); setPasswordSaved(false);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSaved(true);
    } catch (error) { setPasswordError(errorMessage(error, "Couldn’t update your password. Please try again.")); }
    finally { setPasswordBusy(false); }
  }
  return <>
    <section className={shared.welcome}><div><h2>Account details</h2><p>Keep your personal information up to date for your next order.</p></div><span className={styles.sectionIcon}><UserRound size={24} /></span></section>
    <section className={styles.panel}><div className={styles.panelHeading}><h3><Settings size={19} />Personal information</h3></div><p className={styles.description}>These details belong to your account. Manage delivery addresses in the Addresses tab.</p><form className={styles.form} aria-busy={busy} onChange={() => setSaved(false)} onSubmit={async event => { event.preventDefault(); if (busy) return; const input = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() }; if (!input.firstName || !input.lastName) { setError("Enter your first and last name."); return; } setBusy(true); setError(""); setSaved(false); try { await updateProfile(input); setSaved(true); } catch (error) { setError(errorMessage(error, "Couldn’t update your details. Please try again.")); } finally { setBusy(false); } }}>
      <div className={styles.fields}>{[{ key: "firstName", label: "First name", complete: "given-name" }, { key: "lastName", label: "Last name", complete: "family-name" }, { key: "phone", label: "Phone number (optional)", complete: "tel" }].map(field => <div className={styles.field} key={field.key}><label htmlFor={`details-${field.key}`}>{field.label}</label><input id={`details-${field.key}`} name={field.key} type={field.key === "phone" ? "tel" : "text"} maxLength={field.key === "phone" ? 30 : 120} required={field.key !== "phone"} autoComplete={field.complete} value={form[field.key as keyof typeof form]} onChange={event => setForm({ ...form, [field.key]: event.target.value })} /></div>)}</div>
      {error && <p className={styles.error} role="alert">{error}</p>}{saved && <p className={styles.success} role="status"><CheckCircle2 size={17} />Your account details have been updated.</p>}<div className={styles.formActions}><button type="submit" className={shared.primaryButton} disabled={busy}><Save size={15} />{busy ? "Saving changes…" : "Save changes"}</button></div>
    </form></section>
    <section className={styles.panel}><div className={styles.panelHeading}><h3><Mail size={19} />Sign-in email</h3>{customer.emailVerified && <span className={shared.addressBadge}>Verified</span>}</div><p className={styles.email}>{customer.email}</p><p className={styles.description}>This is the email address you use to sign in and receive order updates.</p></section>
    <section className={styles.panel}><div className={styles.panelHeading}><h3><LockKeyhole size={19} />Change password</h3></div><p className={styles.description}>Use a strong password you don’t use anywhere else.</p><form className={styles.form} aria-busy={passwordBusy} onChange={() => setPasswordSaved(false)} onSubmit={submitPassword}>
      <div className={styles.fields}>
        <div className={styles.field}><label htmlFor="password-current">Current password</label><input id="password-current" type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={event => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></div>
        <div className={styles.field}><label htmlFor="password-new">New password</label><input id="password-new" type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={passwordForm.newPassword} onChange={event => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></div>
        <div className={styles.field}><label htmlFor="password-confirm">Confirm new password</label><input id="password-confirm" type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={passwordForm.confirmPassword} onChange={event => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></div>
      </div>
      {passwordError && <p className={styles.error} role="alert">{passwordError}</p>}{passwordSaved && <p className={styles.success} role="status"><CheckCircle2 size={17} />Your password has been updated.</p>}<div className={styles.formActions}><button type="submit" className={shared.primaryButton} disabled={passwordBusy}><Save size={15} />{passwordBusy ? "Updating password…" : "Update password"}</button></div>
    </form></section>
  </>;
}

function ProductThumbnail({ id }: { id: number }) {
  const image = productImageUrl(id);
  const [failed, setFailed] = useState(false);
  if (!image || failed) return <Package size={30} strokeWidth={1.3} aria-label="Product image unavailable" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
