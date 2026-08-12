/*
 * NOT `server-only`, for the same reason lib/test/result-token.ts is not: that
 * import throws the moment plain Node loads the file, which would put the part
 * worth asserting against a truth table out of reach of a test. See
 * scripts/verify-unsubscribe.mjs.
 *
 * Nothing is given up by it. This module imports `node:crypto`, so an
 * accidental client import is a build failure with or without the marker, and
 * the secret it reads has no NEXT_PUBLIC prefix and therefore cannot reach a
 * browser bundle.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The unsubscribe token: an address, signed, in a link.
 *
 * ===========================================================================
 * WHY A TOKEN AND NOT ?email=someone@example.com
 * ===========================================================================
 * Three separate problems with the raw address, and the token closes all of
 * them at once.
 *
 *   IT IS AN OPEN UNSUBSCRIBE ENDPOINT. Anyone who can guess an address can
 *   unsubscribe a stranger. Not catastrophic, but it is a defacement primitive
 *   and there is no reason to ship one.
 *   IT LEAKS THE ADDRESS. A URL goes into browser history, the Referer header,
 *   server logs, and any analytics that records the page. A plain address in a
 *   query string is personal data written to five places nobody audits.
 *   IT CANNOT BE SCOPED. A signed payload can carry a version and a purpose,
 *   so a token minted for unsubscribing cannot be replayed anywhere else.
 *
 * This deliberately mirrors lib/test/result-token.ts rather than inventing a
 * second scheme: same HMAC-SHA256, same base64url body-and-signature shape,
 * same constant-time compare. Two signing schemes in one codebase is one more
 * than anybody can keep correct.
 *
 * ===========================================================================
 * ENCODED, NOT ENCRYPTED, AND WHY THAT IS A BIGGER DEAL HERE
 * ===========================================================================
 * Like the results token, the payload is readable by anyone holding the link.
 * Unlike the results token, what it decodes to IS an email address, so "who
 * holds the link" matters more. The holder is the person whose address it is,
 * reading their own inbox, which is the same trust boundary as the results
 * link. What must not happen is the token reaching a THIRD PARTY, which is
 * exactly what happened to the results token through gtag in August 2026.
 *
 * So the route that receives this is treated as radioactive by the analytics
 * layer: `/unsubscribe` is a silent route in lib/analytics/events.ts (every
 * event is dropped, not merely scrubbed) and a deferred route in
 * lib/analytics/google-tag.ts (the tag never boots). Both are asserted in
 * scripts/verify-unsubscribe.mjs, because the last time this was left to
 * reasoning rather than a test it was wrong in production for a fortnight.
 *
 * ===========================================================================
 * THERE IS NO EXPIRY, ON PURPOSE
 * ===========================================================================
 * The results token expires at twelve months because the result it points at
 * is deleted then. An unsubscribe link must work forever: people archive mail
 * and come back to it, and "your unsubscribe link has expired" is the single
 * most user-hostile sentence in email. A stale token unsubscribes an address
 * that already asked to be left alone, which is harmless and idempotent.
 */

/** Bumped if the payload shape ever changes, so old links stay decodable. */
const VERSION = 1;

/**
 * Namespaces the signature. A token minted here cannot be replayed against any
 * other signed surface even if the two ever shared a secret by mistake, because
 * the purpose string is inside the signed body.
 */
const PURPOSE = "unsub";

const DEV_SECRET = "sffs-development-only-unsubscribe-signing-key";

/**
 * Falls back to a development key off production and REFUSES on it, matching
 * result-token.ts. A production deploy that quietly signed with a well-known
 * constant would let anybody mint a token for any address.
 */
function secretKey(): string {
  const configured = process.env.UNSUBSCRIBE_TOKEN_SECRET?.trim();
  if (configured) return configured;

  // Reuse the results secret rather than fail, if it is the only one set. The
  // purpose string above keeps the two token families apart, so sharing the key
  // is safe, and one fewer environment variable to forget is worth more than
  // the theoretical separation.
  const shared = process.env.RESULTS_TOKEN_SECRET?.trim();
  if (shared) return shared;

  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "UNSUBSCRIBE_TOKEN_SECRET (or RESULTS_TOKEN_SECRET) is not set. " +
        "Unsubscribe links cannot be signed on a production deployment.",
    );
  }
  return DEV_SECRET;
}

const b64url = (value: Buffer | string): string =>
  Buffer.isBuffer(value)
    ? value.toString("base64url")
    : Buffer.from(value, "utf8").toString("base64url");

function sign(body: string): string {
  return createHmac("sha256", secretKey()).update(body).digest("base64url");
}

interface Payload {
  v: number;
  p: string;
  /** The address, already lowercased and trimmed by the minter. */
  e: string;
}

/**
 * Mint the token for an address. Lowercased and trimmed here so a token minted
 * from "  Foo@Example.com " and one minted from "foo@example.com" are the same
 * token, and so the address that comes back out matches the key the suppression
 * table is stored under.
 */
export function encodeUnsubscribeToken(email: string): string {
  const payload: Payload = {
    v: VERSION,
    p: PURPOSE,
    e: email.trim().toLowerCase(),
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export type DecodeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "malformed" | "bad_signature" | "bad_payload" };

/**
 * Verify a token and return the address inside it.
 *
 * Never throws on bad input: this is fed straight from a URL, so every failure
 * mode here is a normal Wednesday rather than an exception. The route turns any
 * failure into the same generic page, so the response cannot be used to tell a
 * forged token from a corrupted one.
 */
export function decodeUnsubscribeToken(token: string): DecodeResult {
  if (typeof token !== "string" || !token) return { ok: false, reason: "malformed" };

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };

  const body = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(body);

  /*
    CONSTANT TIME, and length-checked first because timingSafeEqual throws on a
    length mismatch rather than returning false. Same shape as
    lib/test/result-token.ts.
  */
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_payload" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, reason: "bad_payload" };
  }
  const payload = parsed as Partial<Payload>;
  if (payload.v !== VERSION || payload.p !== PURPOSE) {
    return { ok: false, reason: "bad_payload" };
  }
  if (typeof payload.e !== "string" || !payload.e.includes("@")) {
    return { ok: false, reason: "bad_payload" };
  }

  return { ok: true, email: payload.e };
}
