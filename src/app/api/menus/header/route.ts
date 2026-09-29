import { NextResponse } from "next/server";
import { fetchHeaderNav } from "@/lib/api";

export async function GET() {
  return NextResponse.json({ data: await fetchHeaderNav() });
}
