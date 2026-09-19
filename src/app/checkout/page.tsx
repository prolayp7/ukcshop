"use client";

import { Suspense } from "react";
import CheckoutPage from "@/components/pages/CheckoutPage";
import { parts } from "@/designs/highstreet";

export default function Page() {
  return <Suspense><CheckoutPage parts={parts} /></Suspense>;
}
