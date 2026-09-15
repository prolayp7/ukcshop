import { NextRequest, NextResponse } from "next/server";
import { fetchReviews } from "@/lib/api";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const productId = Number(sp.get("productId"));
  if (!productId) return NextResponse.json({ message: "productId is required" }, { status: 400 });
  const page = sp.get("page") ? Number(sp.get("page")) : undefined;
  const perPage = sp.get("perPage") ? Number(sp.get("perPage")) : undefined;
  try {
    const result = await fetchReviews(productId, page, perPage);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "Reviews are unavailable." }, { status: 503 });
  }
}
