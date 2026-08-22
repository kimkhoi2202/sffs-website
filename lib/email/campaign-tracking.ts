/*
 * Pure Node module so the token truth table can be exercised without loading
 * Next.js. The payload carries an opaque list identifier, never an address.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { CANONICAL_ORIGIN } from "../site-url";

export const LAUNCH_CAMPAIGN = "app-launch-2026-08";
export const LAUNCH_LINK_ID = "app-store";

export type LaunchVariant = "a" | "b";

/** Apple campaign links created in App Store Connect on August 21, 2026. */
export const APP_STORE_CAMPAIGN_URLS: Record<LaunchVariant, string> = {
  a: "https://apps.apple.com/app/apple-store/id6794045991?pt=127639550&ct=SFFS%20Email%20A%20Aug%202026&mt=8",
  b: "https://apps.apple.com/app/apple-store/id6794045991?pt=127639550&ct=SFFS%20Email%20B%20Aug%202026&mt=8",
};

const VERSION = 1;
const PURPOSE = "launch-click";
const DEV_SECRET = "sffs-development-only-launch-tracking-key";
const OPAQUE_ID = /^[A-Za-z0-9_-]{8,80}$/;
const LINK_ID = /^[a-z0-9-]{2,40}$/;

function secretKey(): string {
  for (const value of [
    process.env.EMAIL_TRACKING_TOKEN_SECRET,
    process.env.UNSUBSCRIBE_TOKEN_SECRET,
    process.env.RESULTS_TOKEN_SECRET,
  ]) {
    const configured = value?.trim();
    if (configured) return configured;
  }

  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "EMAIL_TRACKING_TOKEN_SECRET, UNSUBSCRIBE_TOKEN_SECRET, or " +
        "RESULTS_TOKEN_SECRET must be set before launch links can be signed.",
    );
  }
  return DEV_SECRET;
}

interface Payload {
  v: number;
  p: string;
  c: string;
  x: LaunchVariant;
  r: string;
  l: string;
}

function sign(body: string): string {
  return createHmac("sha256", secretKey()).update(body).digest("base64url");
}

export function encodeLaunchClickToken(input: {
  variant: LaunchVariant;
  recipientId: string;
  linkId?: string;
}): string {
  const recipientId = input.recipientId.trim();
  const linkId = input.linkId ?? LAUNCH_LINK_ID;
  if (!OPAQUE_ID.test(recipientId)) {
    throw new Error("recipientId must be an opaque 8-80 character identifier");
  }
  if (!LINK_ID.test(linkId)) {
    throw new Error("linkId must contain only lowercase letters, numbers, or hyphens");
  }

  const payload: Payload = {
    v: VERSION,
    p: PURPOSE,
    c: LAUNCH_CAMPAIGN,
    x: input.variant,
    r: recipientId,
    l: linkId,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export type LaunchClickDecodeResult =
  | {
      ok: true;
      campaign: typeof LAUNCH_CAMPAIGN;
      variant: LaunchVariant;
      recipientId: string;
      linkId: string;
    }
  | { ok: false; reason: "malformed" | "bad_signature" | "bad_payload" };

export function decodeLaunchClickToken(token: string): LaunchClickDecodeResult {
  if (!token) return { ok: false, reason: "malformed" };
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };

  const body = token.slice(0, dot);
  const expected = Buffer.from(sign(body));
  const supplied = Buffer.from(token.slice(dot + 1));
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return { ok: false, reason: "bad_signature" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_payload" };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, reason: "bad_payload" };

  const payload = parsed as Partial<Payload>;
  if (
    payload.v !== VERSION ||
    payload.p !== PURPOSE ||
    payload.c !== LAUNCH_CAMPAIGN ||
    (payload.x !== "a" && payload.x !== "b") ||
    typeof payload.r !== "string" ||
    !OPAQUE_ID.test(payload.r) ||
    typeof payload.l !== "string" ||
    !LINK_ID.test(payload.l)
  ) {
    return { ok: false, reason: "bad_payload" };
  }

  return {
    ok: true,
    campaign: LAUNCH_CAMPAIGN,
    variant: payload.x,
    recipientId: payload.r,
    linkId: payload.l,
  };
}

export function launchClickUrlFor(input: {
  variant: LaunchVariant;
  recipientId: string;
}): string {
  const token = encodeLaunchClickToken(input);
  return `${CANONICAL_ORIGIN}/go/app?t=${encodeURIComponent(token)}`;
}
