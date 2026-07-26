import { NextResponse, type NextRequest } from "next/server";

import { mintCheckoutToken, verifyUnlockCode } from "@/lib/store/unlock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** An unlock code is a short HMAC-signed string — reject anything larger as abuse. */
const MAX_BODY_BYTES = 2 * 1024;
/** Generous upper bound on the code string itself once JSON-parsed. */
const MAX_CODE_LENGTH = 1024;

/**
 * Generic failure message — deliberately identical for every failure mode
 * (malformed code, tampered signature, wrong secret, wrong tier) so the
 * response is never a failure oracle for code-guessing.
 */
const GENERIC_FAIL = "That's not a real Smart Fella code.";

/**
 * Best-effort in-memory rate limit, keyed by client IP. Serverless instances are
 * ephemeral and not shared, so this is a light abuse speed-bump per instance —
 * not a hard, distributed guarantee. (See access-signup route.)
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistically bound memory so the map can't grow without limit.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > RATE_LIMIT_MAX;
}

interface UnlockBody {
  code?: unknown;
}

/**
 * Verify a Smart Fella app-tier unlock code and, on success, mint a short-lived
 * checkout token for the gated Smart Fella Tee.
 *
 * POST { code } -> 200 { ok: true, token } | 400 { ok: false, error } (generic,
 * no failure oracle) | 503 { ok: false, error } if the unlock secret isn't
 * configured (e.g. a preview deploy without env vars).
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Give it a minute and try again." },
      { status: 429 },
    );
  }

  // Fail closed but gracefully — missing config should never 500 a preview deploy.
  const secret = process.env.SFFS_UNLOCK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "The unlock gate is warming up — check back soon." },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Request too large." },
      { status: 413 },
    );
  }

  let body: UnlockBody;
  try {
    body = (await request.json()) as UnlockBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code || code.length > MAX_CODE_LENGTH) {
    return NextResponse.json(
      { ok: false, error: GENERIC_FAIL },
      { status: 400 },
    );
  }

  const result = verifyUnlockCode(code, secret);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: GENERIC_FAIL },
      { status: 400 },
    );
  }

  const token = mintCheckoutToken("smart-fella-tee", secret);
  return NextResponse.json({ ok: true, token });
}
