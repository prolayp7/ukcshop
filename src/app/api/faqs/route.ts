import { NextResponse } from "next/server";
import { fetchFaqs } from "@/lib/api";

export async function GET() {
  try {
    const items = await fetchFaqs();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "The FAQs are unavailable." }, { status: 503 });
  }
}
