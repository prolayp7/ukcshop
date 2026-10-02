"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Heart, LogOut, MapPin, RotateCcw, Settings, Truck, UserRound } from "lucide-react";
import { useHref } from "@/lib/design-context";
import type { Order } from "@/lib/account-api";
import { logout, type Customer } from "@/lib/storefront-client";
import styles from "./account-overview.module.css";

export type AccountTab = "overview" | "orders" | "returns" | "wishlist" | "addresses" | "details";

interface Props {
  activeTab: AccountTab | null;
  customer: Customer;
  orders: Order[] | null;
  totalOrders: number | null;
  wishlistCount: number;
  addressCount: number | null;
}

export default function AccountHeader({ activeTab, customer, orders, totalOrders, wishlistCount, addressCount }: Props) {
  const href = useHref();
  const navigationRef = useRef<HTMLElement>(null);
  const inProgress = (orders ?? []).filter((order) => ["PROCESSING", "PACKED", "SHIPPED"].includes(order.status));
  const firstName = customer.firstName || "Welcome";
  const tabs = [
    { tab: "overview", label: "Account overview", Icon: UserRound },
    { tab: "orders", label: "Orders & deliveries", Icon: Truck },
    { tab: "returns", label: "Returns", Icon: RotateCcw },
    { tab: "wishlist", label: "Saved products", Icon: Heart },
    { tab: "addresses", label: "Delivery addresses", Icon: MapPin },
    { tab: "details", label: "Account details", Icon: Settings },
  ] as const;

  useEffect(() => {
    const navigation = navigationRef.current;
    const selected = navigation?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!navigation || !selected || navigation.scrollWidth <= navigation.clientWidth) return;
    const container = navigation.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    if (item.left < container.left || item.right > container.right) {
      navigation.scrollLeft += item.left - container.left - (container.width - item.width) / 2;
    }
  }, [activeTab, wishlistCount, addressCount]);

  return <div className={styles.page}>
    <div className={`wrap ${styles.identity}`}>
      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden="true">{customer.firstName?.[0]}{customer.lastName?.[0]}</div>
        <div>
          <div className={styles.nameLine}><h1>{firstName} {customer.lastName}</h1><span className={styles.member}>Customer account</span></div>
          <p>{customer.email}</p>
          <span className={styles.verified}>{customer.emailVerified ? <><CheckCircle2 size={13} />Email verified</> : <><UserRound size={13} />Your personal shopping hub</>}</span>
        </div>
      </div>
      <div className={styles.identitySummary}>
        <div><span>Orders on your account</span><strong>{totalOrders ?? "—"}</strong><Link href={href.account({ tab: "orders" })}>View order history <ChevronRight size={12} /></Link></div>
        <Link className={styles.shipmentSummary} href={href.account({ tab: "orders" })}><Truck size={23} /><span>Recent active orders<strong>{orders ? inProgress.length : "—"} {inProgress.length === 1 ? "order" : "orders"}</strong></span></Link>
        <button className={styles.signout} type="button" onClick={() => void logout().then(() => { window.location.href = href.home(); })}><LogOut size={15} />Sign out</button>
      </div>
    </div>
    <div className="wrap"><nav ref={navigationRef} className={styles.tabs} aria-label="Account navigation">
      {tabs.map(({ tab, label, Icon }) => <Link href={href.account({ tab })} key={tab} aria-current={activeTab !== null && tab === activeTab ? "page" : undefined}>
        <Icon size={15} />{label}{tab === "wishlist" && wishlistCount > 0 && <span>{wishlistCount}</span>}{tab === "addresses" && !!addressCount && <span>{addressCount}</span>}
      </Link>)}
    </nav></div>
  </div>;
}