import { NextRequest, NextResponse } from "next/server";
import { fetchProductBySlug, productImage } from "@/lib/api";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const result = await fetchProductBySlug(slug);
    if (!result) return NextResponse.json({ message: "Product not found." }, { status: 404 });
    return NextResponse.json({ product: result.product, api: result.api, image: productImage(result.api) });
  } catch {
    return NextResponse.json({ message: "The product catalogue is unavailable." }, { status: 503 });
  }
}
