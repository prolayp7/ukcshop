import { createHash, timingSafeEqual } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isKnownCacheTag, isRevalidatablePath } from "@/lib/cache-tags";

// Private endpoint the API calls after a successful admin change:
//   POST /api/revalidate   Authorization: Bearer <REVALIDATION_SECRET>
//   { "tags": ["homepage", "product:123"], "paths": ["/"] }
// Only known tags and plain site paths are accepted. Cleared data is fetched fresh on the next request
// ({ expire: 0 }), so an admin change is visible on the very next page view.

const MAX_ITEMS = 50;

function authorised(request: Request): boolean {
  const secret = process.env.REVALIDATION_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  // Compare digests so neither the secret's content nor its length leaks through timing.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header.slice("Bearer ".length)), digest(secret));
}

export async function POST(request: Request) {
  if (!process.env.REVALIDATION_SECRET) {
    console.error("[REVALIDATION] status=disabled reason=REVALIDATION_SECRET not set");
    return NextResponse.json({ message: "Revalidation is not configured." }, { status: 503 });
  }
  if (!authorised(request)) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  let body: { tags?: unknown; paths?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
    }
    body = parsed as { tags?: unknown; paths?: unknown };
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }
  const tags = Array.isArray(body.tags) ? body.tags : [];
  const paths = Array.isArray(body.paths) ? body.paths : [];
  if (!tags.length && !paths.length) return NextResponse.json({ message: "Give at least one tag or path." }, { status: 400 });
  if (tags.length + paths.length > MAX_ITEMS) return NextResponse.json({ message: `At most ${MAX_ITEMS} tags and paths per request.` }, { status: 400 });
  const badTags = tags.filter((tag) => !isKnownCacheTag(tag));
  const badPaths = paths.filter((path) => !isRevalidatablePath(path));
  if (badTags.length || badPaths.length) {
    console.warn(`[REVALIDATION] status=rejected invalidTags=${JSON.stringify(badTags).slice(0, 300)} invalidPaths=${JSON.stringify(badPaths).slice(0, 300)}`);
    return NextResponse.json({ message: "Unknown tag or invalid path.", invalidTags: badTags, invalidPaths: badPaths }, { status: 400 });
  }

  try {
    for (const tag of tags as string[]) revalidateTag(tag, { expire: 0 });
    for (const path of paths as string[]) revalidatePath(path);
  } catch (error) {
    console.error(`[REVALIDATION] status=failed tags=${tags.join(",")} paths=${paths.join(",")} error=${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({ message: "Revalidation failed." }, { status: 500 });
  }
  console.info(`[REVALIDATION] status=success tags=${tags.join(",") || "-"} paths=${paths.join(",") || "-"}`);
  return NextResponse.json({ revalidated: { tags, paths } });
}
