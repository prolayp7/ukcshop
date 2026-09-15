"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Heart, ArrowLeftRight, Minus, Plus, Package, ShieldCheck, ShoppingBag, Star, Truck, X, Zap, ZoomIn } from "lucide-react";
import { money, exVat } from "@/lib/catalogue";
import { useApi } from "@/lib/use-api";
import type { Product } from "@/lib/types";
import type { ApiProductBase } from "@/lib/api";
import { WishlistButton, CompareButton } from "@/components/interactive";
import { useWishlist, useCompare } from "@/lib/basket";
import { Cart } from "@/lib/cart";
import { useHref } from "@/lib/design-context";
import { useQuickViewId, closeQuickView } from "@/lib/quickview";
import "./quick-view.css";

export default function QuickView() {
  const id = useQuickViewId();
  return id === null ? null : <QuickViewDialog key={id} id={id} />;
}

function QuickViewDialog({ id }: { id: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useApi<{ items: Product[] }>(`/api/products?ids=${id}`);
  const product = list.data?.items.find((item) => item.id === id);
  const detail = useApi<{ product: Product; api: ApiProductBase }>(product ? `/api/products/${encodeURIComponent(product.slug)}` : null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const failed = list.error || detail.error || (!list.loading && !product);
  return <dialog ref={dialog} className="quick-view" aria-label="Product quick view" onCancel={closeQuickView} onClick={(event) => { if (event.target === event.currentTarget) closeQuickView(); }}>
    <div className="quick-view-shell">
      <button className="quick-view-close" onClick={closeQuickView} aria-label="Close quick view" autoFocus><X size={18} /></button>
      {detail.data ? <QuickViewProduct product={detail.data.product} api={detail.data.api} /> : <div className="quick-view-status" role={failed ? "alert" : "status"}><Package size={36} /><h2>{failed ? "Unable to load this product" : "Loading product…"}</h2>{failed ? <><p>Please close Quick View and try again.</p><button onClick={closeQuickView}>Close quick view</button></> : null}</div>}
    </div>
  </dialog>;
}

function QuickViewProduct({ product, api }: { product: Product; api: ApiProductBase }) {
  const href = useHref();
  const router = useRouter();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [variantId, setVariantId] = useState(product.defaultVariantId);
  const [imageIndex, setImageIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const minimum = api.minimumOrderQuantity || 1;
  const [quantity, setQuantity] = useState(minimum);
  const [busy, setBusy] = useState<"basket" | "checkout" | null>(null);
  const [error, setError] = useState("");
  const variants = api.variants ?? [];
  const variant = variants.find((item) => item.id === variantId) ?? variants[0];
  const price = variant ? Number(variant.salePrice ?? variant.price) : product.price;
  const regular = variant ? Number(variant.price) : product.was ?? price;
  const stock = variant?.stockQty ?? 0;
  const canBuy = !!variant && stock >= minimum && !busy;
  const images = [...(variant?.images ?? []), ...(api.images ?? []), ...(product.image ? [{ url: product.image, altText: product.name }] : [])].filter((image, index, all) => all.findIndex((item) => item.url === image.url) === index);
  const activeImage = images[imageIndex] ?? images[0];
  const specs = Object.entries(product.specs).slice(0, api.warrantyMonths ? 3 : 4);
  const selectedProduct: Product = { ...product, defaultVariantId: variant?.id ?? null, price, was: regular > price ? regular : null, stock, stockStatus: stock <= 0 ? "out" : stock <= 5 ? "low" : "in" };
  const delivery = stock > 0 ? api.inStockDeliveryTime : api.outOfStockDeliveryTime;

  async function purchase(destination: "basket" | "checkout") {
    if (!canBuy || !variant) return;
    setBusy(destination);
    setError("");
    try {
      await Cart.add(variant.id, quantity);
      closeQuickView();
      if (destination === "checkout") router.push(href.checkout());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not add this product. Please try again.");
      setBusy(null);
    }
  }

  return <div className="quick-view-grid">
    <section className="quick-view-media" aria-label="Product gallery">
      <div className="quick-view-toolbar"><div className="quick-view-badges">{product.brand ? <span>{product.brand}</span> : null}{regular > price ? <span className="quick-view-sale">On sale</span> : product.isNew ? <span className="quick-view-sale">New arrival</span> : null}</div>{activeImage ? <button onClick={() => setZoomed(!zoomed)} aria-pressed={zoomed}><ZoomIn size={13} />{zoomed ? "Zoom out" : "Zoom"}</button> : null}</div>
      <div className="quick-view-gallery">
        {images.length > 1 ? <div className="quick-view-thumbnails">{images.map((image, index) => <button key={image.url} aria-label={`View image ${index + 1}`} aria-pressed={index === imageIndex} onClick={() => { setImageIndex(index); setZoomed(false); }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" width={48} height={48} />
        </button>)}</div> : null}
        <button className={`quick-view-image${zoomed ? " is-zoomed" : ""}`} disabled={!activeImage} onClick={() => setZoomed(!zoomed)} aria-label={zoomed ? "Zoom out" : "Zoom product image"} aria-pressed={zoomed} onMouseMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--zoom-x", `${(event.clientX - bounds.left) / bounds.width * 100}%`); event.currentTarget.style.setProperty("--zoom-y", `${(event.clientY - bounds.top) / bounds.height * 100}%`); }}>
          {activeImage ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage.url} alt={activeImage.altText || product.name} width={600} height={600} /><span><ZoomIn size={12} />{zoomed ? "Click to zoom out" : "Click to examine"}</span>
          </> : <div><Package size={60} /><p>Product image unavailable</p></div>}
        </button>
      </div>
      <dl className="quick-view-specs">{specs.map(([key, value]) => <div key={key}><dt>{key.replace(/([a-z])([A-Z])/g, "$1 $2")}</dt><dd>{value}</dd></div>)}{api.warrantyMonths ? <div><dt>Guarantee</dt><dd className="quick-view-green">{api.warrantyMonths}-month warranty</dd></div> : null}</dl>
    </section>
    <section className="quick-view-info" aria-label="Product information">
      <div className="quick-view-meta"><span>{[product.brand, product.subcategory].filter(Boolean).join(" · ")}</span>{product.sku ? <small>SKU: {product.sku}</small> : null}</div>
      <h2>{product.name}</h2>
      <a className="quick-view-reviews" href={href.product(product.slug)} onClick={closeQuickView}><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < Math.round(product.rating) ? "currentColor" : "none"} />)}</span>{product.reviews ? <><b>{product.rating.toFixed(1)}</b><u>{product.reviews.toLocaleString("en-GB")} reviews</u></> : "No reviews yet"}</a>
      <div className="quick-view-pricing"><div><strong>{money(price)}</strong><small>Inc. VAT</small><small>({exVat(price)} ex. VAT)</small></div>{regular > price ? <p>Was <s>{money(regular)}</s> · Save {money(regular - price)}<b>Save {Math.round((regular - price) / regular * 100)}%</b></p> : null}</div>
      <div className="quick-view-options">{variants.length ? <fieldset><legend>Choose your configuration</legend><div>{variants.map((item) => <label key={item.id} className={variant?.id === item.id ? "is-selected" : ""}><input type="radio" name="quick-view-variant" checked={variant?.id === item.id} disabled={!!busy} onChange={() => { setVariantId(item.id); setImageIndex(0); setZoomed(false); setQuantity(minimum); setError(""); }} /><strong>{item.title}</strong><b>{money(Number(item.salePrice ?? item.price))}</b><small>{item.stockQty > 0 ? "In stock" : "Out of stock"}</small></label>)}</div></fieldset> : null}{product.mpn ? <p>Model: <b>{product.mpn}</b></p> : null}</div>
      <div className="quick-view-availability"><p className={stock > 0 ? "quick-view-green" : ""}><CheckCircle2 size={13} /><b>{stock > 0 ? `In stock online — ${stock} available` : api.outOfStockLabel || "Out of stock"}</b></p>{delivery ? <p><Truck size={14} /><span><b>Delivery:</b> {delivery}</span></p> : null}{api.warrantyMonths ? <p><ShieldCheck size={14} />{api.warrantyMonths}-month warranty</p> : null}</div>
      <div className="quick-view-purchase"><div className="quick-view-buyrow"><div className="quick-view-quantity"><button aria-label="Decrease quantity" disabled={quantity <= minimum || !!busy} onClick={() => setQuantity(quantity - 1)}><Minus size={14} /></button><input aria-label="Quantity" type="number" min={minimum} max={Math.max(minimum, stock)} value={quantity} disabled={!canBuy} onChange={(event) => setQuantity(Math.max(minimum, Math.min(stock, Math.trunc(Number(event.target.value)) || minimum)))} /><button aria-label="Increase quantity" disabled={quantity >= stock || !!busy} onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></button></div><button className="quick-view-add" disabled={!canBuy} onClick={() => void purchase("basket")}><ShoppingBag size={17} />{busy === "basket" ? "Adding…" : stock < minimum ? "Out of stock" : `Add to cart — ${money(price * quantity)}`}</button></div>
        <button className="quick-view-buy-now" disabled={!canBuy} onClick={() => void purchase("checkout")}><Zap size={14} />{busy === "checkout" ? "Opening checkout…" : "Buy now"}</button>
        {error ? <p className="quick-view-error" role="alert">{error}</p> : null}
        <div className="quick-view-actions"><WishlistButton product={selectedProduct}><Heart size={13} />{wishlist.has(product.id) ? "Saved" : "Wishlist"}</WishlistButton><CompareButton product={selectedProduct}><ArrowLeftRight size={13} />{compare.has(product.id) ? "Comparing" : "Compare"}</CompareButton><a href={href.product(product.slug)} onClick={closeQuickView}>View full product details <ArrowRight size={13} /></a></div>
      </div>
    </section>
  </div>;
}
