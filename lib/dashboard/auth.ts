import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The gate on /dashboard.
 *
 * ===========================================================================
 * WHAT THIS PROTECTS AND WHAT IT DOES NOT
 * ===========================================================================
 * The Hermes dashboard is deliberately public and that is fine, because it
 * exposes nothing about visitors. This one is the opposite: it shows individual
 * people's journeys, their city, their device, their score, and — via the
 * signups warehouse table — their email address. An unauthenticated page here
 * would be a privacy incident waiting for someone to guess a six-letter path.
 *
 * So: ONE SHARED PASSPHRASE, held in `DASHBOARD_PASSWORD`, exchanged once for
 * an HMAC-signed, httpOnly, Secure, SameSite=Lax cookie that expires in 30
 * days. Every page render and every data call verifies the cookie server-side.
 *
 * WHAT IT DOES NOT PROTECT AGAINST, stated plainly rather than implied:
 *   • It is a SHARED secret with no per-person identity. Anyone who has it is
 *     indistinguishable from anyone else who has it, there is no audit trail of
 *     who looked, and revoking one person means rotating for everyone.
 *   • It does not survive the passphrase being pasted into a chat, a screenshot
 *     or a synced clipboard. That is the realistic way this leaks, not a break
 *     of the cookie.
 *   • Login attempts are rate limited PER SERVERLESS INSTANCE only (see
 *     lib/rate-limit.ts), so a determined attacker with many concurrent
 *     connections gets more attempts than the number suggests. A long random
 *     passphrase, not the limiter, is what makes guessing hopeless.
 *   • It is not 2FA, and it does not bind the session to an IP or device, so a
 *     stolen cookie works until it expires.
 *
 * If any of that becomes unacceptable the upgrade is Vercel's deployment
 * protection or a real IdP in front of the route; nothing here would need to
 * change except deleting this file.
 *
 * FAIL CLOSED. With no `DASHBOARD_PASSWORD` configured, `isUnconfigured()` is
 * true and the route refuses to serve rather than defaulting to open. A
 * dashboard that silently becomes public when an env var goes missing is the
 * exact failure this is meant to prevent.
 */

const COOKIE = "sffs_dash";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function secret(): string | null {
  const configured = process.env.DASHBOARD_PASSWORD?.trim();
  return configured && configured.length > 0 ? configured : null;
}

export function isUnconfigured(): boolean {
  return secret() === null;
}

/**
 * The cookie is `<expiresAtMs>.<hmac>`, keyed by the passphrase itself.
 *
 * Deriving the signing key from the passphrase rather than adding a second env
 * var means rotating the passphrase invalidates every outstanding session for
 * free, which is what you want the moment you rotate it at all.
 */
function sign(expiresAt: number, key: string): string {
  return createHmac("sha256", `sffs-dashboard-session:${key}`)
    .update(String(expiresAt))
    .digest("base64url");
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on a length mismatch, and comparing lengths first
  // leaks only the length, which is not the secret.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function passwordMatches(attempt: unknown): boolean {
  const key = secret();
  if (!key || typeof attempt !== "string") return false;
  return constantTimeEquals(attempt, key);
}

export function mintSessionCookie(): { name: string; value: string; maxAge: number } {
  const key = secret();
  if (!key) throw new Error("DASHBOARD_PASSWORD is not configured");
  const expiresAt = Date.now() + TTL_MS;
  return {
    name: COOKIE,
    value: `${expiresAt}.${sign(expiresAt, key)}`,
    maxAge: Math.floor(TTL_MS / 1000),
  };
}

export const SESSION_COOKIE_NAME = COOKIE;

export function verifySessionValue(raw: string | undefined): boolean {
  const key = secret();
  if (!key || !raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return false;
  const expiresAt = Number(raw.slice(0, dot));
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  return constantTimeEquals(raw.slice(dot + 1), sign(expiresAt, key));
}

/** Whether the caller is signed in. Reads the request's cookie jar. */
export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionValue(jar.get(COOKIE)?.value);
}
