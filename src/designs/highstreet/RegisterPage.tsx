"use client";

import type { RegisterPageContent } from "@/lib/api";
import AuthLayout from "./AuthLayout";
import AuthForm from "./AuthForm";

export default function RegisterPage({ content }: { content: RegisterPageContent | null }) {
  return <AuthLayout registration content={content}><AuthForm registration content={content} /></AuthLayout>;
}
