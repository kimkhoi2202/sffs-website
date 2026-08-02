/**
 * Create a stored result and hand back its token.
 *
 * POST { testId, answers, elapsedSeconds, timedOut } -> { ok, token }
 *
 * Called the moment a test ends, BEFORE any email is asked for, so the token
 * exists whether or not the player ever hands over an address. That ordering
 * also means the results page is stable from the first instant: nothing about
 * it depends on the email step succeeding.
 *
 * ===========================================================================
 * THE SCORE IS COMPUTED HERE, NOT ACCEPTED FROM THE CLIENT
 * ===========================================================================
 * The body carries the ANSWERS and the server scores them against the same
 * static test data. Accepting a `score` field would mean the stored record was
 * whatever the browser felt like claiming.
 *
 * This is not a strong integrity guarantee and is not pretending to be one: the
 * test data including the answer key is in the client bundle, because the test
 * has to run offline-ish on a phone, so anyone who wants a perfect score can
 * read the keys and post them. What this DOES buy is that the stored record is
 * internally consistent — the score always matches the answers next to it — so
 * the per-band sample described in `TestSubmission` is not quietly poisoned by
 * a bug that sends the wrong number. Cheating a joke test is self-defeating in
 * a way that corrupting our own analytics is not.
 */
import { NextResponse, type NextRequest } from "next/server";

import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { recordResultStats } from "@/lib/test/result-stats";
import { saveResult } from "@/lib/test/result-store";
import { scoreTest, type AnswerMap } from "@/lib/test/scoring";
import { getTestById } from "@/lib/test/tests";
import type { Grade } from "@/lib/test/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 50 answers of a few bytes each, plus overhead. */
const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

interface CreateBody {
  testId?: unknown;
  /** The grade the player picked. Display only; the band drives scoring. */
  grade?: unknown;
  answers?: unknown;
  elapsedSeconds?: unknown;
  timedOut?: unknown;
}

/** Accept only `{ [itemId]: optionId }` with short string values. */
function parseAnswers(value: unknown): AnswerMap | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const out: AnswerMap = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== "string" || key.length > 64) return null;
    if (typeof val !== "string" || val.length > 8) return null;
    out[key] = val;
  }
  return out;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (isRateLimited("test-results-create", ip, {
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
  })) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Give it a minute." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Request too large." }, { status: 413 });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const test = typeof body.testId === "string" ? getTestById(body.testId) : null;
  const answers = parseAnswers(body.answers);
  if (!test || !answers) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const elapsedSeconds =
    typeof body.elapsedSeconds === "number" && Number.isFinite(body.elapsedSeconds)
      ? Math.max(0, Math.min(24 * 60 * 60, Math.round(body.elapsedSeconds)))
      : 0;

  const result = scoreTest(test, answers);

  /*
   * BOTH the selected grade and the band are stored, separately and on purpose.
   *
   *   grade  what the player tapped. The only thing shown back to them: the
   *          results heading, the email subject. Someone who chose 7 is told
   *          they took the Grade 7 test, never "Grade 7 and 8".
   *   band   which items they actually answered. What scoring and any future
   *          cohort comparison group on, because 7 and 8 sat identical items
   *          and belong in one pool.
   *
   * Neither can be derived from the other without losing something, so neither
   * is derived. The grade is validated against the test rather than trusted:
   * a body claiming grade 5 on the grade-7-8 bank is either a bug or a poke,
   * and in both cases the honest record is "no grade".
   */
  const claimed = typeof body.grade === "number" ? body.grade : null;
  const grade =
    claimed !== null && test.grades?.includes(claimed as Grade)
      ? (claimed as Grade)
      : null;

  try {
    const stored = saveResult({
      testId: test.id,
      audience: test.audience,
      band: test.band,
      grade,
      answers,
      score: result.score,
      maxScore: result.max,
      answered: result.answered,
      elapsedSeconds,
      timedOut: body.timedOut === true,
    });

    /*
      The durable half. The token above is stateless and keeps nothing, so this
      is the only record that outlives the request and the only thing a
      per-grade-band percentile could ever be built from.

      Not awaited, and it carries no email address — see lib/test/result-stats.ts
      for why the separation is structural rather than a convention. Blocking
      the response on a statistics write would put latency between finishing a
      timed test and seeing the score, to protect a number nobody is reading yet.
    */
    void recordResultStats({
      testId: test.id,
      band: test.band,
      grade,
      score: result.score,
      maxScore: result.max,
      answered: result.answered,
      elapsedSeconds,
      timedOut: body.timedOut === true,
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, token: stored.token });
  } catch (err) {
    console.error("test-results create error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: "Could not save your results. Try again." },
      { status: 500 },
    );
  }
}
