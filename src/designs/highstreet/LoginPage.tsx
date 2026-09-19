"use client";

import { useSearchParams } from "next/navigation";
import { useHref } from "@/lib/design-context";
import AuthLayout from "./AuthLayout";
import AuthForm from "./AuthForm";

export default function LoginPage() {
  const href = useHref();
  const params = useSearchParams();
  const rawNext = params.get("next") || "";
  // Restrict post-login navigation to same-site paths.
  const isSafeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\") && !/[\u0000-\u001f\u007f]/.test(rawNext);
  return <AuthLayout><AuthForm next={isSafeNext ? rawNext : href.account()} /></AuthLayout>;
}
