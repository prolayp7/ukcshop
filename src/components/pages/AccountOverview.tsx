"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, ChevronRight, CircleHelp, CreditCard, Heart, LogOut, MapPin, Package, Search, Settings, ShieldCheck, ShoppingBag, ShoppingCart, Truck, UserRound, Zap } from "lucide-react";
import { useHref } from "@/lib/design-context";
import type { Customer } from "@/lib/storefront-client";
import { logout } from "@/lib/storefront-client";
import type { Address, Order } from "@/lib/account-api";
import type { Product } from "@/lib/types";
import type { WishlistItem } from "@/lib/basket";
import { money } from "@/lib/catalogue";
import { AddToBasketButton } from "@/components/interactive";
import styles from "./account-overview.module.css";

interface Props {
  activeTab?: "overview" | "orders" | "wishlist" | "addresses" | "details";
  children?: ReactNode;
  customer: Customer;
  orders: Order[] | null;
  totalOrders: number | null;
  ordersError: boolean;
  onRetry: () => void;
  addresses: Address[] | null;
  addressesError: boolean;
  wishlist: WishlistItem[];
  products: Product[];
  productsLoading: boolean;
  productsError: boolean;
}

function statusLabel(status: string) {
  return status.toLowerCase().replace(/_/g, " ").replace(/^./, letter => letter.toUpperCase());
}
function date(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountOverview({ activeTab = "overview", children, customer, orders, totalOrders, ordersError, onRetry, addresses, addressesError, wishlist, products, productsLoading, productsError }: Props) {
  const href = useHref();
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const navigation = navigationRef.current;
    const selected = navigation?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!navigation || !selected || navigation.scrollWidth <= navigation.clientWidth) return;
    const container = navigation.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    if (item.left < container.left || item.right > container.right) {
      navigation.scrollLeft += item.left - container.left - (container.width - item.width) / 2;
    }
  }, [activeTab, wishlist.length, addresses?.length]);
  const inProgress = (orders ?? []).filter(order => ["PROCESSING", "PACKED", "SHIPPED"].includes(order.status));
  const dispatch = inProgress.find(order => order.status === "SHIPPED") ?? inProgress[0];
  const paidTotal = (orders ?? []).filter(order => order.paymentStatus === "PAID" && !["CANCELLED", "FAILED"].includes(order.status)).reduce((total, order) => total + Number(order.total), 0);
  const defaultAddress = addresses?.find(address => address.isDefault) ?? addresses?.[0];
  const firstName = customer.firstName || "Welcome";
  const tabs = [
    { tab: "overview", label: "Account overview", Icon: UserRound },
    { tab: "orders", label: "Orders & deliveries", Icon: Truck },
    { tab: "wishlist", label: "Saved products", Icon: Heart },
    { tab: "addresses", label: "Delivery addresses", Icon: MapPin },
    { tab: "details", label: "Account details", Icon: Settings },
  ];
  return <div className={styles.page}>
    <div className={`wrap ${styles.identity}`}>
      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden="true">{customer.firstName?.[0]}{customer.lastName?.[0]}</div>
        <div><div className={styles.nameLine}><h1>{firstName} {customer.lastName}</h1><span className={styles.member}>Customer account</span></div><p>{customer.email}</p><span className={styles.verified}>{customer.emailVerified ? <><CheckCircle2 size={13} />Email verified</> : <><UserRound size={13} />Your personal shopping hub</>}</span></div>
      </div>
      <div className={styles.identitySummary}><div><span>Orders on your account</span><strong>{totalOrders ?? "—"}</strong><Link href={href.account({ tab: "orders" })}>View order history <ChevronRight size={12} /></Link></div><Link className={styles.shipmentSummary} href={href.account({ tab: "orders" })}><Truck size={23} /><span>Recent active orders<strong>{orders ? inProgress.length : "—"} {inProgress.length === 1 ? "order" : "orders"}</strong></span></Link><button className={styles.signout} type="button" onClick={() => void logout().then(() => { window.location.href = href.home(); })}><LogOut size={15} />Sign out</button></div>
    </div>
    <div className="wrap"><nav ref={navigationRef} className={styles.tabs} aria-label="Account navigation">{tabs.map(({ tab, label, Icon }) => <Link href={href.account({ tab })} key={tab} aria-current={tab === activeTab ? "page" : undefined}><Icon size={15} />{label}{tab === "wishlist" && wishlist.length > 0 && <span>{wishlist.length}</span>}{tab === "addresses" && !!addresses?.length && <span>{addresses.length}</span>}</Link>)}</nav></div>
    <div className={styles.dashboardBackground}><div className={`wrap ${styles.dashboard}`}>
      <div className={styles.main}>
        {children ?? <>
        <section className={styles.welcome}><div><h2>Account overview &amp;<br />your shopping hub</h2><p>Keep track of your orders, find your next upgrade and manage the details that make checkout easier.</p></div><div className={styles.welcomeActions}><Link className={styles.secondaryButton} href={href.account({ tab: "details" })}><Settings size={14} />Manage account</Link><Link className={styles.primaryButton} href={href.category()}><ShoppingBag size={14} />Shop products</Link></div></section>
        <div className={styles.stats}>
          <Link href={href.account({ tab: "orders" })}><div><span>Total orders</span><ShoppingBag size={16} /></div><strong>{totalOrders ?? "—"}</strong><p>Your order history</p><footer>View all orders <ArrowRight size={13} /></footer></Link>
          <Link href={href.account({ tab: "orders" })}><div><span>Active orders</span><Truck size={16} /></div><strong>{orders ? inProgress.length : "—"}</strong><p>From your latest orders</p><footer>Track a delivery <ArrowRight size={13} /></footer></Link>
          <Link href={href.account({ tab: "wishlist" })}><div><span>Saved products</span><Heart size={16} /></div><strong>{wishlist.length}</strong><p>Ready for your next setup</p><footer>Open your wishlist <ArrowRight size={13} /></footer></Link>
          <div><div><span>Recent spending</span><CreditCard size={16} /></div><strong>{orders ? money(paidTotal) : "—"}</strong><p>Paid orders on this page</p><footer>{orders ? `${orders.length} recent orders loaded` : ordersError ? "Orders unavailable" : "Loading orders…"}</footer></div>
        </div>
        {dispatch ? <DispatchCard order={dispatch} /> : <section className={styles.emptyDispatch}><Truck size={29} /><div><h3>{ordersError ? "We couldn’t load your deliveries" : orders ? "No active deliveries right now" : "Loading your deliveries…"}</h3><p>{ordersError ? "Please try again to see your latest order status." : "Your next order’s progress will appear here."}</p></div>{ordersError ? <button className={styles.secondaryButton} onClick={onRetry}>Try again</button> : orders && <Link href={href.category()} className={styles.textLink}>Browse products <ArrowRight size={15} /></Link>}</section>}
        <section className={styles.recent}><div className={styles.sectionHeading}><div><h2>Recent orders &amp; deliveries</h2><p>Your latest purchases, delivery updates and order details.</p></div><Link className={styles.textLink} href={href.account({ tab: "orders" })}>View all orders <ArrowRight size={14} /></Link></div>
          {ordersError ? <div className={styles.empty} role="alert">Orders are unavailable. <button onClick={onRetry}>Try again</button></div> : !orders ? <p className={styles.empty} role="status">Loading recent orders…</p> : !orders.length ? <div className={styles.empty}><Package size={26} /><h3>Your order history starts here</h3><p>Find the components, computers and accessories for your next setup.</p><Link className={styles.primaryButton} href={href.category()}>Explore the shop <ArrowRight size={14} /></Link></div> : <div className={styles.tableScroll} role="region" aria-label="Recent orders" tabIndex={0}><table><thead><tr><th scope="col">Order reference</th><th scope="col">Placed</th><th scope="col">Delivering to</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>{orders.slice(0, 5).map(order => <tr key={order.uuid}><td><Link href={href.order(order.uuid)}>{order.orderNumber}</Link></td><td>{date(order.placedAt)}</td><td>{order.shippingCity}<small>{order.shippingPostcode}</small></td><td>{money(Number(order.total))}</td><td><span className={styles.status} data-status={order.status}>{statusLabel(order.status)}</span></td><td><Link href={href.order(order.uuid)} aria-label={`View order ${order.orderNumber}`}>View order <ChevronRight size={12} /></Link></td></tr>)}</tbody></table></div>}
        </section>
        <div className={styles.bottomRow}><section className={styles.detailsCard}><div className={styles.sectionHeading}><h2><MapPin size={18} />Delivery address</h2><Link href={href.account({ tab: "addresses" })}>Manage <ArrowRight size={13} /></Link></div>{defaultAddress ? <><strong>{defaultAddress.fullName}</strong><address>{defaultAddress.line1}{defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}<br />{defaultAddress.city}, {defaultAddress.postcode}</address><span className={styles.addressBadge}>{defaultAddress.isDefault ? "Default address" : "Saved address"}</span></> : <p>{addressesError ? "Your addresses are unavailable right now." : addresses ? "Save a delivery address for your next order." : "Loading your saved addresses…"}</p>}</section><section className={styles.detailsCard}><div className={styles.sectionHeading}><h2><Heart size={18} />Your shortlist</h2><Link href={href.account({ tab: "wishlist" })}>View all <ArrowRight size={13} /></Link></div>{wishlist.length ? <ul className={styles.shortlist}>{wishlist.slice(0, 2).map(item => <li key={item.productVariantId}><Link href={href.product(item.productSlug)}>{item.productTitle}</Link><strong>{money(item.salePrice ?? item.price)}</strong></li>)}</ul> : <p>Use the heart on a product to save it here. Keep your favourite parts together while you compare.</p>}</section></div>
        </>}
      </div>
      <aside className={styles.sidebar} aria-label="Shopping shortcuts and support">
        <section className={styles.recommendations}><div className={styles.sidebarHeading}><Zap size={19} /><h2>Find your next upgrade</h2></div><p>Recommended components and accessories, ready to explore.</p><div className={styles.sidebarLinks}><Link href={href.category()}>All products</Link><Link href={href.category({ cat: "PC Components" })}>Components</Link><Link href={href.category({ deals: 1 })}>Deals</Link></div>
          {productsLoading ? <p role="status">Loading recommendations…</p> : products.length ? <div className={styles.productList}>{products.slice(0, 3).map(product => <article key={product.id}><Link className={styles.productImage} href={href.product(product.slug)} aria-label={product.name}><Thumbnail image={product.image} /></Link><div><small>{product.sku}</small><h3><Link href={href.product(product.slug)}>{product.name}</Link></h3><div className={styles.buyRow}><strong>{money(product.price)}</strong><AddToBasketButton className={styles.addButton} product={product} disabled={product.stockStatus === "out"} aria-label={`Add ${product.name} to basket`}><ShoppingCart size={12} /><span>Add</span></AddToBasketButton></div></div></article>)}</div> : <p>{productsError ? "Recommendations are unavailable right now." : "Browse the catalogue to discover your next upgrade."}</p>}
          <Link className={styles.allProducts} href={href.category()}>Explore all products <ArrowRight size={14} /></Link>
        </section>
        <section className={styles.help}><CircleHelp size={28} /><h2>A little help with<br />your next upgrade?</h2><p>Find answers about shopping, delivery and your account in our help centre.</p><Link href="/faqs">Visit help centre <ArrowRight size={15} /></Link><div><Search size={14} />Find answers at your own pace</div></section>
        <section className={styles.accountTools}><h2><ShieldCheck size={17} />Your account essentials</h2><ul><li><Check size={14} /><Link href={href.account({ tab: "orders" })}>Order details and delivery updates</Link></li><li><Check size={14} /><Link href={href.account({ tab: "addresses" })}>Saved addresses for easier checkout</Link></li><li><Check size={14} /><Link href={href.account({ tab: "wishlist" })}>A wishlist for your favourite products</Link></li><li><Check size={14} /><Link href={href.account({ tab: "details" })}>Manage your personal information</Link></li></ul></section>
      </aside>
    </div></div>
  </div>;
}

function DispatchCard({ order }: { order: Order }) {
  const href = useHref();
  const shipment = order.shipments?.find(item => item.status !== "DELIVERED") ?? order.shipments?.[0];
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
  const steps = ["Order placed", "Preparing", "Dispatched", "Delivered"];
  const current = order.status === "DELIVERED" ? 3 : order.status === "SHIPPED" ? 2 : 1;
  return <section className={styles.dispatch}><header><span className={styles.dispatchIcon}><MapPin size={20} /></span><div><small>Order {order.orderNumber}</small><h2>{order.shippingCity} · {order.shippingPostcode}</h2></div><span className={styles.dispatchBadge}>{statusLabel(order.status)}</span></header><div className={styles.dispatchBody}><div className={styles.deliveryInfo}><div><small>Delivery address</small><strong>{order.shippingFullName}</strong><p>{order.shippingLine1}</p></div><div><small>Carrier &amp; tracking</small><strong>{shipment?.carrier || order.shippingMethod?.carrier || "Awaiting dispatch"}</strong><p>{shipment?.trackingNumber || "Tracking details will appear after dispatch"}</p></div><Link className={styles.primaryButton} href={href.order(order.uuid)}><Truck size={14} />Track order</Link></div><ol className={styles.timeline}>{steps.map((step, index) => <li key={step} data-progress={index < current ? "complete" : index === current ? "current" : "pending"} aria-current={index === current ? "step" : undefined}><span>{index < current ? <Check size={13} /> : index === current ? <Truck size={13} /> : <Package size={13} />}</span><strong>{step}</strong><small>{index === 0 ? date(order.placedAt) : index === current ? "Current status" : index > current ? "Upcoming" : "Complete"}</small></li>)}</ol><footer><div><strong>{itemCount} {itemCount === 1 ? "item" : "items"} in this order</strong><p>{order.items.slice(0, 2).map(item => item.titleSnapshot).join(" · ")}{order.items.length > 2 ? "…" : ""}</p></div><strong>{money(Number(order.total))}</strong><Link href={href.order(order.uuid)} aria-label={`View details for order ${order.orderNumber}`}>Order details <ArrowRight size={14} /></Link></footer>{shipment?.estimatedDeliveryAt && <p className={styles.deliveryEstimate}>Estimated delivery: {date(shipment.estimatedDeliveryAt)}</p>}</div></section>;
}

function Thumbnail({ image }: { image?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return <Package size={27} strokeWidth={1.3} aria-label="Product image unavailable" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
