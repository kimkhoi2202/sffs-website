// Stateless HMAC crypto for the Smart Fella unlock gate.
//
// Two independent HMAC-signed artifacts live here:
//
// 1. Unlock code ("SF1.<payload>.<sig>") — minted by the APP at
//    smart-fella tier, pasted into the website's unlock form.
// 2. Checkout token ("SFCT1.<payload>.<sig>") — minted by the website's
//    unlock route once a code verifies, and re-verified server-side by the
//    checkout route so the gate can never be bypassed by a client flag.
//
// Both are pure — no DB, no session — so a valid signature IS the proof.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { ProductId } from "./products";

const UNLOCK_PREFIX = "SF1";
const UNLOCK_TIER = "smart-fella" as const;

const CHECKOUT_PREFIX = "SFCT1";
const DEFAULT_CHECKOUT_TTL_SEC = 900;

interface UnlockPayload {
  v: 1;
  sub: string;
  tier: typeof UNLOCK_TIER;
  iat: number;
}

interface CheckoutPayload {
  productId: ProductId;
  exp: number;
}

function toBase64Url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

/** Decodes a base64url segment. Throws on malformed input — callers must catch. */
function fromBase64Url(segment: string): Buffer {
  if (typeof segment !== "string" || segment.length === 0) {
    throw new Error("empty segment");
  }
  // Buffer's base64url decoder is lenient about stray characters, so
  // reject anything outside the base64url alphabet ourselves rather than
  // silently decoding garbage into a shorter-than-expected buffer.
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new Error("invalid base64url segment");
  }
  return Buffer.from(segment, "base64url");
}

function hmac(secret: string, payloadBytes: Buffer): Buffer {
  return createHmac("sha256", secret).update(payloadBytes).digest();
}

/**
 * Constant-time signature comparison. `timingSafeEqual` throws on
 * unequal-length buffers, so we guard that first and fail closed.
 */
function signaturesMatch(provided: Buffer, expected: Buffer): boolean {
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

// ---------------------------------------------------------------------------
// Unlock codes
// ---------------------------------------------------------------------------

/**
 * Signs a Smart Fella unlock code for `sub` (the app-side user identifier).
 * Format: `SF1.<base64url(payload json)>.<base64url(hmacSha256(payload, secret))>`.
 */
export function signUnlockCode(sub: string, secret: string): string {
  const payload: UnlockPayload = {
    v: 1,
    sub,
    tier: UNLOCK_TIER,
    iat: Math.floor(Date.now() / 1000),
  };
  const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = hmac(secret, payloadBytes);
  return `${UNLOCK_PREFIX}.${toBase64Url(payloadBytes)}.${toBase64Url(sig)}`;
}

/**
 * Verifies a Smart Fella unlock code. Never throws — any malformed,
 * tampered, or wrong-secret input resolves to `{ ok: false }`.
 */
export function verifyUnlockCode(
  code: string,
  secret: string,
): { ok: true; sub: string } | { ok: false } {
  try {
    if (typeof code !== "string" || code.length === 0) return { ok: false };

    const parts = code.split(".");
    if (parts.length !== 3) return { ok: false };
    const [prefix, payloadSeg, sigSeg] = parts;
    if (prefix !== UNLOCK_PREFIX) return { ok: false };
    if (!payloadSeg || !sigSeg) return { ok: false };

    const payloadBytes = fromBase64Url(payloadSeg);
    const providedSig = fromBase64Url(sigSeg);
    const expectedSig = hmac(secret, payloadBytes);

    if (!signaturesMatch(providedSig, expectedSig)) return { ok: false };

    const payload = JSON.parse(payloadBytes.toString("utf8")) as Partial<UnlockPayload>;
    if (payload.v !== 1 || payload.tier !== UNLOCK_TIER || typeof payload.sub !== "string") {
      return { ok: false };
    }

    return { ok: true, sub: payload.sub };
  } catch {
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Checkout tokens
// ---------------------------------------------------------------------------

/**
 * Mints a short-lived checkout token binding a checkout attempt to a single
 * `productId`. Format mirrors the unlock code:
 * `SFCT1.<base64url(payload json)>.<base64url(hmacSha256(payload, secret))>`.
 */
export function mintCheckoutToken(
  productId: ProductId,
  secret: string,
  ttlSec: number = DEFAULT_CHECKOUT_TTL_SEC,
): string {
  const payload: CheckoutPayload = {
    productId,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = hmac(secret, payloadBytes);
  return `${CHECKOUT_PREFIX}.${toBase64Url(payloadBytes)}.${toBase64Url(sig)}`;
}

/**
 * Verifies a checkout token: signature must be valid, `exp` must not have
 * passed, and `productId` must match the token's bound product exactly.
 * Never throws.
 */
export function verifyCheckoutToken(
  token: string,
  productId: ProductId,
  secret: string,
): boolean {
  try {
    if (typeof token !== "string" || token.length === 0) return false;

    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [prefix, payloadSeg, sigSeg] = parts;
    if (prefix !== CHECKOUT_PREFIX) return false;
    if (!payloadSeg || !sigSeg) return false;

    const payloadBytes = fromBase64Url(payloadSeg);
    const providedSig = fromBase64Url(sigSeg);
    const expectedSig = hmac(secret, payloadBytes);

    if (!signaturesMatch(providedSig, expectedSig)) return false;

    const payload = JSON.parse(payloadBytes.toString("utf8")) as Partial<CheckoutPayload>;
    if (typeof payload.exp !== "number" || typeof payload.productId !== "string") return false;
    if (payload.productId !== productId) return false;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return false;

    return true;
  } catch {
    return false;
  }
}
