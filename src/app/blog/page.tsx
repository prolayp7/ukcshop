"use client";

import { Suspense } from "react";
import BlogPage from "@/designs/highstreet/BlogPage";

export default function Page() {
  return (
    <Suspense>
      <BlogPage />
    </Suspense>
  );
}
