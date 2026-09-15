"use client";

import { useRef, useState, type ReactNode } from "react";
import { BadgeCheck, MessageSquare, Star } from "lucide-react";
import type { ApiProductBase, ApiReview, PaginationMeta } from "@/lib/api";
import type { Product } from "@/lib/types";

function Rating({ value }: { value: number }) {
  return <span className="product-feedback-stars" role="img" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill={star <= Math.round(value) ? "currentColor" : "none"} aria-hidden="true" />)}
  </span>;
}

export default function ProductReviews({ product, summary, reviews, loading, error, meta, page, onPage, children }: {
  product: Product; summary: ApiProductBase["reviewSummary"]; reviews: ApiReview[];
  loading: boolean; error: boolean; meta?: PaginationMeta; page: number;
  onPage: (page: number) => void; children: ReactNode;
}) {
  const [filter, setFilter] = useState("all");
  const form = useRef<HTMLDetailsElement>(null);
  const total = summary?.count ?? product.reviews;
  const average = summary?.average ?? product.rating;
  const filtered = reviews.filter((review) => filter === "all" || (filter === "verified" ? review.orderItemId !== null : review.rating === Number(filter)));

  function showForm() {
    if (!form.current) return;
    form.current.open = true;
    form.current.scrollIntoView({ block: "center" });
    form.current.querySelector<HTMLElement>("input,button,a")?.focus({ preventScroll: true });
  }

  return <section id="reviews" className="product-feedback" aria-labelledby="product-feedback-title">
    <div className="product-feedback-heading">
      <div><p className="product-spec-eyebrow">Customer feedback</p><h2 id="product-feedback-title">Customer Reviews</h2></div>
      <button type="button" className="product-feedback-submit" onClick={showForm}><MessageSquare size={15} aria-hidden="true" />Submit Your Review</button>
    </div>
    <div className="product-feedback-overview">
      <div className="product-feedback-score"><strong>{total ? average.toFixed(1) : "—"}</strong><Rating value={average} /><p>Based on <b>{total.toLocaleString("en-GB")}</b> review{total === 1 ? "" : "s"}</p><span><BadgeCheck size={14} aria-hidden="true" />Verified purchases are marked below</span></div>
      <div className="product-feedback-distribution" aria-label="Rating distribution">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary?.distribution?.[rating] ?? 0;
          return <div key={rating}><span>{rating} star{rating === 1 ? "" : "s"}</span><meter min={0} max={Math.max(total, 1)} value={count} aria-label={`${rating} stars: ${count} reviews`} /><span>{summary?.distribution ? count : "—"}</span></div>;
        })}
      </div>
    </div>
    <div className="product-feedback-filters" aria-label="Filter reviews on this page"><span>Filter this page:</span>{[["all", "All reviews"], ["verified", "Verified purchases"], ["5", "5 stars"], ["4", "4 stars"], ["3", "3 stars"], ["2", "2 stars"], ["1", "1 star"]].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
    {loading ? <p role="status">Loading reviews…</p> : error ? <p role="alert">Reviews could not be loaded. Please refresh the page to try again.</p> : filtered.length ? <div className="product-feedback-grid">{filtered.map((review) => <article className="product-feedback-card" key={review.id}>
      <div className="product-feedback-card-top"><Rating value={review.rating} /><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time></div>
      {review.title && <h3>{review.title}</h3>}
      {review.comment && <p>{review.comment}</p>}
      <div className="product-feedback-author"><span className="product-feedback-avatar" aria-hidden="true">{review.reviewerName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span><div><b>{review.reviewerName}</b>{review.orderItemId !== null && <span><BadgeCheck size={13} aria-hidden="true" />Verified purchase</span>}</div></div>
    </article>)}</div> : <p className="product-feedback-empty">{reviews.length ? "No reviews match this filter on this page." : "No reviews yet. Be the first to share your experience."}</p>}
    {meta && meta.totalPages > 1 && <nav className="product-feedback-pagination" aria-label="Review pages"><button type="button" disabled={loading || page <= 1} onClick={() => onPage(page - 1)}>Previous</button><span>Page {page} of {meta.totalPages}</span><button type="button" disabled={loading || page >= meta.totalPages} onClick={() => onPage(page + 1)}>Next</button></nav>}
    <details ref={form} className="product-feedback-form"><summary>Write a review</summary>{children}</details>
  </section>;
}
