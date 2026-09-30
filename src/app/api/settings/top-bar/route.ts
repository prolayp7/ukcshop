import { NextResponse } from "next/server";
import { fetchTopBarContent } from "@/lib/api";

export async function GET() {
  const content = await fetchTopBarContent();
  return content ? NextResponse.json({ data: content }) : NextResponse.json({ message: "Top bar settings are unavailable." }, { status: 503 });
}
