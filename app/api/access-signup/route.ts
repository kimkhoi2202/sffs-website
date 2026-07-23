import { NextResponse, type NextRequest } from "next/server";

import { insertEmailSignup } from "@/lib/email-store";
import { captureEmailCapturedServer } from "@/lib/posthog-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** An email payload is tiny — reject anything larger as abuse. */
const MAX_BODY_BYTES = 4 * 1024;
/** RFC 5321 max email length. */
const MAX_EMAIL_LENGTH = 254;
const DEFAULT_SOURCE = "pricing-get-access";
const ALLOWED_SOURCES = new Set([DEFAULT_SOURCE]);

/**
 * Pragmatic server-side email shape check (the authority — the client does the
 * same for instant feedback). Not a full RFC 5322 parser; just enough to reject
 * obviously malformed input. The table's unique constraint dedupes the rest.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Best-effort in-memory rate limit, keyed by client IP. Serverless instances are
 * ephemeral and not shared, so this is a light abuse speed-bump per instance —
 * not a hard, distributed guarantee.
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

interface SignupBody {
  email?: unknown;
  source?: unknown;
}

/**
 * Capture an email lead from the pricing "get access" form.
 *
 * POST { email, source? } -> validates the email server-side, then forwards it
 * to the email proxy (AWS Lambda -> Aurora via the RDS Data API). Duplicate
 * emails are ignored gracefully (ON CONFLICT DO NOTHING), so a repeat submit
 * still returns { ok: true }. Never echoes the shared secret or raw errors back
 * to the client.
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

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Request too large." },
      { status: 413 },
    );
  }

  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const source =
    typeof body.source === "string" && ALLOWED_SOURCES.has(body.source)
      ? body.source
      : DEFAULT_SOURCE;

  const meta = {
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  };

  try {
    await insertEmailSignup({ email, source, meta });
    // Ad-blocker-proof server-side conversion truth, tied to the email person
    // (identified analytics). Runs after the durable insert; never throws.
    await captureEmailCapturedServer(request, source, email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("access-signup route error:", message);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
