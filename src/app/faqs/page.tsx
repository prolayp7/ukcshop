import type { Metadata } from "next";
import FaqsPage from "@/designs/highstreet/FaqsPage";
import { fetchFaqs } from "@/lib/api";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about delivery, returns, warranty and ordering from UK Computer Shop.",
};

export default async function Page() {
  const categories = await fetchFaqs().catch(() => []);
  return <FaqsPage initialCategories={categories} />;
}
