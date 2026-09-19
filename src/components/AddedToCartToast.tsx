"use client";

import Link from "next/link";
import { Check, Package, X } from "lucide-react";
import { toast } from "sonner";
import type { CartLine } from "@/lib/cart";
import type { ApiProductBase } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useHref } from "@/lib/design-context";
import { money } from "@/lib/catalogue";
import { theme } from "@/lib/theme.config";
import { closeQuickView } from "@/lib/quickview";

function AddedToCartToast({ id, line, quantity, subtotal }: { id: string | number; line: CartLine; quantity: number; subtotal: number }) {
  const href = useHref();
  const details = useApi<{ api: ApiProductBase; image: string | null }>(`/api/products/${encodeURIComponent(line.variant.product.slug)}`);
  const variant = details.data?.api.variants?.find((item) => item.id === line.productVariantId);
  const image = variant?.images?.[0]?.url || details.data?.image;
  const dismiss = () => toast.dismiss(id);
  const navigate = () => { dismiss(); closeQuickView(); };
  return <div className="added-cart-toast">
    <div className="added-cart-heading"><span><Check size={13} /></span><strong>Added to your basket</strong><button onClick={dismiss} aria-label="Dismiss notification"><X size={14} /></button></div>
    <div className="added-cart-product">
      <div className="added-cart-image">{image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={line.variant.product.title} width={56} height={56} />
      ) : <Package size={24} aria-label="Product image unavailable" />}</div>
      <div className="added-cart-details"><b>{line.variant.product.title}</b><span>{line.variant.title}</span><div className="added-cart-price"><strong>{quantity} × {money(line.unitPrice)}</strong>{subtotal >= theme.features.freeDeliveryThresholdGbp ? <small>Free Delivery</small> : null}</div></div>
    </div>
    <div className="added-cart-actions"><Link href={href.basket()} onClick={navigate}>View Basket</Link><Link href={href.checkout()} onClick={navigate}>Checkout →</Link></div>
  </div>;
}

export function showAddedToCart(line: CartLine, quantity: number, subtotal: number) {
  toast.custom((id) => <AddedToCartToast key={line.productVariantId} id={id} line={line} quantity={quantity} subtotal={subtotal} />, { id: "added-to-cart", duration: 7000, className: "added-cart-container" });
}
