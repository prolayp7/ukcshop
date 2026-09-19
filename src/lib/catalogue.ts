import { Product } from "./types";

// Must match the API's PAYMENT_CURRENCY (sandbox: INR, production: EUR).
export const CURRENCY = (process.env.NEXT_PUBLIC_PAYMENT_CURRENCY || "GBP").toUpperCase();
const formatter = new Intl.NumberFormat("en-GB", { style: "currency", currency: CURRENCY });
export const CURRENCY_SYMBOL = formatter.formatToParts(0).find((part) => part.type === "currency")?.value ?? CURRENCY;

export function money(n: number): string {
  return formatter.format(Number(n));
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
