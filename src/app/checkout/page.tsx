import { Suspense } from "react";
import type { Metadata } from "next";
import CheckoutPage from "@/components/pages/CheckoutPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return <Suspense><CheckoutPage /></Suspense>;
}
