import { NextResponse } from "next/server";
import { fetchBlogPostBySlug } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const post = await fetchBlogPostBySlug(slug);
    if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ message: "The blog is unavailable." }, { status: 503 });
  }
}
