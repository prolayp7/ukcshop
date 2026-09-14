import { NextResponse } from "next/server";
import { fetchCategoryBySlug } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const category = await fetchCategoryBySlug(slug);
    if (!category) return NextResponse.json({ message: "Category not found." }, { status: 404 });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ message: "The category tree is unavailable." }, { status: 503 });
  }
}
