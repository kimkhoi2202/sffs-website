import { NextResponse, type NextRequest } from "next/server";

import { EMAIL_SOURCES, isKnownEmailSource } from "@/lib/email-sources";
import { insertEmailSignup, signupMeta } from "@/lib/email-store";
import { captureEmailCapturedServer } from "@/lib/posthog-server";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** An email payload is tiny — reject anything larger as abuse. */
const MAX_BODY_BYTES = 4 * 1024;
/** RFC 5321 max email length. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Where a signup goes when the caller did not name a surface.
 *
 * This route predates the test and the archived homepage form is still its main
 * caller, so the old value is the right default. It is also the reason the v3
 * tag has to be sent EXPLICITLY by every v3 caller: anything that forgets is
 * filed here, and a row filed here is indistinguishable from a v2 conversion.
 * The vocabulary lives in lib/email-sources.ts.
 */
const DEFAULT_SOURCE = EMAIL_SOURCES.homepage;

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
  /** Whether the submitting browser is marked internal. See lib/posthog-server.ts. */
  isInternal?: boolean;
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

  /*
   * An unrecognised source is not rejected: failing a real person's signup over
   * a bookkeeping mistake is the wrong trade. But it IS logged, because the
   * silent version of this rule is how a whole version's conversions end up
   * filed under the previous version's tag with nothing in the system saying
   * so. A line in the server log is the difference between a bug that surfaces
   * and one that only surfaces months later in a query.
   */
  let source = DEFAULT_SOURCE as string;
  if (typeof body.source === "string" && body.source) {
    if (isKnownEmailSource(body.source)) {
      source = body.source;
    } else {
      console.warn(
        `access-signup: unrecognised source "${body.source}", filing as "${DEFAULT_SOURCE}". ` +
          `Add it to EMAIL_SOURCES in lib/email-sources.ts.`,
      );
    }
  }

  try {
    const { inserted } = await insertEmailSignup({
      email,
      source,
      meta: signupMeta(request.headers),
    });
    // Ad-blocker-proof server-side conversion truth (no PII — source/attribution
    // only). Runs after the durable insert; never throws.
    //
    // Only a genuinely new row counts. Re-submitting an address that is already
    // on the list is not a second conversion, and no client-side guard can
    // catch that case because it spans separate visits.
    if (inserted) {
      await captureEmailCapturedServer(request, source, body.isInternal === true);
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
