import { NextResponse } from "next/server";
import { fetchCategoryTree } from "@/lib/api";

export async function GET() {
  try {
    const items = await fetchCategoryTree();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "The category tree is unavailable." }, { status: 503 });
  }
}
