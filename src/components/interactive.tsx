"use client";

import { ButtonHTMLAttributes, useState } from "react";
import { Product } from "@/lib/types";
import { Cart } from "@/lib/cart";
import { useWishlist, useCompare } from "@/lib/basket";
import { useCartDrawer } from "@/components/CartDrawer";
import { useHref } from "@/lib/design-context";
import { useRouter } from "next/navigation";

type BaseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "id">;

interface AddToBasketProps extends BaseButtonProps {
  product: Product;
  qty?: number;
  /** Ref to a qty <input>, mirroring the static site's data-qty="input" pattern. */
  qtyInputRef?: React.RefObject<HTMLInputElement | null>;
}
/** Renders as a <button> styled by the caller's className — the static
 * markup used <a data-add>, but a real click handler belongs on a button;
 * visual parity comes entirely from the design's own CSS classes, which
 * don't care about tag name. */
export function AddToBasketButton({ product, qty, qtyInputRef, children, disabled, ...rest }: AddToBasketProps) {
  const openCartDrawer = useCartDrawer();
  const variantId = product.defaultVariantId;
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || variantId === null}
      onClick={() => {
        if (variantId === null) return;
        const n = qtyInputRef?.current ? Number(qtyInputRef.current.value) || 1 : qty || 1;
        void Cart.add(variantId, n);
        openCartDrawer();
      }}
    >
      {children}
    </button>
  );
}

export function WishlistButton({ product, children, ...rest }: { product: Product; children?: React.ReactNode } & BaseButtonProps) {
  const { has, toggle, isLoggedIn } = useWishlist();
  const href = useHref();
  const router = useRouter();
  const on = has(product.id);
  return (
    <button
      type="button"
      {...rest}
      className={[rest.className, on ? "on" : ""].filter(Boolean).join(" ")}
      onClick={() => {
        if (!isLoggedIn) {
          router.push(href.login());
          return;
        }
        if (product.defaultVariantId !== null) void toggle(product.id, product.defaultVariantId);
      }}
    >
      {children}
    </button>
  );
}

export function CompareButton({ product, children, ...rest }: { product: Product; children?: React.ReactNode } & BaseButtonProps) {
  const { has, toggle } = useCompare();
  const on = has(product.id);
  return (
    <button type="button" {...rest} className={[rest.className, on ? "on" : ""].filter(Boolean).join(" ")} onClick={() => toggle(product)}>
      {children}
    </button>
  );
}

/** The −/qty/+ stepper used on product pages and the basket. Exposes its
 * input's ref so a sibling AddToBasketButton can read the live quantity. */
export function QtyStepper({ inputRef, initial = 1 }: { inputRef: React.RefObject<HTMLInputElement | null>; initial?: number }) {
  const [, setTick] = useState(0);
  const step = (delta: number) => {
    const el = inputRef.current;
    if (!el) return;
    const v = Math.max(1, Math.min(99, (Number(el.value) || 1) + delta));
    el.value = String(v);
    setTick((n) => n + 1);
  };
  return (
    <div className="qty">
      <button type="button" onClick={() => step(-1)}>
        −
      </button>
      <input ref={inputRef} defaultValue={initial} readOnly />
      <button type="button" onClick={() => step(1)}>
        +
      </button>
    </div>
  );
}
