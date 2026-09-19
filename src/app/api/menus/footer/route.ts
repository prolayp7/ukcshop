import { NextResponse } from "next/server";
import { fetchFooterMenu } from "@/lib/api";

export async function GET() {
  try {
    return NextResponse.json({ data: await fetchFooterMenu() });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
