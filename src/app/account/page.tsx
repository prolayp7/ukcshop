"use client";

import { Suspense } from "react";
import AccountPage from "@/components/pages/AccountPage";
import { parts } from "@/designs/highstreet";

export default function Page() {
  return <Suspense><AccountPage parts={parts} /></Suspense>;
}
