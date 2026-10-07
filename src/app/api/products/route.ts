import { NextRequest, NextResponse } from "next/server";
import { fetchProducts, ProductListParams } from "@/lib/api";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  // The production ingress must overwrite these headers; the API trusts the forwarded IP only behind its private storefront proxy.
  const clientIp = request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const params: ProductListParams = {
    inStock: sp.get("inStock") === "true" ? true : undefined,
    specs: sp.get("specs") ?? undefined,
    q: sp.get("q") ?? undefined,
    category: sp.get("category") ?? undefined,
    brand: sp.get("brand") ?? undefined,
    priceMin: sp.get("priceMin") ? Number(sp.get("priceMin")) : undefined,
    priceMax: sp.get("priceMax") ? Number(sp.get("priceMax")) : undefined,
    sort: (sp.get("sort") as ProductListParams["sort"]) ?? undefined,
    onSale: sp.get("onSale") === "true" ? true : undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    perPage: sp.get("perPage") ? Number(sp.get("perPage")) : undefined,
    ids: sp.get("ids") ? sp.get("ids")!.split(",").map(Number).filter(Number.isFinite) : undefined,
  };
  try {
    const result = await fetchProducts(params, clientIp ? { "x-forwarded-for": clientIp } : undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[storefront] Product list request failed", error);
    return NextResponse.json({ message: "The product catalogue is unavailable." }, { status: 503 });
  }
}
