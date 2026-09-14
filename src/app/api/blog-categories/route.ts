import { NextResponse } from "next/server";
import { fetchBlogCategories } from "@/lib/api";

export async function GET() {
  try {
    const items = await fetchBlogCategories();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "The blog is unavailable." }, { status: 503 });
  }
}
