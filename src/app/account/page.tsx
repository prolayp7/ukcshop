import { Suspense } from "react";
import AccountPage from "@/components/pages/AccountPage";
import { parts } from "@/designs/highstreet";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Suspense><AccountPage parts={parts} /></Suspense>;
}
