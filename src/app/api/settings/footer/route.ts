import { NextResponse } from "next/server";
import { fetchFooterContent } from "@/lib/api";

export async function GET() {
  const content = await fetchFooterContent();
  return content ? NextResponse.json({ data: content }) : NextResponse.json({ message: "Footer settings are unavailable." }, { status: 503 });
}
