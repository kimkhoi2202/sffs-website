import { NextResponse, type NextRequest } from "next/server";

import { insertSurveyResponse } from "@/lib/survey-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A survey answer is tiny — reject anything larger as abuse. */
const MAX_BODY_BYTES = 8 * 1024;
/** RFC 5321 max email length. */
const MAX_EMAIL_LENGTH = 254;
const MAX_OPEN_TEXT_LENGTH = 2000;
const MAX_DISTINCT_ID_LENGTH = 200;

/** The self-reported channels the on-brand survey offers (kept in sync with the
 * client component + the Lambda). */
const ALLOWED_SOURCES = new Set([
  "tiktok",
  "instagram",
  "friend",
  "search",
  "other",
]);

/** Same pragmatic email shape check as the signup route (Aurora dedupes the rest). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Best-effort per-instance abuse speed-bump, keyed by client IP (see access-signup). */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT_MAX;
}

interface SurveyBody {
  source?: unknown;
  open_text?: unknown;
  email?: unknown;
  distinct_id?: unknown;
}

/**
 * Persist a post-signup attribution answer ("How did you find us?").
 *
 * POST { source, open_text?, email?, distinct_id? } -> validates, then forwards
 * to the keyless proxy (AWS Lambda -> Aurora `survey_responses`). The client ALSO
 * fires the `attribution_survey_answered` PostHog event directly (source only, no
 * PII), so attribution shows in funnels regardless of this durable write.
 *
 * PRIVACY: the email (optional, to tie the answer to the signup) is forwarded to
 * Aurora only; it is never sent to PostHog. Never echoes the shared secret or raw
 * errors back to the client.
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

  let body: SurveyBody;
  try {
    body = (await request.json()) as SurveyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const source =
    typeof body.source === "string" ? body.source.trim().toLowerCase() : "";
  if (!ALLOWED_SOURCES.has(source)) {
    return NextResponse.json(
      { ok: false, error: "Please pick one of the options." },
      { status: 400 },
    );
  }

  const openText =
    typeof body.open_text === "string"
      ? body.open_text.trim().slice(0, MAX_OPEN_TEXT_LENGTH) || null
      : null;

  // Optional signup tie. Email is validated + normalized; anything malformed is
  // simply dropped (the answer is still worth storing without it).
  let email: string | null = null;
  if (typeof body.email === "string") {
    const candidate = body.email.trim().toLowerCase();
    if (candidate && candidate.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(candidate)) {
      email = candidate;
    }
  }

  const distinctId =
    typeof body.distinct_id === "string"
      ? body.distinct_id.trim().slice(0, MAX_DISTINCT_ID_LENGTH) || null
      : null;

  const meta = {
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  };

  try {
    await insertSurveyResponse({ source, openText, email, distinctId, meta });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("attribution-survey route error:", message);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
