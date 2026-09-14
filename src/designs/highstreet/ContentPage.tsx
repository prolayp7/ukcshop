"use client";

import { useParams, notFound } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { ApiPage } from "@/lib/api";
import { useHref } from "@/lib/design-context";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";

// contentBlocks is an admin-authored free-form JSON field. Until the admin
// panel's page editor settles on a block shape, render defensively: a plain
// string renders as paragraphs, an array of {heading?, body} blocks renders
// as sections, anything else is skipped rather than crashing the page.
function renderBlocks(blocks: unknown) {
  if (typeof blocks === "string") {
    return blocks.split("\n\n").map((para, i) => <p key={i}>{para}</p>);
  }
  if (Array.isArray(blocks)) {
    return blocks.map((block, i) => {
      if (block && typeof block === "object" && "body" in block) {
        const b = block as { heading?: string; body?: string };
        return (
          <section key={i}>
            {b.heading ? <h2>{b.heading}</h2> : null}
            {b.body?.split("\n\n").map((para, j) => <p key={j}>{para}</p>)}
          </section>
        );
      }
      return null;
    });
  }
  return null;
}

export default function ContentPage() {
  const params = useParams<{ slug: string }>();
  const href = useHref();
  const pageRes = useApi<{ page: ApiPage }>(`/api/pages/${encodeURIComponent(params.slug)}`);

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
