import { NextResponse, type NextRequest } from "next/server";

import { insertEmailSignup } from "@/lib/email-store";
import { captureEmailCapturedServer } from "@/lib/posthog-server";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** An email payload is tiny — reject anything larger as abuse. */
const MAX_BODY_BYTES = 4 * 1024;
/** RFC 5321 max email length. */
const MAX_EMAIL_LENGTH = 254;
const DEFAULT_SOURCE = "pricing-get-access";

/**
 * Every surface that may capture an address. An unrecognised source is NOT
 * rejected — it is silently rewritten to DEFAULT_SOURCE (see below), so
 * forgetting to add one here does not break a signup, it just misfiles it
 * forever. Keep this in step with EMAIL_SOURCES in lib/analytics/events.ts.
 *
 *   pricing-get-access         the archived early-access homepage form
 *   smart-fella-test-parent    the adult test's results gate: a parent's own address
 *   smart-fella-test-child     a child test's results gate: a GROWN-UP's address,
 *                              asked for as such. Kept distinct from the parent
 *                              value on purpose — the site is positioned 13+,
 *                              most of the grade range is under 13, and these
 *                              two records mean different things.
 */
const ALLOWED_SOURCES = new Set([
  DEFAULT_SOURCE,
  "smart-fella-test-parent",
  "smart-fella-test-child",
]);

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
 *
 * The mechanism moved to lib/rate-limit.ts when the results email endpoint
 * needed the same behaviour with different numbers. The limits below are
 * unchanged from when they lived here.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

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
  const ip = clientIp(request.headers);

  if (isRateLimited("access-signup", ip, {
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
  })) {
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
    const { inserted } = await insertEmailSignup({ email, source, meta });
    // Ad-blocker-proof server-side conversion truth (no PII — source/attribution
    // only). Runs after the durable insert; never throws.
    //
    // Only a genuinely new row counts. Re-submitting an address that is already
    // on the list is not a second conversion, and no client-side guard can
    // catch that case because it spans separate visits.
    if (inserted) {
      await captureEmailCapturedServer(request, source);
    }
    // Same status and same body either way: never reveal whether an address is
    // already on the list.
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
