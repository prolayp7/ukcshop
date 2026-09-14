import { NextResponse } from "next/server";
import { fetchPageBySlug } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const page = await fetchPageBySlug(slug);
    if (!page) return NextResponse.json({ message: "Page not found." }, { status: 404 });
    return NextResponse.json({ page });
  } catch {
    return NextResponse.json({ message: "This page is unavailable." }, { status: 503 });
  }
}
