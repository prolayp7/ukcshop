"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DesignParts } from "@/lib/parts";
import { useWishlist, Wishlist } from "@/lib/basket";
import { useCustomerAuth, logout, updateProfile } from "@/lib/storefront-client";
import { Address, Order, listAddresses, createAddress, deleteAddress, listOrders } from "@/lib/account-api";
import { money, recommended } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import { ProductVisual } from "@/components/Icon";

const TABS = ["overview", "orders", "wishlist", "addresses", "details"] as const;
type Tab = (typeof TABS)[number];

const STATUS_CLASS: Record<string, string> = {
  PROCESSING: "live",
  PACKED: "live",
  SHIPPED: "live",
  DELIVERED: "done",
  CANCELLED: "cancel",
  FAILED: "cancel",
};

export default function AccountPage({ parts }: { parts: DesignParts }) {
  const { Header, Footer, Crumbs, Section } = parts;
  const href = useHref();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(raw || "") ? (raw as Tab) : "overview";
  const { customer, isLoggedIn } = useCustomerAuth();
  const { items: wishlist } = useWishlist();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const rec = recommended(4, []);

  // isLoggedIn's first client render always matches the server snapshot
  // (false, since there's no localStorage on the server) even for a
  // logged-in visitor - only redirect once a render has happened *after*
  // mount, by which point useSyncExternalStore has corrected to the real
  // client value.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    // A hard navigation, not router.replace: this guard fires right after
    // sign-out, and a full reload guarantees every other bit of client
    // state (cart cache, wishlist cache, etc.) resets along with it.
    if (mounted && isLoggedIn === false) window.location.href = href.login({ next: href.account() });
  }, [mounted, isLoggedIn, href]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (tab === "orders" && !orders) listOrders().then((r) => setOrders(r.items));
    if (tab === "addresses" && !addresses) listAddresses().then(setAddresses);
  }, [isLoggedIn, tab, orders, addresses]);

  if (!isLoggedIn || !customer) return null;
  const spend = (orders ?? []).reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "My account" }]} />
      <div className="wrap">
        <div className="ac-head">
          <h1>My account</h1>
          <p>
            Signed in as {customer.email}
            {"  ·  "}
            <button type="button" className="ac-out" style={{ marginLeft: 8 }} onClick={() => void logout().then(() => { window.location.href = href.home(); })}>
              Sign out
            </button>
          </p>
        </div>
        <div className="ac-layout">
          <nav className="ac-nav">
            {TABS.map((t) => (
              <Link key={t} className={tab === t ? "on" : ""} href={href.account({ tab: t })}>
                {t[0].toUpperCase() + t.slice(1)}
              </Link>
            ))}
          </nav>
          <div className="ac-body">
            {tab === "overview" && (
              <div className="ac-block">
                <div className="ac-blockhead">
                  <h2>Overview</h2>
                </div>
                <div className="ac-stats">
                  <div>
                    <b>{orders?.length ?? "—"}</b>
                    <span>Orders</span>
                  </div>
                  <div>
                    <b>{orders ? money(spend) : "—"}</b>
                    <span>Lifetime spend</span>
                  </div>
                  <div>
                    <b>{wishlist.length}</b>
                    <span>Saved items</span>
                  </div>
                </div>
              </div>
            )}
            {tab === "orders" && (
              <div>
                <div className="ac-blockhead">
                  <h2>Order history</h2>
                  <span>{orders?.length ?? 0} orders</span>
                </div>
                {(orders ?? []).map((order) => (
                  <div className="ac-order" key={order.uuid}>
                    <div className="ac-orderhead">
                      <span>
                        <b>{order.orderNumber}</b>
                        <span>Placed {new Date(order.placedAt).toLocaleDateString("en-GB")}</span>
                      </span>
                      <span className="ac-right">
                        <span className={`ac-status ${STATUS_CLASS[order.status] || "done"}`}>{order.status.replace(/_/g, " ")}</span>
                        <b>{money(Number(order.total))}</b>
                      </span>
                    </div>
                    <div className="ac-orderitems">
                      {order.items.map((it) => (
                        <div className="ac-oi" key={it.id}>
                          <span>
                            <ProductVisual productId={it.productId} iconId="package" w={40} h={28} />
                          </span>
                          <span className="ac-oiname">
                            {it.titleSnapshot}
                            <em>
                              Qty {it.quantity} · {money(Number(it.unitPrice))}
                            </em>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="ac-orderacts">
                      <Link href={href.order(order.uuid)}>Track order</Link>
                    </div>
                  </div>
                ))}
                {orders && !orders.length ? <p className="ac-none">No orders yet.</p> : null}
              </div>
            )}
            {tab === "wishlist" && (
              <div>
                <div className="ac-blockhead">
                  <h2>Wishlist</h2>
                </div>
                {wishlist.length ? (
                  <div className="ac-order" style={{ padding: 0 }}>
                    {wishlist.map((item) => (
                      <div className="ac-oi" key={item.productVariantId} style={{ padding: "12px 16px", borderBottom: "1px solid var(--c-line)" }}>
                        <span>
                          <ProductVisual productId={item.productId} iconId="package" w={40} h={28} />
                        </span>
                        <span className="ac-oiname" style={{ flex: 1 }}>
                          <Link href={href.product(item.productSlug)}>{item.productTitle}</Link>
                          <em>{money(item.salePrice ?? item.price)}</em>
                        </span>
                        <button className="ac-add" type="button" onClick={() => void Wishlist.toggle(item.productId, item.productVariantId)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ac-none">Nothing saved yet — use the heart icon on any product to add it here.</p>
                )}
              </div>
            )}
            {tab === "addresses" && <AddressesTab addresses={addresses} onChange={setAddresses} />}
            {tab === "details" && <DetailsTab />}
          </div>
        </div>
      </div>
      <Section title="Recommended for you" sub="Popular right now across the catalogue." items={rec} />
      <Footer />
    </>
  );
}

function AddressesTab({ addresses, onChange }: { addresses: Address[] | null; onChange: (a: Address[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "", fullName: "", line1: "", line2: "", city: "", postcode: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAddress({ ...form, country: "GB", addressType: "BOTH", isDefault: (addresses ?? []).length === 0 });
      onChange(await listAddresses());
      setForm({ label: "", fullName: "", line1: "", line2: "", city: "", postcode: "", phone: "" });
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="ac-blockhead">
        <h2>Address book</h2>
      </div>
      <div className="ac-addr">
        {(addresses ?? []).map((a) => (
          <div className={`ac-addrcard${a.isDefault ? " on" : ""}`} key={a.id}>
            <b>
              {a.label || "Address"}
              {a.isDefault ? <em>Default</em> : null}
            </b>
            <p>
              {a.fullName}
              <br />
              {a.line1}, {a.city}, {a.postcode}
              <br />
              {a.phone}
            </p>
            <button className="ac-add" type="button" onClick={() => void deleteAddress(a.id).then(() => listAddresses().then(onChange))}>
              Delete
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <form onSubmit={submit} className="ck-block" style={{ marginTop: 12 }}>
          <div className="ck-field">
            <label>Label (optional)</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="ck-field">
            <label>Full name</label>
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="ck-field">
            <label>Address line 1</label>
            <input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          </div>
          <div className="ck-two">
            <div className="ck-field">
              <label>City</label>
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="ck-field">
              <label>Postcode</label>
              <input required value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
            </div>
          </div>
          <button className="bk-cta" type="submit" disabled={saving} style={{ display: "inline-flex", padding: "10px 20px" }}>
            {saving ? "Saving…" : "Save address"}
          </button>
        </form>
      ) : (
        <button className="ac-add" type="button" style={{ marginTop: 16 }} onClick={() => setAdding(true)}>
          + Add a new address
        </button>
      )}
    </div>
  );
}

function DetailsTab() {
  const { customer } = useCustomerAuth();
  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [saved, setSaved] = useState(false);
  if (!customer) return null;

  return (
    <div className="ac-block">
      <div className="ac-blockhead">
        <h2>Account details</h2>
      </div>
      <p>Email: {customer.email}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void updateProfile({ firstName, lastName, phone }).then(() => setSaved(true));
        }}
      >
        <div className="ck-two">
          <div className="ck-field">
            <label>First name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="ck-field">
            <label>Last name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="ck-field">
          <label>Phone</label>
          <input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button className="bk-cta" type="submit" style={{ display: "inline-flex", padding: "10px 20px" }}>
          Save changes
        </button>
        {saved ? <span style={{ marginLeft: 12, fontSize: 12.5, color: "var(--c-muted)" }}>Saved.</span> : null}
      </form>
    </div>
  );
}
