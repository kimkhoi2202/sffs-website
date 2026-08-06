/**
 * Where a finished test goes so a link in an email can render it later.
 *
 * ===========================================================================
 * THERE IS NO LONGER A STORE. THE TOKEN IS THE RECORD.
 * ===========================================================================
 * This file used to hold a JSON file with an in-memory fallback, and its own
 * docstring admitted the fallback "does not work across instances". On Vercel
 * the filesystem is read-only, so that fallback was the only path, and every
 * result lived in one instance's memory. The emailed link worked when it landed
 * back on that instance and said "these results have gone" when it did not,
 * which is what happens to a person opening their email later on their phone.
 *
 * It survived testing because every cheap test reuses a warm connection: thirty
 * concurrent requests and ten results created over a minute all resolved. Only
 * opening the link from a genuinely separate browser context reproduced it.
 *
 * The result now travels inside the signed token — see ./result-token.ts for
 * the format and for why signing makes a score in a URL safe. Any instance can
 * verify any link with no shared state, so the failure cannot recur.
 *
 * THIS FILE IS KEPT as the seam it was designed to be. The old note said
 * swapping the backing store "means rewriting this file and nothing else", and
 * that turned out to be true: the four functions below have the same shapes
 * they had, and the routes and the results page were almost untouched.
 *
 * ===========================================================================
 * WHAT IS DELIBERATELY NOT IN A RECORD
 * ===========================================================================
 * THE EMAIL ADDRESS, exactly as before. A record holds a test id, a grade, the
 * answers and a couple of counters. The address the results were sent to goes
 * to Aurora through the signup path and stops there; the only place the two
 * ever meet is inside the request that sends the mail. A stolen token leaks a
 * score and nothing else, which is the right blast radius for a joke test.
 */
import "server-only";

import {
  decodeResultToken,
  encodeResultToken,
  RESULT_TTL_SECONDS,
  type ResultTokenError,
} from "./result-token";
import { scoreTest, type AnswerMap } from "./scoring";
import { getTestById } from "./tests";
import type { Audience, Grade, GradeBand } from "./types";

/** Twelve months. Lives in the signature; see ./result-token.ts. */
export const RESULT_TTL_MS = RESULT_TTL_SECONDS * 1000;

/**
 * Total emails that may ever be sent for one result.
 *
 * BEST EFFORT NOW, AND HONESTLY SO. This used to be written next to the record
 * and therefore held across restarts and instances. A stateless token has
 * nowhere to keep a counter that changes after it is signed, so the cap is
 * per-instance and resets when one recycles.
 *
 * That is an acceptable trade rather than a hole, because this was never the
 * real defence. The thing standing between a stranger and our Resend account is
 * the per-IP limiter in lib/rate-limit.ts, which is unchanged; this cap only
 * ever stopped one person mashing a button on one result. Making it durable
 * again would mean bringing back the shared store whose absence is the entire
 * point of this change, in order to protect against something the IP limiter
 * already covers.
 */
export const MAX_SENDS_PER_RESULT = 5;

export interface StoredResult {
  token: string;
  testId: string;
  audience: Audience;
  band: GradeBand;
  grade: Grade | null;
  /** item id -> chosen option id. Re-scored on read so the page shows a breakdown. */
  answers: AnswerMap;
  score: number;
  maxScore: number;
  answered: number;
  elapsedSeconds: number;
  timedOut: boolean;
  /** Epoch ms. */
  createdAt: number;
  /** How many emails have gone out for this result, on this instance. */
  sendCount: number;
}

/* -------------------------------------------------------------------------
 * Writing
 * ----------------------------------------------------------------------- */

/**
 * Sign a finished attempt into a token.
 *
 * Takes the derived numbers (score, maxScore, answered) and does not encode
 * them: they are recomputed from the answers on read, so a token cannot carry a
 * score that disagrees with the bank it points at. They stay in the signature
 * for the caller's convenience, since the route already has them and wants them
 * back for the response and for analytics.
 */
export function saveResult(
  record: Omit<StoredResult, "token" | "createdAt" | "sendCount">,
): StoredResult {
  const createdAt = Date.now();
  const token = encodeResultToken({
    testId: record.testId,
    grade: record.grade,
    answers: record.answers,
    elapsedSeconds: record.elapsedSeconds,
    timedOut: record.timedOut,
    createdAt: Math.floor(createdAt / 1000),
  });
  return { ...record, token, createdAt, sendCount: sendCountFor(token) };
}

/* -------------------------------------------------------------------------
 * Reading
 * ----------------------------------------------------------------------- */

/**
 * Null for "never existed", "edited by hand" and "expired" alike. The caller
 * cannot tell them apart and should not: all three mean the same thing to a
 * visitor, and naming which one it was tells a forger which byte to change.
 * The reason is logged server-side instead.
 */
export function getResult(token: string): StoredResult | null {
  const decoded = decodeResultToken(token);
  if (!decoded.ok) {
    logRefusal(decoded.reason);
    return null;
  }

  const { payload } = decoded;
  const test = getTestById(payload.testId);
  if (!test) return null;

  // Re-scored on read, deliberately. The token carries what the player did, not
  // what we concluded about it, so the page always reflects the current bank.
  const scored = scoreTest(test, payload.answers);

  return {
    token,
    testId: test.id,
    audience: test.audience,
    band: test.band,
    grade: payload.grade,
    answers: payload.answers,
    score: scored.score,
    maxScore: scored.max,
    answered: scored.answered,
    elapsedSeconds: payload.elapsedSeconds,
    timedOut: payload.timedOut,
    createdAt: payload.createdAt * 1000,
    sendCount: sendCountFor(token),
  };
}

/** Rate-limited so a scripted attack cannot turn the log into the disk bill. */
let lastRefusalLoggedAt = 0;
function logRefusal(reason: ResultTokenError): void {
  const now = Date.now();
  if (now - lastRefusalLoggedAt < 10_000) return;
  lastRefusalLoggedAt = now;
  console.warn(`[result-token] refused a results link: ${reason}`);
}

/* -------------------------------------------------------------------------
 * The send counter
 * ----------------------------------------------------------------------- */

/**
 * Per-instance, and bounded so a long-lived instance cannot grow this without
 * limit. Keyed by the token's signature rather than the whole token, which is
 * the same identity in a fraction of the memory.
 */
const sends = new Map<string, number>();
const MAX_TRACKED = 5_000;

const keyFor = (token: string) => token.slice(token.lastIndexOf(".") + 1);

function sendCountFor(token: string): number {
  return sends.get(keyFor(token)) ?? 0;
}

/**
 * Count a send against a result. Returns the new count, or null when the cap
 * has already been reached on this instance.
 */
export function recordSend(token: string): number | null {
  const key = keyFor(token);
  const current = sends.get(key) ?? 0;
  if (current >= MAX_SENDS_PER_RESULT) return null;

  // Cheapest possible eviction: drop the oldest insertion, which Map iterates
  // first. An LRU would be more correct and this is a counter for a five-send
  // cap, not a cache anything depends on.
  if (!sends.has(key) && sends.size >= MAX_TRACKED) {
    const oldest = sends.keys().next().value;
    if (oldest !== undefined) sends.delete(oldest);
  }

  const next = current + 1;
  sends.set(key, next);
  return next;
}

/* -------------------------------------------------------------------------
 * The duplicate window
 * ----------------------------------------------------------------------- */

/**
 * How long one address stays claimed against one result.
 *
 * ===========================================================================
 * A SECOND COPY NOBODY DECIDED TO ASK FOR IS STILL A SECOND COPY
 * ===========================================================================
 * The cap above answers "how many of these will we ever send". This answers a
 * different question: is the send in front of us the one we just did? Someone
 * got the same results twice, three seconds apart, because they pressed "Send
 * it again" two and a half seconds after the confirmation appeared — it was
 * the loudest control on that card, and they took it for the next step. The
 * card has since been rebalanced (see the recovery block in
 * components/test/email-gate.tsx), but a button nobody should have to resist
 * is not a guarantee, and this is.
 *
 * A minute, because that is the shortest interval over which "it never
 * arrived" can be a real observation. Mail takes tens of seconds to land, so
 * nobody inside this window has learned anything since the first send; they
 * are tapping, not deciding. Outside it, "Send it again" does what it says.
 *
 * KEYED ON THE ADDRESS AS WELL AS THE RESULT, which is what keeps "Wrong
 * address? Use a different one" working. A typo correction goes to a different
 * mailbox and has to leave immediately — it is the recovery path for somebody
 * looking at a confirmation for mail they are never going to get. Only the
 * same result to the same address is a duplicate.
 *
 * PER-INSTANCE, like the counter above and for the same reason: there is no
 * shared store to keep it in, and not having one is the point of this file.
 * That is weaker than it sounds for the case it is built for, since a second
 * tap seconds after the first lands on the warm instance that served the
 * first, and it is strictly more than the nothing that was here before.
 */
export const SEND_DEDUPE_WINDOW_MS = 60_000;

/** claim key -> epoch ms of the send that took it. */
const claims = new Map<string, number>();

const claimKey = (token: string, addressKey: string) =>
  `${keyFor(token)}:${addressKey}`;

/**
 * Take this result-and-address pair, or refuse because a send already has it.
 *
 * `addressKey` is an OPAQUE HASH of the address, never the address — see
 * hashEmail in the send route, which already computes one for the per-address
 * limiter and passes the same value here. No address may sit in a long-lived
 * map in this process, which is why this file has never held one.
 *
 * SYNCHRONOUS, AND CALLED BEFORE THE PROVIDER. That is the whole mechanism:
 * two requests arriving together must not both read "nothing sent yet" and
 * both go. A check that happens after an await is not a guard, it is a race
 * with a comment on it — which is what the cap above, counted only once the
 * provider answers, has always been.
 */
export function claimSend(token: string, addressKey: string): boolean {
  const key = claimKey(token, addressKey);
  const now = Date.now();

  const claimedAt = claims.get(key);
  if (claimedAt !== undefined && now - claimedAt < SEND_DEDUPE_WINDOW_MS) return false;

  // Same cheap eviction as the counter above, for the same reason.
  if (!claims.has(key) && claims.size >= MAX_TRACKED) {
    const oldest = claims.keys().next().value;
    if (oldest !== undefined) claims.delete(oldest);
  }

  claims.set(key, now);
  return true;
}

/**
 * Give a claim back after a send that did not happen.
 *
 * The failure path tells the person to try again in a moment, so it has to
 * mean it. Without this, one rejection from the provider would lock that
 * address out for a minute and the retry it just invited would do nothing.
 */
export function releaseSend(token: string, addressKey: string): void {
  claims.delete(claimKey(token, addressKey));
}
