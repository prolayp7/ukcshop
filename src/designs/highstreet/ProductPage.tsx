"use client";

import { useParams, notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/use-api";
import { ApiProductBase, ApiReview, PaginationMeta } from "@/lib/api";
import { Product } from "@/lib/types";
import ProductReviews from "./ProductReviews";
import ProductHelp from "./ProductHelp";
import { Recent, useRecentIds } from "@/lib/basket";
import { Icon } from "@/components/Icon";
import ProductPurchasePanel from "./ProductPurchasePanel";
import ProductSpecifications from "./ProductSpecifications";
import FrequentlyBoughtTogether from "./FrequentlyBoughtTogether";
import "./product-detail.css";
import { useHref } from "@/lib/design-context";
import { useCustomerAuth } from "@/lib/storefront-client";
import { submitReview } from "@/lib/reviews-api";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";
import ProductCard from "./ProductCard";


export default function ProductPage() {
  const params = useParams<{ id: string }>();
  return <ProductDetail key={params.id} slug={params.id} />;
}

function ProductDetail({ slug }: { slug: string }) {
  const href = useHref();
  useRecentIds(); // kept live so basket/recently-viewed state stays consistent; see Day 4 note below

  const detail = useApi<{ product: Product; api: ApiProductBase }>(`/api/products/${encodeURIComponent(slug)}`);
  const categorySlug = detail.data?.api.category.slug ?? null;

  const relatedRes = useApi<{ items: Product[] }>(categorySlug ? `/api/products?category=${encodeURIComponent(categorySlug)}&perPage=9` : null);
  const compatibleRes = useApi<{ items: Product[] }>(detail.data ? `/api/products/${encodeURIComponent(slug)}/compatible?limit=4` : null);
  const recommendedRes = useApi<{ items: Product[]; meta: PaginationMeta }>(detail.data ? `/api/products?sort=newest&perPage=9` : null);

  const p = detail.data?.product;

  const related = useMemo(() => (relatedRes.data?.items ?? []).filter((x) => x.id !== p?.id).slice(0, 4), [relatedRes.data, p?.id]);
  const alsoBought = compatibleRes.data?.items ?? [];
  const recommended = useMemo(() => (recommendedRes.data?.items ?? []).filter((x) => x.id !== p?.id).slice(0, 4), [recommendedRes.data, p?.id]);
  // Recently-viewed lookup isn't wired to live data in this pass - it needs
  // basket.ts's Recent store to move from tracking numeric ids to slugs,
  // which is Day 4's job (it owns the whole basket/localStorage data layer).
  const recentlyViewed: Product[] = [];

  useEffect(() => {
    if (p) Recent.push(p.id);
  }, [p]);

  const { isLoggedIn } = useCustomerAuth();
  const [reviewPage, setReviewPage] = useState(1);
  const reviewsRes = useApi<{ items: ApiReview[]; meta: PaginationMeta }>(p ? `/api/reviews?productId=${p.id}&page=${reviewPage}&perPage=6` : null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (detail.error) notFound();
  if (!p) return <div className="wrap" style={{ padding: "60px 0", textAlign: "center", color: "var(--body)" }}>Loading…</div>;

  const reviews = reviewsRes.data?.items ?? [];
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) {
      setReviewError("Please select a star rating.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      await submitReview({ productId: p.id, rating: reviewRating, title: reviewTitle.trim() || undefined, comment: reviewComment.trim() || undefined });
      setReviewSubmitted(true);
      setReviewRating(0);
      setReviewTitle("");
      setReviewComment("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Could not submit your review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <Crumbs
        items={[
          { label: "Home", href: href.home() },
          { label: p.category, href: href.category({ cat: p.category }) },
          { label: p.name },
        ]}
      />
      <div className="product-detail-page"><div className="wrap">
        <ProductPurchasePanel key={`purchase-${p.id}`} product={p} api={detail.data!.api} onReviews={() => {
          document.getElementById("reviews")?.scrollIntoView({ block: "start" });
        }} />

        <FrequentlyBoughtTogether key={`together-${p.id}`} product={p} companions={alsoBought} minimum={detail.data!.api.minimumOrderQuantity || 1} />

        <div className="tabbar">
          <button className="on" data-tab="spec" onClick={(e) => switchTab(e, "spec")}>
            Specification
          </button>
          <button data-tab="reviews" onClick={() => document.getElementById("reviews")?.scrollIntoView({ block: "start" })}>
            Reviews ({p.reviews.toLocaleString("en-GB")})
          </button>
          <button data-tab="delivery" onClick={(e) => switchTab(e, "delivery")}>
            Delivery &amp; returns
          </button>
        </div>
        <div className="tabpane on" id="spec">
          <ProductSpecifications key={p.id} product={p} brandHref={href.brand(p.brandSlug)} />
        </div>
        <div className="tabpane" id="delivery">
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>
            {detail.data?.api.inStockDeliveryTime ? `In-stock delivery: ${detail.data.api.inStockDeliveryTime}. ` : "Delivery options and charges are shown at checkout. "}
            {detail.data?.api.outOfStockDeliveryTime ? `Out-of-stock availability: ${detail.data.api.outOfStockDeliveryTime}.` : ""}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--body)" }}>
            {detail.data?.api.isReturnable && detail.data.api.returnableDays ? `Returns accepted within ${detail.data.api.returnableDays} days, subject to the store returns policy.` : "Contact customer service for this product’s returns policy."}
            {detail.data?.api.warrantyMonths ? ` Includes a ${detail.data.api.warrantyMonths}-month warranty.` : ""}
          </p>
        </div>
        <ProductReviews key={`reviews-${p.id}`} product={p} summary={detail.data!.api.reviewSummary} reviews={reviews} loading={reviewsRes.loading} error={reviewsRes.error} meta={reviewsRes.data?.meta} page={reviewPage} onPage={setReviewPage}>
          <div className="ck-block" style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Write a review</h3>
            {!isLoggedIn ? (
              <p style={{ fontSize: 13.5, color: "var(--body)" }}>
                <a href={href.login({ next: href.product(p.slug) })} style={{ color: "var(--blue)", fontWeight: 600 }}>
                  Sign in
                </a>{" "}
                to write a review.
              </p>
            ) : reviewSubmitted ? (
              <p style={{ fontSize: 13.5, color: "var(--body)" }}>Thanks for your review — it&rsquo;ll appear here once it&rsquo;s been approved.</p>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                <div className="ck-field">
                  <label>Rating</label>
                  <div>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        aria-pressed={n <= reviewRating}
                        onClick={() => setReviewRating(n)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, color: n <= reviewRating ? "var(--blue)" : "#d5d5d5", padding: "0 2px" }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ck-field">
                  <label htmlFor="product-review-title">Title (optional)</label>
                  <input id="product-review-title" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} maxLength={160} />
                </div>
                <div className="ck-field">
                  <label htmlFor="product-review-comment">Review (optional)</label>
                  <textarea id="product-review-comment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} maxLength={2000} rows={4} />
                </div>
                {reviewError ? <p style={{ color: "#c0392b", fontSize: 13, margin: "0 0 10px" }}>{reviewError}</p> : null}
                <button className="bk-cta" type="submit" disabled={reviewSubmitting} style={{ display: "inline-flex", padding: "10px 20px" }}>
                  {reviewSubmitting ? "Submitting…" : "Submit review"}
                </button>
              </form>
            )}
          </div>
        </ProductReviews>
        <ProductHelp key={`help-${p.id}`} product={p} api={detail.data!.api} />
      </div>

      </div>
      <Rail title="Related products" sub={`Alternatives in ${p.subcategory}, at a similar price.`} items={related} link={{ href: href.category({ sub: p.subcategory }), label: "See all " + p.subcategory }} />
      <Rail title="Recommended for you" sub="Popular right now across the catalogue." items={recommended} />
      {recentlyViewed.length ? <Rail title="Recently viewed" items={recentlyViewed.slice(0, 4)} /> : null}
      <Footer />
    </>
  );
}

function switchTab(e: React.MouseEvent<HTMLButtonElement>, tab: string) {
  const bar = e.currentTarget.parentElement!;
  bar.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
  e.currentTarget.classList.add("on");
  const wrap = bar.parentElement!;
  wrap.querySelectorAll(".tabpane").forEach((p) => p.classList.remove("on"));
  wrap.querySelector(`#${tab}`)?.classList.add("on");
}

function Rail({ title, sub, items, link }: { title: string; sub?: string; items: Product[]; link?: { href: string; label: string } }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="wrap">
        <div className="head">
          <div>
            <h2>{title}</h2>
            {sub ? <p>{sub}</p> : null}
          </div>
          {link ? (
            <a href={link.href}>
              {link.label} <Icon id="i-arr" w={15} />
            </a>
          ) : null}
        </div>
        <div className="rail">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
