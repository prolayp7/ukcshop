import type { Metadata } from "next";
import TestimonialsPage from "@/designs/highstreet/TestimonialsPage";
import { fetchTestimonials } from "@/lib/api";

export const metadata: Metadata = {
  title: "Customer reviews",
  description: "Read customer feedback about shopping with UK Computer Shop.",
};

export default async function Page() {
  const testimonials = await fetchTestimonials().catch(() => []);
  return <TestimonialsPage initialTestimonials={testimonials} />;
}
