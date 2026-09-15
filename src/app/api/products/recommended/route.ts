import { NextRequest, NextResponse } from "next/server";
import { fetchRecommendedProducts } from "@/lib/api";

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit")) || undefined;
  try {
    const items = await fetchRecommendedProducts(limit);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "Recommendations are unavailable." }, { status: 503 });
  }
}
