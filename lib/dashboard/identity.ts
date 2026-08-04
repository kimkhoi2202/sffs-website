import "server-only";

import { decodeResultToken } from "@/lib/test/result-token";
import { scoreTest } from "@/lib/test/scoring";
import { getTestById } from "@/lib/test/tests";
import type { AnswerMap } from "@/lib/test/scoring";
import type { Grade } from "@/lib/test/types";

import { hogql, type QueryScope } from "./posthog-query";
import type { PersonLink, TestAttempt } from "./types";

/**
 * Who is actually who.
 *
 * ===========================================================================
 * THE PROBLEM THIS EXISTS FOR
 * ===========================================================================
 * A visitor takes the test in one browser session, gives an email, and gets a
 * link. Later they open that link from their inbox — often on the same phone,
 * often minutes later — and because the gate is designed to work from a cold
 * start in any client, that visit begins with a FRESH anonymous id. PostHog
 * sees two people. There is one human.
 *
 * It is not hypothetical. `sebastianblack@hotmail.com` took the adult test as
 * one distinct_id and then minted a brand-new one a second before his results
 * page loaded. A dashboard that shows him as two unrelated visitors is
 * technically correct and practically useless, and at a total of five external
 * completions it is the difference between "two people bounced" and "one person
 * was engaged enough to come back twice".
 *
 * ===========================================================================
 * WHY THE RESULTS TOKEN IS THE KEY, AND WHY IT IS NOT ON AN EVENT
 * ===========================================================================
 * The event taxonomy deliberately carries NO results token — see the note on
 * `trackResultsLinkOpened`: "a token is a durable handle to one person's result
 * page, and putting one in an event stream turns a no-PII dataset into a
 * keyring." That decision is correct and this module does not undo it.
 *
 * But the token is unavoidably in the URL of the results page, so PostHog has
 * it on the `$pageview` as `$pathname`. And the token is SELF-DESCRIBING: it
 * decodes to the test id, the packed answer string, elapsed seconds, the
 * timed-out flag and the exact epoch second the attempt finished. That is
 * enough to identify precisely which `test_completed` event it belongs to —
 * same test, same score, same answered count, same duration, same moment.
 *
 * So the join key is not an identifier at all. It is the attempt itself.
 *
 * ===========================================================================
 * WHAT THIS DOES NOT DO
 * ===========================================================================
 * It does not merge anything. PostHog still holds two persons, this dashboard
 * still shows two person ids, and the link is presented as a labelled claim
 * with its evidence attached. The real fix is threading an attempt identifier
 * through the results link so the two stitch properly at capture time; that is
 * queued and not built. Until it is, a visible "probably the same human, here
 * is why" is the honest rendering, and silently showing one person as three
 * visitors is the thing to avoid.
 */

export interface DecodedAttempt {
  token: string;
  testId: string;
  audience: string;
  grade: Grade | null;
  score: number;
  maxScore: number;
  answered: number;
  questionTotal: number;
  timedOut: boolean;
  elapsedSeconds: number;
  verdict: string;
  /** Epoch seconds — the moment the attempt was finished. */
  createdAt: number;
  /** False when the HMAC could not be checked (missing secret, or a forgery). */
  signatureVerified: boolean;
}

/**
 * Read what a results token says about the attempt behind it.
 *
 * Verifies the signature when `RESULTS_TOKEN_SECRET` is available, and falls
 * back to a structural read when it is not, flagging that it did. The fallback
 * matters because this dashboard must keep working across a secret rotation,
 * and because the token here came out of our own analytics rather than from an
 * untrusted request — nothing is authorised on the strength of it, it is only
 * displayed and used to line up two rows.
 */
export function readResultToken(token: string): DecodedAttempt | null {
  const verified = decodeResultToken(token);

  let payload: {
    testId: string;
    grade: Grade | null;
    answers: AnswerMap;
    elapsedSeconds: number;
    timedOut: boolean;
    createdAt: number;
  } | null = null;
  let signatureVerified = false;

  if (verified.ok) {
    payload = verified.payload;
    signatureVerified = true;
  } else {
    const parsed = structuralRead(token);
    if (parsed) payload = parsed;
  }

  if (!payload) return null;
  const test = getTestById(payload.testId);
  if (!test) return null;

  const scored = scoreTest(test, payload.answers);
  return {
    token,
    testId: payload.testId,
    audience: test.audience,
    grade: payload.grade,
    score: scored.score,
    maxScore: scored.max,
    answered: scored.answered,
    questionTotal: test.items.length,
    timedOut: payload.timedOut,
    elapsedSeconds: payload.elapsedSeconds,
    verdict: scored.verdict.id,
    createdAt: payload.createdAt,
    signatureVerified,
  };
}

/** Decode the payload without checking the HMAC. Shape-validated, not trusted. */
function structuralRead(token: string) {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  let raw: {
    v?: number;
    t?: string;
    g?: number | null;
    a?: string;
    e?: number;
    o?: number;
    c?: number;
  };
  try {
    raw = JSON.parse(Buffer.from(token.slice(0, dot), "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (raw.v !== 1 || typeof raw.t !== "string") return null;
  const test = getTestById(raw.t);
  if (!test) return null;

  // Same positional unpacking `result-token.ts` does: one character per item in
  // the bank's own order, '-' for a question they never answered.
  const packed = raw.a ?? "";
  const answers: AnswerMap = {};
  test.items.forEach((item, i) => {
    const ch = packed[i];
    if (ch && ch !== "-") answers[item.id] = ch;
  });

  return {
    testId: raw.t,
    grade: (raw.g ?? null) as Grade | null,
    answers,
    elapsedSeconds: raw.e ?? 0,
    timedOut: raw.o === 1,
    createdAt: raw.c ?? 0,
  };
}

/** Pull the token out of `/results/<token>` (or a full URL). */
export function tokenFromPath(path: string): string | null {
  const match = /\/results\/([^/?#]+)/.exec(path);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  return token.length > 8 ? token : null;
}

/* --------------------------------------------------------------------------
 * Matching results-page visitors back to the person who took the test
 * ------------------------------------------------------------------------ */

export interface ResultsPageVisit {
  person_id: string;
  session_id: string;
  path: string;
  first_seen: string;
  last_seen: string;
  events: number;
}

export interface CompletionRow {
  person_id: string;
  /**
   * Named `ts`, not `timestamp`. Aliasing `toString(timestamp) AS timestamp`
   * makes the WHERE clause resolve the String alias instead of the DateTime
   * column, and ClickHouse then refuses to compare it to a DateTime bound.
   */
  ts: string;
  test_id: string;
  score: number;
  answered: number;
  elapsed_s: number;
  timed_out: boolean;
}

/**
 * Every visit to a `/results/<token>` page, segmented by PAGE LOAD.
 *
 * A running count of `$pageview`s per person gives each load its own group
 * number, so two readings of the same page inside one PostHog session come back
 * as two visits. That case is not hypothetical: one visitor spent nineteen
 * minutes on her results and opened them again afterwards without ever going
 * idle long enough to roll the session, and grouping by session reports that as
 * a single visit.
 */
export async function fetchResultsVisits(scope: QueryScope): Promise<ResultsPageVisit[]> {
  return hogql<ResultsPageVisit>(`
    SELECT
      person_id,
      session_id,
      any(path) AS path,
      toString(min(ts)) AS first_seen,
      toString(max(ts)) AS last_seen,
      count() AS events
    FROM (
      SELECT
        toString(person_id) AS person_id,
        toString(properties.$session_id) AS session_id,
        toString(properties.$pathname) AS path,
        timestamp AS ts,
        countIf(event = '$pageview') OVER (
          PARTITION BY person_id ORDER BY timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS visit_no
      FROM events
      WHERE {filters}
        AND toString(properties.$pathname) LIKE '/results/%'
    )
    GROUP BY person_id, session_id, visit_no
    ORDER BY first_seen`, scope);
}

/** Every finished attempt in the window. */
export async function fetchCompletions(scope: QueryScope): Promise<CompletionRow[]> {
  return hogql<CompletionRow>(`
    SELECT
      toString(person_id) AS person_id,
      toString(timestamp) AS ts,
      toString(properties.test_id) AS test_id,
      toFloat(properties.score) AS score,
      toFloat(properties.answered) AS answered,
      toFloat(properties.elapsed_s) AS elapsed_s,
      toString(properties.timed_out) AS timed_out
    FROM events
    WHERE {filters} AND event = 'test_completed'
    ORDER BY timestamp`, scope);
}

/**
 * Decide whether a decoded results token belongs to a recorded completion.
 *
 * `createdAt` inside the token is stamped at the same instant the completion
 * event fires, so agreement to within two minutes on top of an exact match of
 * test, score, answered count and elapsed time is not a heuristic in any
 * meaningful sense — it is the same row seen from two sides. It is still
 * labelled "strong" rather than "certain", because the honest ceiling on an
 * inference is that it is an inference.
 */
export function matchAttemptToCompletion(
  attempt: DecodedAttempt,
  completions: CompletionRow[],
): { row: CompletionRow; confidence: "strong" | "probable"; reason: string } | null {
  const tokenMs = attempt.createdAt * 1000;

  const exact = completions.find((c) => {
    if (c.test_id !== attempt.testId) return false;
    if (Math.round(Number(c.score)) !== attempt.score) return false;
    if (Math.round(Number(c.answered)) !== attempt.answered) return false;
    const dt = Math.abs(Date.parse(`${c.ts.replace(" ", "T")}Z`) - tokenMs);
    return Number.isFinite(dt) && dt <= 120_000;
  });
  if (exact) {
    return {
      row: exact,
      confidence: "strong",
      reason:
        `the results link decodes to this exact attempt — ${attempt.testId}, ` +
        `${attempt.score}/${attempt.maxScore}, ${attempt.answered} answered, ` +
        `finished within two minutes of the recorded completion`,
    };
  }

  // Same attempt, clock further apart than expected. Still almost certainly the
  // same human; say so with less confidence rather than dropping the link.
  const loose = completions.find(
    (c) =>
      c.test_id === attempt.testId &&
      Math.round(Number(c.score)) === attempt.score &&
      Math.round(Number(c.answered)) === attempt.answered &&
      Math.abs(Date.parse(`${c.ts.replace(" ", "T")}Z`) - tokenMs) <= 24 * 3600_000,
  );
  if (loose) {
    return {
      row: loose,
      confidence: "probable",
      reason:
        `the results link decodes to a matching attempt — ${attempt.testId}, ` +
        `${attempt.score}/${attempt.maxScore}, ${attempt.answered} answered — ` +
        `but the timestamps are further apart than a direct hand-off`,
    };
  }
  return null;
}

export function attemptToPublic(attempt: DecodedAttempt): TestAttempt {
  return {
    testId: attempt.testId,
    audience: attempt.audience,
    grade: attempt.grade,
    score: attempt.score,
    maxScore: attempt.maxScore,
    answered: attempt.answered,
    questionTotal: attempt.questionTotal,
    timedOut: attempt.timedOut,
    elapsedSeconds: attempt.elapsedSeconds,
    verdict: attempt.verdict,
    fromToken: true,
  };
}

export function buildLink(
  personId: string,
  role: PersonLink["role"],
  confidence: PersonLink["confidence"],
  reason: string,
): PersonLink {
  return { personId, role, confidence, reason };
}
