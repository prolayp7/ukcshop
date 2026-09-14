"use client";

import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { ApiBlogPost, ApiCategoryRef, PaginationMeta } from "@/lib/api";
import { useHref } from "@/lib/design-context";
import { theme } from "@/lib/theme.config";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";

export default function BlogPage() {
  const href = useHref();
  const params = useSearchParams();
  const categorySlug = params.get("category") || undefined;

  const categoriesRes = useApi<{ items: ApiCategoryRef[] }>("/api/blog-categories");
  const postsRes = useApi<{ items: ApiBlogPost[]; meta: PaginationMeta }>(
    `/api/blog${categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ""}`,
  );

  const posts = postsRes.data?.items ?? [];
  const categories = categoriesRes.data?.items ?? [];
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "Blog" }]} />
      <div className="wrap">
        <div className="info-hero">
          <span className="eyebrow">Guides & news</span>
          <h1>{activeCategory ? activeCategory.title : "The blog"}</h1>
          <p>Buying guides, build advice and product news from the {theme.brand.name} team.</p>
        </div>
        <div className="blog-layout">
          <div>
            {activeCategory ? (
              <div className="blog-active-filter" style={{ marginBottom: 16 }}>
                Filtered by <b>{activeCategory.title}</b> · <a href="/blog">Clear</a>
              </div>
            ) : null}
            {posts.length ? (
              <div className="blog-grid">
                {posts.map((post) => (
                  <a className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
                    <div className="cover" style={{ background: "var(--c-surface-2)" }} />
                    <div className="body">
                      {post.blogCategory ? <span className="cat">{post.blogCategory.title}</span> : null}
                      <h3>{post.title}</h3>
                      {post.excerpt ? <p>{post.excerpt}</p> : null}
                      <div className="meta">
                        <span>{post.author?.name ?? theme.brand.name}</span>
                        <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : postsRes.loading ? (
              <p style={{ color: "var(--body)" }}>Loading…</p>
            ) : (
              <p style={{ color: "var(--body)" }}>No posts here yet — check back soon.</p>
            )}
          </div>
          <aside className="blog-sidebar">
            <div className="blog-widget">
              <h4>Categories</h4>
              <ul>
                <li>
                  <a href="/blog">All posts</a>
                </li>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <a href={`/blog?category=${c.slug}`}>{c.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
