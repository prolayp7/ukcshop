import { Suspense } from "react";
import CheckoutPage from "@/components/pages/CheckoutPage";
import { parts } from "@/designs/highstreet";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Suspense><CheckoutPage parts={parts} /></Suspense>;
}
