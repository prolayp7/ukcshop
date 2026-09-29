import { NextResponse } from "next/server";
import { fetchReviewSummary } from "@/lib/api";

export async function GET() {
  try {
    return NextResponse.json({ data: await fetchReviewSummary() });
  } catch {
    return NextResponse.json({ message: "Review summary is unavailable." }, { status: 503 });
  }
}
