import { NextResponse } from "next/server";
import { fetchGeneralSettings } from "@/lib/api";

export async function GET() {
  try {
    const settings = await fetchGeneralSettings();
    return NextResponse.json({ data: settings });
  } catch {
    return NextResponse.json({ message: "General settings are unavailable." }, { status: 503 });
  }
}
