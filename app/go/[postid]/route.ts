import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-post short-link redirect (plan §A.3) — the growth centerpiece.
 *
 * Hermes mints ONE unique link per social post, e.g.
 *   https://www.smartfellaorfartsmella.com/go/<postid>?s=tiktok&c=2026-07_quiz_series&t=hookA
 * and this route 302-redirects to the canonical landing URL with a full,
 * consistent UTM set baked in, so PostHog attributes every visit + signup back
 * to the exact post (utm_content) and A/B hook (utm_term) — even where a platform
 * allows only ONE clickable link (TikTok bio). Hermes can change the UTM mapping
 * any time by changing the query it appends, without re-editing live posts.
 *
 * Accepts short params (s/m/c/t) OR explicit utm_* (explicit wins). The post id
 * from the path is always the utm_content (per-post attribution key).
 */

const NAMED_PLATFORMS = ["tiktok", "instagram", "youtube"];

/** Keep utm values clean + bounded (they end up in analytics + the URL bar). */
function clean(value: string | null | undefined, max = 128): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeSource(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  return NAMED_PLATFORMS.find((p) => lower.includes(p)) ?? lower;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ postid: string }> },
) {
  const { postid } = await ctx.params;
  const postId =
    clean(postid, 128)?.replace(/[^a-zA-Z0-9._-]/g, "") || "unknown";
  const q = req.nextUrl.searchParams;

  // Redirect to the canonical landing page on the SAME origin the short link was
  // hit on (prod = www, and preview/localhost stay self-consistent).
  const dest = new URL("/", req.nextUrl.origin);
  const out = dest.searchParams;

  out.set(
    "utm_source",
    normalizeSource(clean(q.get("utm_source") ?? q.get("s"))) ?? "social",
  );
  out.set(
    "utm_medium",
    clean(q.get("utm_medium") ?? q.get("m")) ?? "social_organic",
  );
  const campaign = clean(q.get("utm_campaign") ?? q.get("c"));
  if (campaign) out.set("utm_campaign", campaign);
  // The post id is the per-post attribution key; explicit utm_content wins.
  out.set("utm_content", clean(q.get("utm_content")) ?? postId);
  const term = clean(q.get("utm_term") ?? q.get("t"));
  if (term) out.set("utm_term", term);

  return NextResponse.redirect(dest, 302);
}
