import Link from "next/link";
import { Crumb } from "@/lib/types";

/** Identical markup shape across every design (only .crumb's own CSS
 * differs), so this one component is shared rather than duplicated
 * per-design — mirrors how the static site's crumbs() functions were all
 * near-identical string templates. */
export default function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <div className="wrap">
      <nav className="crumb">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <span key={i} style={{ display: "contents" }}>
              {i > 0 && <span>/</span>}
              {last || !c.href ? <b>{c.label}</b> : <Link href={c.href}>{c.label}</Link>}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
