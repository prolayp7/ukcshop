"use client";

import { byId } from "./catalogue";
import { Product } from "./types";

export interface Address {
  id: number;
  label: string;
  name: string;
  lines: string[];
  phone: string;
  default: boolean;
}
export const DEFAULT_ADDRESSES: Address[] = [
  { id: 1, label: "Home", name: "P. Roy", lines: ["14 Ardwick Green North", "Manchester", "M12 6FZ"], phone: "07700 900412", default: true },
  { id: 2, label: "Work", name: "P. Roy", lines: ["Unit 7, Sharp Street", "Manchester", "M4 5DA"], phone: "0161 496 0112", default: false },
];

export interface OrderLine {
  p: Product;
  qty: number;
}
export interface Order {
  ref: string;
  date: string;
  status: string;
  items: OrderLine[];
  goods: number;
  shipping: number;
  total: number;
}

/** A plausible, fixed order history so the account page has something to
 * show — ported from the static site's orders(), same reference dates. */
export function orders(): Order[] {
  const pick = (ids: number[]) => ids.map(byId).filter((p): p is Product => p !== null);
  const mk = (ref: string, daysAgo: number, status: string, ids: number[], qtys?: number[]): Order => {
    const items = pick(ids).map((p, i) => ({ p, qty: qtys?.[i] || 1 }));
    const goods = items.reduce((s, it) => s + it.p.price * it.qty, 0);
    const d = new Date(2026, 7, 26);
    d.setDate(d.getDate() - daysAgo);
    const shipping = goods >= 75 ? 0 : 4.95;
    return { ref, date: d.toISOString().slice(0, 10), status, items, goods, shipping, total: goods + shipping };
  };
  return [
    mk("UKCS-209930", 0, "Processing", [1], [1]),
    mk("UKCS-208841", 4, "Out for delivery", [23, 29], [1, 2]),
    mk("UKCS-207115", 26, "Delivered", [9, 17, 37]),
    mk("UKCS-204902", 91, "Delivered", [52, 49], [2, 1]),
  ];
}
