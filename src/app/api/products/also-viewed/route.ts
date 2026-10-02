import { NextRequest, NextResponse } from "next/server";
import { fetchAlsoViewedProducts } from "@/lib/api";

export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 12);
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit")) || 4;
  const limit = Math.max(1, Math.min(requestedLimit, 12));
  if (!ids.length) return NextResponse.json({ items: [] });

  try {
    const items = await fetchAlsoViewedProducts(ids, limit);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "Related recommendations are unavailable." }, { status: 503 });
  }
}