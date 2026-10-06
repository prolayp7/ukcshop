"use client";

import type { ApiTestimonial } from "@/lib/api";
import AutoScrollCards from "./AutoScrollCards";

export default function TestimonialCarousel({ items }: { items: ApiTestimonial[] }) {
  return (
    <AutoScrollCards className="revcards" label="Customer testimonials">
      {items.map((item) => (
        <div className="revcard" key={item.id}>
          <span className="s">{"★".repeat(item.stars)}</span>
          <p>&ldquo;{item.quote}&rdquo;</p>
          <b>{item.name}</b>
        </div>
      ))}
    </AutoScrollCards>
  );
}