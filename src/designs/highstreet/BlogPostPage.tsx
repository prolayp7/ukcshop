"use client";

import { useParams, notFound } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { ApiBlogPost } from "@/lib/api";
import { useHref } from "@/lib/design-context";
import { theme } from "@/lib/theme.config";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const href = useHref();
  const postRes = useApi<{ post: ApiBlogPost }>(`/api/blog/${encodeURIComponent(params.slug)}`);

  if (postRes.error) notFound();
  const post = postRes.data?.post;
  if (!post) return <div className="wrap" style={{ padding: "60px 0", textAlign: "center", color: "var(--body)" }}>Loading…</div>;

  return (
    <>
      <Header />
      <Crumbs
        items={[
          { label: "Home", href: href.home() },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />
      <div className="wrap">
        <div className="blog-post-hero">
          {post.blogCategory ? <span className="cat">{post.blogCategory.title}</span> : null}
          <h1>{post.title}</h1>
          <div className="blog-byline">
            <div className="avatar" style={{ background: "var(--c-surface-2)" }} />
            <div>
              <b>{post.author?.name ?? theme.brand.name}</b>
              <span>
                {post.author?.role ? `${post.author.role} · ` : ""}
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="blog-cover" style={{ background: "var(--c-surface-2)" }} />
        <div className="blog-post-body">
          {post.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {post.author?.bio ? (
          <div className="author-card">
            <div className="author-hero" />
            <div>
              <b>{post.author.name}</b>
              <p>{post.author.bio}</p>
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </>
  );
}
