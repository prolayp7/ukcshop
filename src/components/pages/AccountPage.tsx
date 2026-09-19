"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { DesignParts } from "@/lib/parts";
import { useWishlist } from "@/lib/basket";
import { useCustomerAuth } from "@/lib/storefront-client";
import { Address, Order, listAddresses, listOrders } from "@/lib/account-api";
import { useApi } from "@/lib/use-api";
import { Product } from "@/lib/types";
import { useHref } from "@/lib/design-context";
import AccountOverview from "./AccountOverview";
import { OrdersTab, WishlistTab, AddressesTab, DetailsTab } from "./AccountTabs";

const TABS = ["overview", "orders", "wishlist", "addresses", "details"] as const;
type Tab = (typeof TABS)[number];

const subscribeToMount = () => () => {};
const clientMounted = () => true;
const serverMounted = () => false;

export default function AccountPage({ parts }: { parts: DesignParts }) {
  const { Header, Footer, Crumbs } = parts;
  const href = useHref();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(raw || "") ? (raw as Tab) : "overview";
  const { customer, isLoggedIn } = useCustomerAuth();
  const { items: wishlist } = useWishlist();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [addressesError, setAddressesError] = useState(false);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const recRes = useApi<{ items: Product[] }>("/api/products/recommended?limit=4");
  const rec = recRes.data?.items ?? [];

  // isLoggedIn's first client render always matches the server snapshot
  // (false, since there's no localStorage on the server) even for a
  // logged-in visitor - only redirect once a render has happened *after*
  // mount, by which point useSyncExternalStore has corrected to the real
  // client value.
  const mounted = useSyncExternalStore(subscribeToMount, clientMounted, serverMounted);
  useEffect(() => {
    // A hard navigation, not router.replace: this guard fires right after
    // sign-out, and a full reload guarantees every other bit of client
    // state (cart cache, wishlist cache, etc.) resets along with it.
    if (mounted && isLoggedIn === false) window.location.href = href.login({ next: href.account({ tab }) });
  }, [mounted, isLoggedIn, href, tab]);

  useEffect(() => {
    // Fetched eagerly (not gated on the Orders tab) so the Overview stats
    // and active-dispatch card have real numbers as soon as the page loads.
    if (!isLoggedIn || orders || ordersError) return;
    listOrders()
      .then((r) => { setOrders(r.items); setTotalOrders(r.meta.total); })
      .catch(() => setOrdersError(true));
  }, [isLoggedIn, orders, ordersError]);
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!addresses && !addressesError) listAddresses().then(setAddresses).catch(() => setAddressesError(true));
  }, [isLoggedIn, addresses, addressesError]);

  async function loadMoreOrders() {
    if (loadingMore) return;
    setLoadingMore(true);
    setMoreError("");
    try {
      const result = await listOrders(ordersPage + 1);
      setOrders(previous => {
        const existing = new Set((previous ?? []).map(order => order.uuid));
        return [...(previous ?? []), ...result.items.filter(order => !existing.has(order.uuid))];
      });
      setOrdersPage(result.meta.page);
      setTotalOrders(result.meta.total);
    } catch {
      setMoreError("We couldn’t load more orders. Please try again.");
    } finally { setLoadingMore(false); }
  }

  if (!isLoggedIn || !customer) return null;
  const labels = { overview: "Account overview", orders: "Orders & deliveries", wishlist: "Saved products", addresses: "Delivery addresses", details: "Account details" };
  return <>
    <Header />
    <Crumbs items={[{ label: "Home", href: href.home() }, { label: "My account", href: href.account() }, { label: labels[tab] }]} />
    <AccountOverview activeTab={tab} customer={customer} orders={orders} totalOrders={totalOrders} ordersError={ordersError} onRetry={() => setOrdersError(false)} addresses={addresses} addressesError={addressesError} wishlist={wishlist} products={rec} productsLoading={recRes.loading} productsError={recRes.error}>
      {tab === "orders" ? <OrdersTab orders={orders} total={totalOrders} error={ordersError} onRetry={() => setOrdersError(false)} onLoadMore={loadMoreOrders} loadingMore={loadingMore} moreError={moreError} /> :
        tab === "wishlist" ? <WishlistTab items={wishlist} /> :
        tab === "addresses" ? <AddressesTab addresses={addresses} error={addressesError} onRetry={() => setAddressesError(false)} onChange={setAddresses} /> :
        tab === "details" ? <DetailsTab customer={customer} /> : undefined}
    </AccountOverview>
    <Footer />
  </>;
}
