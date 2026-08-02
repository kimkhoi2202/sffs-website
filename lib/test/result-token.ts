/*
 * NOT `server-only`, unlike ./result-store.ts which wraps it, and for the same
 * reason ../email-store-mode.ts is not: that import throws the moment plain
 * Node loads the file, which would put the one part of this worth asserting
 * against a truth table out of reach of a test. See
 * scripts/verify-result-token.mjs.
 *
 * Nothing is given up by it. This module imports `node:crypto`, so an
 * accidental client import is a build failure with or without the marker, and
 * the secret it reads has no NEXT_PUBLIC prefix and therefore cannot reach a
 * browser bundle in the first place. The seam that callers use IS `server-only`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { getTestById } from "./tests";
import type { AnswerMap } from "./scoring";
import type { Grade } from "./types";

/**
 * A finished test, encoded into the link itself and signed.
 *
 * ===========================================================================
 * WHY THE RESULT IS IN THE TOKEN AND NOT IN A STORE
 * ===========================================================================
 * It used to be in a store, and the store was a JSON file with an in-memory
 * fallback. On Vercel the filesystem is read-only, so every finished test lived
 * in one instance's memory. The link worked when it happened to land back on
 * that instance and said "these results have gone" when it did not, which is
 * the normal case for somebody opening an email an hour later on their phone.
 * The failure was invisible to every test that reused a warm connection, and
 * only showed up when a genuinely separate browser context followed the link.
 *
 * A stateless token removes the failure by construction. There is no store to
 * be missing from: any instance can verify any link, forever, with no shared
 * state and nothing to provision.
 *
 * ===========================================================================
 * WHY PUTTING THE SCORE IN A URL IS SAFE HERE AND WAS NOT BEFORE
 * ===========================================================================
 * The original note in the old store rejected this, and it was right about the
 * version it was rejecting: `?score=12` is a URL people edit, and the first
 * person to notice it becomes the second person to post `?score=50`.
 *
 * A SIGNATURE is what changes that. The payload is opaque base64 and carries a
 * keyed HMAC, so editing any byte of it invalidates the whole token and the
 * page refuses it. Forging one needs the secret. What remains true is that the
 * token is not encrypted: anyone holding the link can decode what is in it.
 * That is acceptable because the holder is the person the result belongs to,
 * and it contains nothing they do not already know. It carries NO EMAIL
 * ADDRESS and nothing else identifying — see the payload below.
 *
 * ===========================================================================
 * WHAT IS IN IT, AND WHY IT IS THIS SMALL
 * ===========================================================================
 * Only the answers, not the scoring. The bank is on the server, so the test id
 * plus one character per item is enough to rebuild everything the results page
 * shows: the score, the per-domain breakdown, the verdict, and the
 * question-by-question list. Storing the derived numbers instead would be
 * bigger AND would let a stale token disagree with the current bank.
 *
 * One character per item is what keeps this comfortably inside a URL. A fifty
 * item adult attempt is a fifty character string; the whole token lands around
 * 210 characters, against roughly 800 for a naive JSON answer map.
 */

/** Bump when the payload shape changes in a way old tokens cannot satisfy. */
const VERSION = 1;

/**
 * Twelve months, matching what the privacy page says about how long a result is
 * kept, and matching the old store's TTL. The reasoning for it being this long
 * rather than the reflexive 24 hours: the whole point of mailing someone a link
 * is that they come back to it, and "your results have expired" for a score
 * somebody was proud of is a bad moment we would have chosen to build.
 */
export const RESULT_TTL_SECONDS = 365 * 24 * 60 * 60;

/** Stands in for a question they never answered. */
const SKIPPED = "-";

export interface ResultTokenPayload {
  testId: string;
  grade: Grade | null;
  answers: AnswerMap;
  elapsedSeconds: number;
  timedOut: boolean;
  /** Epoch seconds. */
  createdAt: number;
}

/* -------------------------------------------------------------------------
 * The secret
 * ----------------------------------------------------------------------- */

/**
 * Used only when this is NOT a production deployment, so a fresh clone can run
 * the flow end to end without anyone having to be handed a secret first.
 *
 * It is a constant and it is in the repository, which is exactly why
 * production refuses to use it: `secretKey()` throws rather than falling back
 * when VERCEL_ENV is production. A signing key that silently degrades to a
 * public value is worse than one that is missing, because nothing looks wrong.
 */
const DEV_SECRET = "sffs-development-only-results-signing-key";

let warnedAboutDevSecret = false;

function secretKey(): string {
  const configured = process.env.RESULTS_TOKEN_SECRET?.trim();
  if (configured) return configured;

  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "RESULTS_TOKEN_SECRET is not set. Results links cannot be signed on a " +
        "production deployment; refusing to fall back to the development key.",
    );
  }

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn(
      "[result-token] RESULTS_TOKEN_SECRET is not set. Using the development " +
        "key, which is public. Links signed now will not verify in production.",
    );
  }
  return DEV_SECRET;
}

/* -------------------------------------------------------------------------
 * Encoding
 * ----------------------------------------------------------------------- */

const b64url = (buf: Buffer | string): string =>
  Buffer.from(buf as never).toString("base64url");

function sign(body: string): string {
  return createHmac("sha256", secretKey()).update(body).digest("base64url");
}

/**
 * Answers as one character per item, in the bank's own order.
 *
 * Positional rather than keyed, because the key IS the position once the test
 * id is known, and repeating fifty item ids in a URL to say what the server
 * already knows is most of the payload.
 */
function packAnswers(testId: string, answers: AnswerMap): string {
  const test = getTestById(testId);
  if (!test) return "";
  return test.items
    .map((item) => {
      const picked = answers[item.id];
      // Option ids are single characters (a/b/c/d/e). Anything else is a
      // corrupt answer map and is safer read as a skip than as a wrong guess.
      return picked && picked.length === 1 ? picked : SKIPPED;
    })
    .join("");
}

function unpackAnswers(testId: string, packed: string): AnswerMap {
  const test = getTestById(testId);
  if (!test) return {};
  const answers: AnswerMap = {};
  test.items.forEach((item, i) => {
    const ch = packed[i];
    if (ch && ch !== SKIPPED) answers[item.id] = ch;
  });
  return answers;
}

/**
 * Build a signed token for a finished attempt.
 *
 * Short keys throughout. They are read by exactly one function and they are the
 * difference between a link that fits in a mail client's preview and one that
 * wraps onto three lines.
 */
export function encodeResultToken(payload: ResultTokenPayload): string {
  const body = b64url(
    JSON.stringify({
      v: VERSION,
      t: payload.testId,
      g: payload.grade,
      a: packAnswers(payload.testId, payload.answers),
      e: Math.max(0, Math.round(payload.elapsedSeconds)),
      o: payload.timedOut ? 1 : 0,
      c: payload.createdAt,
      // Expiry is INSIDE the signature. Outside it, it is a suggestion.
      x: payload.createdAt + RESULT_TTL_SECONDS,
    }),
  );
  return `${body}.${sign(body)}`;
}

/* -------------------------------------------------------------------------
 * Decoding
 * ----------------------------------------------------------------------- */

/**
 * Why a token was refused. The results page deliberately shows the SAME message
 * for every one of these, because a visitor can do nothing differently about
 * any of them and telling a forger which byte they got wrong is free help. The
 * distinction exists for logs and for tests.
 */
export type ResultTokenError = "malformed" | "bad_signature" | "expired" | "unknown_test";

export type DecodeResult =
  | { ok: true; payload: ResultTokenPayload }
  | { ok: false; reason: ResultTokenError };

export function decodeResultToken(token: string): DecodeResult {
  if (typeof token !== "string" || token.length < 8 || token.length > 4096) {
    return { ok: false, reason: "malformed" };
  }

  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };
  const body = token.slice(0, dot);
  const provided = token.slice(dot + 1);

  /*
    CONSTANT TIME, and length-checked first because timingSafeEqual throws on a
    length mismatch rather than returning false. Comparing with === would leak
    how many leading bytes of a guess were right, which is the one thing that
    turns an unforgeable signature into a forgeable one given enough attempts.
  */
  let expected: string;
  try {
    expected = sign(body);
  } catch {
    // Missing secret in production. Nothing verifies; refuse everything.
    return { ok: false, reason: "bad_signature" };
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  let raw: {
    v?: number;
    t?: string;
    g?: number | null;
    a?: string;
    e?: number;
    o?: number;
    c?: number;
    x?: number;
  };
  try {
    raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (raw.v !== VERSION || typeof raw.t !== "string" || typeof raw.x !== "number") {
    return { ok: false, reason: "malformed" };
  }
  if (Math.floor(Date.now() / 1000) > raw.x) return { ok: false, reason: "expired" };
  if (!getTestById(raw.t)) return { ok: false, reason: "unknown_test" };

  return {
    ok: true,
    payload: {
      testId: raw.t,
      grade: (raw.g ?? null) as Grade | null,
      answers: unpackAnswers(raw.t, raw.a ?? ""),
      elapsedSeconds: raw.e ?? 0,
      timedOut: raw.o === 1,
      createdAt: raw.c ?? 0,
    },
  };
}
