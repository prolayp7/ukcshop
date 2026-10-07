import { Suspense } from "react";
import AccountPage from "@/components/pages/AccountPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Suspense><AccountPage /></Suspense>;
}
