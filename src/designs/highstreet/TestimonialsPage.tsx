"use client";

import { useApi } from "@/lib/use-api";
import { ApiTestimonial } from "@/lib/api";
import { stars } from "@/lib/catalogue";
import { useHref } from "@/lib/design-context";
import { theme } from "@/lib/theme.config";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";

export default function TestimonialsPage() {
  const href = useHref();
  const res = useApi<{ items: ApiTestimonial[] }>("/api/testimonials");
  const testimonials = res.data?.items ?? [];
  const avg = testimonials.length ? testimonials.reduce((sum, t) => sum + t.stars, 0) / testimonials.length : 0;

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "Reviews" }]} />
      <div className="wrap">
        <div className="info-hero">
          <span className="eyebrow">Customer reviews</span>
          <h1>What customers say</h1>
          <p>Real feedback from {theme.brand.name} customers.</p>
        </div>
        {testimonials.length ? (
          <>
            <div className="revscore" style={{ marginBottom: 24 }}>
              <b>{avg.toFixed(1)}</b>
              <span className="s">{stars(avg)}</span>
              <span>Based on {testimonials.length} customer reviews</span>
            </div>
            <div className="revcol">
              {testimonials.map((t) => (
                <div className="revcard" key={t.id}>
                  <span className="s">{stars(t.stars)}</span>
                  <p>&ldquo;{t.quote}&rdquo;</p>
                  <b>{t.name}</b>
                  {t.title ? <span>{t.title}</span> : null}
                </div>
              ))}
            </div>
          </>
        ) : res.loading ? (
          <p style={{ color: "var(--body)" }}>Loading…</p>
        ) : (
          <p style={{ color: "var(--body)" }}>No reviews published yet.</p>
        )}
      </div>
      <Footer />
    </>
  );
}
