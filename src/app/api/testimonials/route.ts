import { NextResponse } from "next/server";
import { fetchTestimonials } from "@/lib/api";

export async function GET() {
  try {
    const items = await fetchTestimonials();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "The testimonials are unavailable." }, { status: 503 });
  }
}
