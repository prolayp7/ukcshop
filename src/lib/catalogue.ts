import { Product } from "./types";

export function money(n: number): string {
  return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function exVat(n: number): string {
  return money(n / 1.2);
}
export function stars(r: number): string {
  const k = Math.round(r);
  return "★★★★★".slice(0, k) + "☆☆☆☆☆".slice(0, 5 - k);
}
export function stockText(p: Product): { cls: "in" | "low" | "out"; text: string } {
  if (p.stockStatus === "in") return { cls: "in", text: `In stock — ${p.stock} available` };
  if (p.stockStatus === "low") return { cls: "low", text: `Low stock — ${p.stock} remaining` };
  return { cls: "out", text: "Backorder — due in 7–10 days" };
}
