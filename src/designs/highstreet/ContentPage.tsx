"use client";

import { notFound } from "next/navigation";
import { useApi } from "@/lib/use-api";
import type { ApiPage } from "@/lib/api";
import { useHref } from "@/lib/design-context";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";

// contentBlocks is admin-authored: a plain string (paragraphs split by blank
// lines) or an array of {heading?, body} sections, where body is either plain
// text or rich text from the admin's page editor. Rich text arrives already
// sanitised by the API (ukshop-api storefront/cms/page-content.ts), which is
// what makes rendering it as HTML safe. Anything else is skipped rather than
// crashing the page.
const isHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);
function renderBody(text: string, key?: number) {
  if (isHtml(text)) return <div key={key} className="info-rich" dangerouslySetInnerHTML={{ __html: text }} />;
  return text.split("\n\n").map((para, i) => <p key={`${key ?? ""}-${i}`}>{para}</p>);
}
function renderBlocks(blocks: unknown) {
  if (typeof blocks === "string") return renderBody(blocks);
  if (Array.isArray(blocks)) {
    return blocks.map((block, i) => {
      if (block && typeof block === "object" && "body" in block) {
        const b = block as { heading?: string; body?: string };
        return (
          <section key={i}>
            {b.heading ? <h2>{b.heading}</h2> : null}
            {b.body ? renderBody(b.body) : null}
          </section>
        );
      }
      return null;
    });
  }
  return null;
}

export default function ContentPage({ slug, initialPage }: { slug: string; initialPage: ApiPage }) {
  const href = useHref();
  const pageRes = useApi<{ page: ApiPage }>(`/api/pages/${encodeURIComponent(slug)}`, { page: initialPage }, { skipInitialFetch: true });

  if (pageRes.error) notFound();
  const page = pageRes.data?.page;
  if (!page) return <div className="wrap" style={{ padding: "60px 0", textAlign: "center", color: "var(--body)" }}>Loading…</div>;

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: page.title }]} />
      <div className="wrap">
        <div className="info-hero">
          <h1>{page.title}</h1>
        </div>
        <div className="info-body">{renderBlocks(page.contentBlocks) ?? <p>This page has no content yet.</p>}</div>
      </div>
      <Footer />
    </>
  );
}
