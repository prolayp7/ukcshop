import type { MetadataRoute } from "next";
import { siteOrigin } from "./category/category-view";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: new URL("/sitemap.xml", await siteOrigin()).href };
}
