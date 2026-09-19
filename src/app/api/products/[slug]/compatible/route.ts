import { NextRequest, NextResponse } from "next/server";
import { fetchCompatibleProducts } from "@/lib/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = request.nextUrl.searchParams.get("category") ?? undefined;
  const limitParam = request.nextUrl.searchParams.get("limit");
  try {
    const items = await fetchCompatibleProducts(slug, category, limitParam ? Number(limitParam) : undefined);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "The product catalogue is unavailable." }, { status: 503 });
  }
}
