import { NextResponse } from "next/server";
import { fetchBrands } from "@/lib/api";

export async function GET() {
  try {
    const items = await fetchBrands();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "The brand list is unavailable." }, { status: 503 });
  }
}
