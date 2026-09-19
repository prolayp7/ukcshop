import { NextResponse } from "next/server";
import { fetchBrandBySlug } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const brand = await fetchBrandBySlug(slug);
    if (!brand) return NextResponse.json({ message: "Brand not found." }, { status: 404 });
    return NextResponse.json({ brand });
  } catch {
    return NextResponse.json({ message: "The brand list is unavailable." }, { status: 503 });
  }
}
