import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import ContentPage from "@/designs/highstreet/ContentPage";
import { fetchPageBySlug } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 86400;
export function generateStaticParams() { return []; }

const loadPage = cache((slug: string) => fetchPageBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.metaTitle || page.title,
    ...(page.metaDescription ? { description: page.metaDescription } : {}),
    alternates: { canonical: `/pages/${encodeURIComponent(slug)}` },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();
  return <ContentPage slug={slug} initialPage={page} />;
}
