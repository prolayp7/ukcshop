"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Cart, useCart, CartLine } from "@/lib/cart";
import { money } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import { theme } from "@/lib/theme.config";
import { Icon, ProductVisual } from "@/components/Icon";

const CartDrawerContext = createContext<(() => void) | null>(null);

export function useCartDrawer() {
  const openDrawer = useContext(CartDrawerContext);
  if (!openDrawer) throw new Error("useCartDrawer() called outside CartDrawerProvider");
  return openDrawer;
}

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const openDrawer = useCallback(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);
  const closeDrawer = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDrawer, open]);

  return (
    <CartDrawerContext.Provider value={openDrawer}>
      {children}
      <CartDrawer open={open} onClose={closeDrawer} closeButtonRef={closeButtonRef} />
    </CartDrawerContext.Provider>
  );
}

export function CartTrigger({ className, title, ariaLabel, children }: { className?: string; title?: string; ariaLabel?: string; children: React.ReactNode }) {
  const openDrawer = useCartDrawer();
  const href = useHref();
  return (
    <a className={className} href={href.basket()} title={title} aria-label={ariaLabel} aria-haspopup="dialog" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openDrawer();
    }}>
      {children}
    </a>
  );
}

function CartDrawer({ open, onClose, closeButtonRef }: {
  open: boolean;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { cart } = useCart();
  const href = useHref();
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponResult, setCouponResult] = useState<{ code: string; discountAmount: number; freeShipping: boolean } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const couponInputRef = useRef<HTMLInputElement>(null);

  const lines = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const freeThreshold = theme.features.freeDeliveryThresholdGbp;
  const toFreeDelivery = Math.max(0, freeThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeThreshold) * 100);

  const closeCoupon = useCallback(() => {
    setCouponOpen(false);
    setCouponError("");
  }, []);
  const closeAll = useCallback(() => {
    closeCoupon();
    onClose();
  }, [closeCoupon, onClose]);

  useEffect(() => {
    if (!couponOpen) return;
    const timer = window.setTimeout(() => couponInputRef.current?.focus(), 0);
    const onCouponKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCoupon();
    };
    window.addEventListener("keydown", onCouponKeyDown, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onCouponKeyDown, true);
    };
  }, [closeCoupon, couponOpen]);

  const applyCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponError("Enter a coupon code to continue.");
      couponInputRef.current?.focus();
      return;
    }
    setCouponBusy(true);
    setCouponError("");
    try {
      const result = await Cart.validateCoupon(normalizedCode);
      setCouponResult({ code: result.code, discountAmount: result.discountAmount, freeShipping: result.freeShipping });
      setCouponOpen(false);
    } catch {
      setCouponError("That code isn't valid for your basket.");
      couponInputRef.current?.focus();
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <div className={`cart-layer${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button className="cart-backdrop" type="button" onClick={closeAll} tabIndex={open ? 0 : -1} aria-label="Close cart" />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-head">
          <div className="cart-title"><Icon id="i-bag" w={21} /><h2 id="cart-title">Your cart</h2></div>
          <button ref={closeButtonRef} className="cart-close" type="button" onClick={closeAll} aria-label="Close cart"><Icon id="i-x" w={18} /></button>
        </div>
        <div className="cart-alert"><Icon id="i-clock" w={16} /><span>Limited items can sell quickly. Checkout while they’re yours.</span></div>
        <div className="cart-scroll">
          {lines.length ? (
            <div className="cart-lines">
              {lines.map((line) => (
                <CartLineRow key={line.productVariantId} line={line} href={href} onClose={onClose} />
              ))}
            </div>
          ) : (
            <div className="cart-empty"><Icon id="i-bag" w={32} /><h3>Your cart is empty</h3><p>Add something you love and it’ll appear here.</p><button type="button" onClick={onClose}>Continue shopping</button></div>
          )}
        </div>
        <div className="cart-foot">
          <div className="cart-tools" aria-label="Cart options">
            <button type="button" onClick={() => setCouponOpen(true)} aria-expanded={couponOpen} aria-controls="cart-coupon-sheet"><Icon id="i-card" w={17} /> Coupon</button>
          </div>
          <div className="cart-totals">
            <div><span>Subtotal ({count} item{count === 1 ? "" : "s"})</span><b>{money(subtotal)}</b></div>
            {couponResult ? (
              <div><span>Coupon {couponResult.code}</span><b>{couponResult.freeShipping ? "Free shipping" : `−${money(couponResult.discountAmount)}`}</b></div>
            ) : null}
            <div className="cart-total"><strong>Total</strong><b>{money(Math.max(0, subtotal - (couponResult?.discountAmount ?? 0)))}</b></div>
          </div>
          <p className="cart-shipping">{toFreeDelivery > 0 ? `Add ${money(toFreeDelivery)} more for free delivery` : "Your order qualifies for free delivery!"}</p>
          <div className="cart-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
          <Link className={`cart-checkout${count ? "" : " is-disabled"}`} href={count ? href.checkout() : href.basket()} onClick={onClose}>Checkout</Link>
          <Link className="cart-view" href={href.basket()} onClick={onClose}><Icon id="i-edit" w={15} /> View Cart</Link>
        </div>
        {couponResult ? <div className="cart-coupon-saved" role="status">Coupon <b>{couponResult.code}</b> applied.</div> : null}
        <div className={`cart-coupon-stage${couponOpen ? " is-open" : ""}`} aria-hidden={!couponOpen}>
          <button className="cart-coupon-veil" type="button" onClick={closeCoupon} tabIndex={couponOpen ? 0 : -1} aria-label="Close coupon form" />
          <section id="cart-coupon-sheet" className="cart-coupon-sheet" role="dialog" aria-modal="true" aria-labelledby="cart-coupon-title">
            <h3 id="cart-coupon-title"><Icon id="i-card" w={20} /> Select or input Coupon</h3>
            <form onSubmit={applyCoupon} noValidate>
              <label className="cart-coupon-label" htmlFor="cart-coupon-code">Coupon code</label>
              <input
                ref={couponInputRef}
                id="cart-coupon-code"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  if (couponError) setCouponError("");
                }}
                placeholder="Coupon code"
                autoComplete="off"
                aria-invalid={Boolean(couponError)}
                aria-describedby={couponError ? "cart-coupon-error" : undefined}
                tabIndex={couponOpen ? 0 : -1}
              />
              {couponError ? <p id="cart-coupon-error" className="cart-coupon-error" role="alert">{couponError}</p> : null}
              <button className="cart-coupon-apply" type="submit" disabled={couponBusy} tabIndex={couponOpen ? 0 : -1}>{couponBusy ? "Checking…" : "Apply"}</button>
            </form>
            <button className="cart-coupon-close" type="button" onClick={closeCoupon} tabIndex={couponOpen ? 0 : -1}>Close</button>
          </section>
        </div>
      </aside>
    </div>
  );
}

function CartLineRow({ line, href, onClose }: { line: CartLine; href: ReturnType<typeof useHref>; onClose: () => void }) {
  const productHref = href.product(line.variant.product.slug);
  return (
    <div className="cart-line">
      <Link className="cart-thumb" href={productHref} onClick={onClose}><ProductVisual productId={line.productId} iconId="package" w={70} h={62} /></Link>
      <div className="cart-product">
        <Link href={productHref} onClick={onClose}>{line.variant.product.title}</Link>
        <b>{line.quantity} × <span>{money(line.unitPrice)}</span></b>
        <div className="cart-qty" aria-label={`Quantity for ${line.variant.product.title}`}>
          <button type="button" onClick={() => void Cart.setQty(line.productVariantId, line.quantity - 1)} aria-label={`Decrease ${line.variant.product.title} quantity`}>−</button>
          <span aria-live="polite">{line.quantity}</span>
          <button type="button" onClick={() => void Cart.setQty(line.productVariantId, line.quantity + 1)} aria-label={`Increase ${line.variant.product.title} quantity`}>+</button>
        </div>
      </div>
      <button className="cart-remove" type="button" onClick={() => void Cart.remove(line.productVariantId)} aria-label={`Remove ${line.variant.product.title}`}><Icon id="i-x" w={15} /></button>
    </div>
  );
}
