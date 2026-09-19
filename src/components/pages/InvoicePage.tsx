"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/lib/storefront-client";
import { getOrder, downloadInvoice, Order } from "@/lib/account-api";
import type { ApiGeneralSettings } from "@/lib/api";
import { money, CURRENCY } from "@/lib/catalogue";
import { theme } from "@/lib/theme.config";
import { useApi } from "@/lib/use-api";
import { useHref } from "@/lib/design-context";
import styles from "./invoice.module.css";
import { PAID_PAYMENT_STATUSES } from "@/lib/invoice";
import Crumbs from "@/components/Crumbs";
import Header from "@/designs/highstreet/Header";
import Footer from "@/designs/highstreet/Footer";


/** A printable invoice - the browser's print dialog ("Save as PDF") is the
 * download, so no PDF library is needed. Only shown for paid orders. */
export default function InvoicePage() {
  const { uuid } = useParams<{ uuid: string }>();
  const href = useHref();
  const { isLoggedIn } = useCustomerAuth();
  const settings = useApi<{ data: ApiGeneralSettings }>("/api/settings/general").data?.data ?? {};
  const [order, setOrder] = useState<Order | null>(null);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  async function download() {
    if (!order || downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const url = URL.createObjectURL(await downloadInvoice(order.uuid));
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.invoice?.invoiceNumber ?? order.orderNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("We couldn’t generate your invoice PDF. Please try again.");
    } finally { setDownloading(false); }
  }

  useEffect(() => {
    if (isLoggedIn) getOrder(uuid).then(setOrder).catch(() => setFailed(true));
  }, [isLoggedIn, uuid]);

  const layout = (children: React.ReactNode) => (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "My account", href: href.account() }, { label: "Orders & deliveries", href: href.account({ tab: "orders" }) }, { label: order?.orderNumber ?? "Order", href: href.order(uuid) }, { label: "Invoice" }]} />
      <div className="wrap" style={{ padding: "8px 0 48px" }}>{children}</div>
      <Footer />
    </>
  );
  const message = (content: React.ReactNode) => layout(<p style={{ padding: 40, textAlign: "center" }}>{content}</p>);

  if (!isLoggedIn) return message(<>Please <Link href={href.login({ next: href.invoice(uuid) })}>sign in</Link> to view your invoice.</>);
  if (failed) return message(<>We couldn&rsquo;t find that order. <Link href={href.account({ tab: "orders" })}>Back to orders</Link></>);
  if (!order) return message("Loading…");
  if (!PAID_PAYMENT_STATUSES.includes(order.paymentStatus)) {
    return message(<>An invoice is available once this order has been paid. <Link href={href.account({ tab: "orders" })}>Back to orders</Link></>);
  }

  const n = (value?: string | null) => Number(value ?? 0);
  const date = new Date(order.invoice?.issuedAt ?? order.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const lines = order.items.map((item) => {
    const gross = n(item.subtotal);
    const vat = n(item.vatAmount);
    const rate = n(item.vatRatePercent);
    return { item, rate, vat, gross, net: gross - vat, netUnit: (gross - vat) / item.quantity };
  });
  const byRate = new Map<number, { net: number; vat: number; gross: number }>();
  for (const line of lines) {
    const row = byRate.get(line.rate) ?? { net: 0, vat: 0, gross: 0 };
    byRate.set(line.rate, { net: row.net + line.net, vat: row.vat + line.vat, gross: row.gross + line.gross });
  }
  const rateLabel = (rate: number) => (rate === 0 ? "Zero rated (0%)" : `Standard rate (${rate}%)`);
  const totals = [...byRate.values()].reduce((sum, row) => ({ net: sum.net + row.net, vat: sum.vat + row.vat, gross: sum.gross + row.gross }), { net: 0, vat: 0, gross: 0 });
  const shipment = order.shipments?.[0];
  const company = order.billingCompanyName;
  const settled = order.paymentStatus === "REFUNDED" ? "Refunded" : order.paymentStatus === "PARTIALLY_REFUNDED" ? "Partially refunded" : "Paid in full";
  const address = (a: { line1?: string; line2?: string | null; city?: string; postcode?: string }) => [a.line1, a.line2, [a.city, a.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return layout(
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 16px" }}>
        <Link href={href.account({ tab: "orders" })}>← Back to orders</Link>
        <button type="button" onClick={() => void download()} disabled={downloading} style={{ background: "#e0201f", color: "#fff", padding: "10px 18px", borderRadius: 8, fontWeight: 700, opacity: downloading ? 0.7 : 1 }}>
          {downloading ? "Preparing PDF…" : "Download PDF invoice"}
        </button>
      </div>
      {downloadError ? <p role="alert" style={{ color: "#c0392b", fontSize: 13, margin: "0 0 12px", textAlign: "right" }}>{downloadError}</p> : null}
      <div id="invoice-sheet" className={styles.sheet}>
        <header className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logo || "/images/logo/rigforge-mark.png"} alt="" />
              <b>{theme.brand.name}</b>
            </div>
            <p className={styles.company}>
              <b>{theme.brand.legalName}</b><br />
              {settings.companyAddress || theme.contact.address}<br />
              {settings.vatNumber ? <>VAT reg. no. {settings.vatNumber} · </> : null}{settings.supportEmail || theme.contact.email}
            </p>
          </div>
          <div className={styles.docId}>
            <span className={styles.badge}>Statutory VAT tax invoice</span>
            <h2 className={`${styles.number} ${styles.mono}`}>{order.invoice?.invoiceNumber ?? order.orderNumber}</h2>
          </div>
        </header>
        <div className={styles.meta}>
          <div><span className={styles.label}>Tax point / date</span><b>{date}</b></div>
          <div><span className={styles.label}>Order reference</span><b className={styles.mono}>{order.orderNumber}</b></div>
          <div><span className={styles.label}>Payment status</span><b>{settled}</b></div>
          <div><span className={styles.label}>Delivery method</span><b>{order.shippingMethod?.title ?? "—"}</b></div>
          <div><span className={styles.label}>Currency</span><b>{CURRENCY}</b></div>
          <div><span className={styles.label}>Customer account</span><b>{order.email}</b></div>
        </div>
        <section className={styles.parties}>
          <div className={styles.party}>
            <h3>Invoice addressee (bill to)</h3>
            <strong>{company || order.billingFullName || order.shippingFullName}</strong>
            <p>
              {company ? <>{order.billingFullName}<br /></> : null}
              {address({ line1: order.billingLine1 ?? order.shippingLine1, line2: order.billingLine2 ?? order.shippingLine2, city: order.billingCity ?? order.shippingCity, postcode: order.billingPostcode ?? order.shippingPostcode })}<br />
              {order.email}
            </p>
          </div>
          <div className={styles.party}>
            <h3>Delivery address (ship to){order.status === "DELIVERED" ? <span className={styles.status}>Delivered</span> : null}</h3>
            <strong>{order.shippingFullName}</strong>
            <p>
              {address({ line1: order.shippingLine1, line2: order.shippingLine2, city: order.shippingCity, postcode: order.shippingPostcode })}
              {shipment ? <><br />Carrier: {shipment.carrier}{shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ""}</> : null}
            </p>
          </div>
        </section>
        <div className={styles.itemsHead}>
          <h3>Itemised supply schedule <span>({lines.length} recorded {lines.length === 1 ? "transaction" : "transactions"})</span></h3>
          <small>All values stated in {CURRENCY}</small>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>#</th><th>Description / specification</th><th>Qty</th><th>Unit price (inc. VAT)</th><th>Discount</th><th>Net price</th><th>VAT %</th><th>Line total (net)</th></tr>
          </thead>
          <tbody>
            {lines.map(({ item, rate, netUnit, net }, index) => (
              <tr key={item.id}>
                <td>{String(index + 1).padStart(2, "0")}</td>
                <td><b>{item.titleSnapshot}</b><small>{item.variantTitleSnapshot}{item.skuSnapshot ? <span className={styles.mono}> · {item.skuSnapshot}</span> : null}</small></td>
                <td><b>{item.quantity}</b></td>
                <td>{money(n(item.unitPrice))}</td>
                <td>{n(item.discount) > 0 ? <span className={styles.accent}>{money(n(item.discount))}</span> : "—"}</td>
                <td>{money(netUnit)}</td>
                <td>{rate.toFixed(1)}%</td>
                <td><b>{money(net)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        <section className={styles.lower}>
          <div>
            <div className={styles.box}>
              <h4>Statutory VAT rate analysis</h4>
              <table className={styles.vat}>
                <thead><tr><th>VAT category &amp; rate</th><th>Goods net total</th><th>VAT payable</th><th>Gross total</th></tr></thead>
                <tbody>
                  {[...byRate.entries()].map(([rate, row]) => (
                    <tr key={rate}><td>{rateLabel(rate)}</td><td>{money(row.net)}</td><td>{money(row.vat)}</td><td>{money(row.gross)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td>Totals subject to VAT</td><td>{money(totals.net)}</td><td>{money(totals.vat)}</td><td>{money(totals.gross)}</td></tr></tfoot>
              </table>
            </div>
            <p className={styles.note}>Statutory tax point: {date}. Item prices above include VAT at the rate shown.</p>
          </div>
          <div>
            <div className={styles.box}>
              <h4>Financial settlement ledger</h4>
              <div className={styles.ledger}>
                <div><span>Goods subtotal (inc. VAT)</span><span>{money(n(order.subtotal))}</span></div>
                {n(order.discountTotal) > 0 ? <div><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span className={styles.accent}>−{money(n(order.discountTotal))}</span></div> : null}
                <div><span>Delivery{order.shippingMethod ? ` — ${order.shippingMethod.title}` : ""}</span><span>{n(order.shippingCharge) === 0 ? "Free" : money(n(order.shippingCharge))}</span></div>
                <div className={styles.rule}><span>Total (ex. VAT)</span><span>{money(n(order.total) - n(order.vatTotal))}</span></div>
                <div><span>VAT included</span><span>{money(n(order.vatTotal))}</span></div>
              </div>
            </div>
            <div className={styles.totalBox}>
              <small>Total invoice value (inc. VAT)</small>
              <strong>{money(n(order.total))}</strong>
              <em>{settled}</em>
            </div>
          </div>
        </section>
        <footer className={styles.foot}>
          <span>{settings.copyright || `© ${new Date().getFullYear()} ${theme.brand.legalName}`}{settings.vatNumber ? ` · VAT reg. no. ${settings.vatNumber}` : ""}</span>
          <span><b>{settings.supportPhone1 || theme.contact.phone}</b> · {settings.supportEmail || theme.contact.email}</span>
        </footer>
      </div>
    </div>
  );
}
