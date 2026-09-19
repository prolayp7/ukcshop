import Link from "next/link";
import { SectionProps } from "@/lib/parts";
import { Icon } from "@/components/Icon";
import ProductCard from "./ProductCard";

export default function Section({ title, sub, items, link }: SectionProps) {
  if (!items || !items.length) return null;
  return (
    <section>
      <div className="wrap">
        <div className="head">
          <div>
            <h2>{title}</h2>
            {sub ? <p>{sub}</p> : null}
          </div>
          {link ? (
            <Link href={link.href}>
              {link.label} <Icon id="i-arr" w={15} />
            </Link>
          ) : null}
        </div>
        <div className="rail">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
