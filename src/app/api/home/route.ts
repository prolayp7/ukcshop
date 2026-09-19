import { NextResponse } from "next/server";
import { fetchHome } from "@/lib/api";

export async function GET() {
  try {
    const home = await fetchHome();
    return NextResponse.json({ home });
  } catch {
    return NextResponse.json({ message: "The homepage content is unavailable." }, { status: 503 });
  }
}
