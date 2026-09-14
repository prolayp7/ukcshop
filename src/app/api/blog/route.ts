import { NextRequest, NextResponse } from "next/server";
import { fetchBlogPosts } from "@/lib/api";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  try {
    const result = await fetchBlogPosts({
      category: sp.get("category") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      perPage: sp.get("perPage") ? Number(sp.get("perPage")) : undefined,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "The blog is unavailable." }, { status: 503 });
  }
}
