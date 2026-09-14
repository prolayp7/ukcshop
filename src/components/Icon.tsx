import { productImageUrl } from "@/lib/productImages";

/** Matches the static site's ic()/icv() helpers — a plain <svg><use> against
 * the shared sprite rendered once in the root layout. */
export function Icon({ id, w, h, className }: { id: string; w: number; h?: number; className?: string }) {
  return (
    <svg className={className} width={w} height={h ?? w}>
      <use href={`#${id}`} />
    </svg>
  );
}

/** The 64x44-viewbox product illustration used on cards and galleries. */
export function ProductIcon({ id, w, h, className }: { id: string; w: number; h: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 44" className={className} style={{ width: w, height: h }}>
      <use href={`#${id}`} />
    </svg>
  );
}

/** Product visual for a given catalogue id: a real photo when one exists in
 * public/images/products (see lib/productImages.ts), otherwise the sprite
 * illustration. Drop-in replacement for ProductIcon wherever a product's
 * primary image is shown (cards, product page gallery/thumbs). */
export function ProductVisual({
  productId,
  iconId,
  w,
  h,
  className,
}: {
  productId: number;
  iconId: string;
  w: number;
  h: number;
  className?: string;
}) {
  const photo = productImageUrl(productId);
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className={className} style={{ width: w, height: h, objectFit: "contain" }} />;
  }
  return <ProductIcon id={iconId} w={w} h={h} className={className} />;
}
