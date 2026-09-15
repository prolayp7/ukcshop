"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, CheckCircle2, CreditCard, Heart, Minus, Package, Plus, RotateCcw, ShieldCheck, ShoppingCart, Star, Truck, X, ZoomIn, Zap } from "lucide-react";
import type { ApiProductBase } from "@/lib/api";
import type { Product } from "@/lib/types";
import { money, exVat } from "@/lib/catalogue";
import { plainText } from "@/lib/category";
import { Cart } from "@/lib/cart";
import { useCompare } from "@/lib/basket";
import { useHref } from "@/lib/design-context";
import { useCartDrawer } from "@/components/CartDrawer";
import { useApi } from "@/lib/use-api";
import ProductSpecialOffer from "./ProductSpecialOffer";
import { WishlistButton } from "@/components/interactive";

function specValue(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join(", ") : value == null ? "" : String(value);
}
const specLabel = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2");

export default function ProductPurchasePanel({ product, api, onReviews }: { product: Product; api: ApiProductBase; onReviews: () => void }) {
  const href = useHref();
  const offers = useApi<{ items: Product[] }>("/api/products?onSale=true&inStock=true&perPage=8");
  const candidates = offers.data?.items.filter((item) => item.id !== product.id && item.was !== null && item.was > item.price && item.defaultVariantId !== null) ?? [];
  const offer = candidates.find((item) => item.image) ?? candidates[0];
  const router = useRouter();
  const openCart = useCartDrawer();
  const compare = useCompare();
  const [variantId, setVariantId] = useState(product.defaultVariantId);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(api.minimumOrderQuantity || 1);
  const [busy, setBusy] = useState<"basket" | "checkout" | null>(null);
  const [error, setError] = useState("");
  const zoom = useRef<HTMLDialogElement>(null);
  const [magnify, setMagnify] = useState<{ x: number; y: number } | null>(null);
  const variants = api.variants ?? [];
  const variant = variants.find((item) => item.id === variantId) ?? variants[0];
  const price = variant ? Number(variant.salePrice ?? variant.price) : product.price;
  const regularPrice = variant ? Number(variant.price) : product.was ?? product.price;
  const stock = variant?.stockQty ?? 0;
  const minimum = api.minimumOrderQuantity || 1;
  const maximum = stock;
  const canBuy = !!variant && maximum >= minimum && !busy;
  const selectedProduct: Product = { ...product, defaultVariantId: variant?.id ?? null, price, was: regularPrice > price ? regularPrice : null, stock, stockStatus: stock <= 0 ? "out" : stock <= 5 ? "low" : "in" };
  const images = [...(variant?.images ?? []), ...(api.images ?? [])].filter((image, index, all) => all.findIndex((item) => item.url === image.url) === index);
  const activeImage = images[imageIndex] ?? images[0];
  const specs = api.specsSummary ?? {};
  const features = Array.isArray(specs.keyFeatures) ? specs.keyFeatures.map(String) : [];
  const summarySpecs = Object.entries(specs).filter(([key, value]) => !["brand", "category", "keyFeatures", "availableConfigurations", "catalogueType"].includes(key) && (typeof value === "string" || typeof value === "number")).slice(0, 4);
  const delivery = stock > 0 ? api.inStockDeliveryTime : api.outOfStockDeliveryTime;
  const warranty = api.warrantyMonths ? `${api.warrantyMonths}-month warranty` : specValue(specs.warranty || specs.Warranty);

  function selectVariant(id: number) {
    setVariantId(id);
    setImageIndex(0);
    setQuantity(minimum);
    setError("");
  }

  async function purchase(destination: "basket" | "checkout") {
    if (!canBuy || !variant) return;
    setBusy(destination);
    setError("");
    try {
      await Cart.add(variant.id, quantity);
      if (destination === "checkout") router.push(href.checkout());
      else openCart();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not add this product. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return <div className={`product-detail-layout${offer || offers.loading ? " has-special-offer" : ""}`}>
    <div className="product-sticky-column">
    <div className="product-media-column">
      <div className="product-gallery">
        <div className="product-thumbnails" aria-label="Product images">
          {images.length ? images.map((image, index) => <button key={image.url} className={index === imageIndex ? "is-selected" : ""} aria-label={`View image ${index + 1} of ${product.name}`} aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.altText || ""} width={68} height={68} />
          </button>) : <div className="product-empty-thumbnail"><Package size={25} /></div>}
        </div>
        <div className="product-image-panel">
          <div className="product-image-heading"><div><span className="product-type-badge">{specValue(specs.productType) || product.subcategory}</span>{stock > 0 ? <span className="product-stock-badge"><CheckCircle2 size={11} /> In stock</span> : null}</div>{product.mpn ? <span className="product-image-model">MPN: {product.mpn}</span> : null}</div>
          {activeImage ? <button
            className="product-main-image"
            onClick={() => zoom.current?.showModal()}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setMagnify({
                x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
                y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
              });
            }}
            onMouseLeave={() => setMagnify(null)}
            aria-label="Zoom product image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage.url} alt={activeImage.altText || product.name} width={720} height={600} fetchPriority="high" />
            <span className="product-zoom-hint"><ZoomIn size={15} /> Click to zoom</span>
            {magnify ? (
              <div
                className="product-magnify-panel"
                aria-hidden="true"
                style={{ backgroundImage: `url(${activeImage.url})`, backgroundPosition: `${magnify.x}% ${magnify.y}%` }}
              />
            ) : null}
          </button> : <div className="product-image-empty"><Package size={70} strokeWidth={1} /><span>Product image unavailable</span></div>}
          <div className="product-gallery-caption">{features.length ? <div className="product-feature-tags">{features.slice(0, 3).map((feature) => <span key={feature}><CheckCircle2 size={12} />{feature}</span>)}</div> : null}<span>Model: {specValue(specs.model) || product.mpn || product.name}</span></div>
        </div>
      </div>
      {summarySpecs.length ? <dl className="product-highlight-grid">{summarySpecs.map(([key, value]) => <div key={key}><dt>{specLabel(key)}</dt><dd>{key === "configuration" && variant ? variant.title : specValue(value)}</dd></div>)}</dl> : null}
    </div>

    {offer ? <ProductSpecialOffer key={offer.id} product={offer} /> : offers.loading ? <aside className="offer product-special-offer product-offer-loading" aria-label="Loading special offer"><div className="offer-head"><b>Special offer</b></div><div className="offer-body"><div className="skeleton-block" style={{ height: 180 }} /><p role="status">Loading offer…</p></div></aside> : null}
    </div>

    <aside className="product-purchase-panel" aria-label="Product details and purchase">
      <div className="product-brand-row">{product.brandSlug ? <Link href={href.brand(product.brandSlug)} className="product-brand-badge">{product.brand}</Link> : <span className="product-brand-badge">{product.brand}</span>}<span>{product.subcategory}</span>{product.sku ? <small>SKU: {product.sku}</small> : null}</div>
      <h1>{product.name}</h1>
      {api.shortDescription ? <p className="product-intro">{plainText(api.shortDescription)}</p> : null}
      <button className="product-review-link" onClick={onReviews} aria-label={`Read ${product.reviews} product reviews`}><span className="product-stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < Math.round(product.rating) ? "currentColor" : "none"} />)}</span>{product.reviews ? <b>{product.rating.toFixed(1)}</b> : null}<span>{product.reviews ? `${product.reviews} reviews` : "Be the first to review"}</span></button>

      <div className="product-price-panel">
        <div className="product-price-heading"><strong>{money(price)}</strong><span>inc. VAT</span>{regularPrice > price ? <div className="product-saving"><s>{money(regularPrice)}</s><b>Save {money(regularPrice - price)} ({Math.round((regularPrice - price) / regularPrice * 100)}%)</b></div> : null}</div>
        <div className="product-net-price"><span>Price excluding VAT</span><strong>{exVat(price)} <small>ex. VAT</small></strong></div>
        <p className="product-payment-note"><CreditCard size={13} /> Payment options available at checkout</p>
      </div>

      {variants.length ? <fieldset className="product-configuration"><legend>Configuration <span>{variants.length} option{variants.length === 1 ? "" : "s"}</span></legend><div className="product-variant-grid">{variants.map((item) => <label key={item.id} className={variant?.id === item.id ? "is-selected" : ""}>
        <input type="radio" name="product-configuration" value={item.id} checked={variant?.id === item.id} onChange={() => selectVariant(item.id)} disabled={!!busy} />
        {item.isDefault ? <span className="product-variant-default">Default option</span> : null}<strong>{item.title}</strong><span>{money(Number(item.salePrice ?? item.price))} inc.</span><small className={item.stockQty > 0 ? "in-stock" : "out-of-stock"}>{item.stockQty > 0 ? "In Stock" : "Out of stock"}</small>
      </label>)}</div></fieldset> : null}

      <ul className="product-fulfilment">
        <li className={stock > 0 ? "in-stock" : "out-of-stock"}><CheckCircle2 size={14} /><span>{stock > 0 ? `In Stock: ${stock} available` : api.outOfStockLabel || "Out of stock"}</span></li>
        {delivery ? <li><Truck size={14} /><span>{stock > 0 ? "Delivery" : "Availability"}: {delivery}</span></li> : null}
        {warranty ? <li><ShieldCheck size={14} /><span>{warranty}</span></li> : null}
      </ul>

      <div className="product-buy-row"><div className="product-quantity"><button aria-label="Decrease quantity" disabled={quantity <= minimum || !!busy} onClick={() => setQuantity(quantity - 1)}><Minus size={13} /></button><input aria-label="Quantity" type="number" min={minimum} max={Math.max(minimum, maximum)} value={quantity} disabled={!!busy} onChange={(event) => setQuantity(Math.max(minimum, Math.min(Math.max(minimum, maximum), Math.trunc(Number(event.target.value)) || minimum)))} /><button aria-label="Increase quantity" disabled={quantity >= maximum || !!busy} onClick={() => setQuantity(quantity + 1)}><Plus size={13} /></button></div>
        <button className="product-add-button" disabled={!canBuy} onClick={() => void purchase("basket")}><ShoppingCart size={16} />{busy === "basket" ? "Adding…" : maximum < minimum ? "Out of stock" : `Add to Basket · ${money(price * quantity)}`}</button></div>
      <button className="product-checkout-button" disabled={!canBuy} onClick={() => void purchase("checkout")}><Zap size={14} />{busy === "checkout" ? "Opening checkout…" : "Buy now — secure checkout"}</button>
      {error ? <p className="product-purchase-error" role="alert">{error}</p> : null}
      <div className="product-secondary-actions"><WishlistButton product={selectedProduct}><Heart size={13} /> Save to wishlist</WishlistButton><button aria-pressed={compare.has(product.id)} onClick={() => compare.toggle(selectedProduct)}><ArrowLeftRight size={13} />{compare.has(product.id) ? "Remove comparison" : "Compare"}</button></div>
      <div className="product-policy-row">
        {api.isReturnable && api.returnableDays ? <div><RotateCcw size={17} /><span>{api.returnableDays}-day returns</span></div> : null}
        {warranty ? <div><ShieldCheck size={17} /><span>{warranty}</span></div> : null}
        {delivery ? <div><Truck size={17} /><span>{delivery}</span></div> : null}
      </div>
    </aside>



    <dialog ref={zoom} className="product-zoom-dialog" onClick={(event) => { if (event.target === event.currentTarget) zoom.current?.close(); }} aria-label={`${product.name} enlarged image`}><button onClick={() => zoom.current?.close()} aria-label="Close enlarged image"><X size={22} /></button>{activeImage ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={activeImage.url} alt={activeImage.altText || product.name} />
    ) : null}</dialog>
  </div>;
}
