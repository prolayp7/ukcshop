import { Suspense } from "react";
import CheckoutPage from "@/components/pages/CheckoutPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Suspense><CheckoutPage /></Suspense>;
}
