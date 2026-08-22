import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  LAUNCH_CAMPAIGN,
  launchClickUrlFor,
  type LaunchVariant,
} from "@/lib/email/campaign-tracking";
import { renderLaunchEmail } from "@/lib/email/launch-email";
import { sendProductEmail, unsubscribeUrlFor } from "@/lib/email/product-email";
import { filterSuppressed } from "@/lib/email/suppression";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONFIRMATION = "send-bounded-launch-pilot-2026-08-22";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPAQUE_ID = /^[A-Za-z0-9_-]{8,80}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,128}$/;
const BLOCKED_DOMAINS = new Set([
  "alphaaiengineering.com",
  "gauntlethq.com",
  "resend.dev",
  "example.com",
  "mailinator.com",
  "dnsink.com",
]);
const BLOCKED_EMAILS = new Set([
  "kimkhoi2202@gmail.com",
  "khoilam@stanford.edu",
  "graceyan212@gmail.com",
]);

interface PilotRecipient {
  email: string;
  variant: LaunchVariant;
  recipientId: string;
  idempotencyKey: string;
}

function authorized(req: Request): boolean {
  const expected = process.env.LAUNCH_PILOT_SECRET?.trim();
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

function recipientFrom(value: unknown): PilotRecipient | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const variant = input.variant;
  const recipientId = typeof input.recipientId === "string" ? input.recipientId.trim() : "";
  const idempotencyKey = typeof input.idempotencyKey === "string" ? input.idempotencyKey.trim() : "";
  const [local = "", domain = ""] = email.split("@");
  if (
    !EMAIL.test(email) ||
    (variant !== "a" && variant !== "b") ||
    !OPAQUE_ID.test(recipientId) ||
    !IDEMPOTENCY_KEY.test(idempotencyKey) ||
    BLOCKED_EMAILS.has(email) ||
    BLOCKED_DOMAINS.has(domain) ||
    /(test|qa|smartfella|fartsmella)/i.test(local)
  ) {
    return null;
  }
  return { email, variant, recipientId, idempotencyKey };
}

async function resendApi(path: string, init?: RequestInit): Promise<Response> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "user-agent": "sffs-website-launch-pilot/1.0",
      ...init?.headers,
    },
    cache: "no-store",
  });
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const resource = url.searchParams.get("resource");
  if (resource !== "suppressions" && resource !== "webhooks") {
    return NextResponse.json({ ok: false, error: "invalid_resource" }, { status: 400 });
  }
  const response = await resendApi(`/${resource}`);
  const body = await response.json().catch(() => null);
  return NextResponse.json(
    { ok: response.ok, status: response.status, body },
    { status: response.ok ? 200 : 502, headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });

  if (body.action === "create_webhook") {
    const response = await resendApi("/webhooks", {
      method: "POST",
      body: JSON.stringify({
        endpoint: "https://www.smartfellaorfartsmella.com/api/webhooks/resend",
        events: [
          "email.sent",
          "email.delivered",
          "email.delivery_delayed",
          "email.failed",
          "email.bounced",
          "email.complained",
          "email.suppressed",
          "email.opened",
          "email.clicked",
        ],
      }),
    });
    const result = await response.json().catch(() => null);
    return NextResponse.json(
      { ok: response.ok, status: response.status, body: result },
      { status: response.ok ? 200 : 502, headers: { "cache-control": "no-store" } },
    );
  }

  if (body.action !== "send" || body.confirmation !== CONFIRMATION || !Array.isArray(body.recipients)) {
    return NextResponse.json({ ok: false, error: "invalid_manifest" }, { status: 400 });
  }
  if (body.recipients.length < 1 || body.recipients.length > 10) {
    return NextResponse.json({ ok: false, error: "batch_size" }, { status: 400 });
  }
  const recipients = body.recipients.map(recipientFrom);
  if (recipients.some((item) => item === null)) {
    return NextResponse.json({ ok: false, error: "invalid_recipient" }, { status: 400 });
  }
  const valid = recipients as PilotRecipient[];
  if (
    new Set(valid.map((item) => item.email)).size !== valid.length ||
    new Set(valid.map((item) => item.recipientId)).size !== valid.length ||
    new Set(valid.map((item) => item.idempotencyKey)).size !== valid.length
  ) {
    return NextResponse.json({ ok: false, error: "duplicate_in_batch" }, { status: 400 });
  }

  const { suppressed } = await filterSuppressed(valid.map((item) => item.email));
  if (suppressed.length > 0) {
    return NextResponse.json(
      { ok: false, error: "locally_suppressed", count: suppressed.length },
      { status: 409 },
    );
  }

  const previousSwitch = process.env.PRODUCT_EMAIL_ENABLED;
  process.env.PRODUCT_EMAIL_ENABLED = "1";
  const sent: Array<{ recipientId: string; variant: LaunchVariant; id: string }> = [];
  try {
    for (const recipient of valid) {
      const rendered = renderLaunchEmail({
        variant: recipient.variant,
        ctaUrl: launchClickUrlFor({
          variant: recipient.variant,
          recipientId: recipient.recipientId,
        }),
        unsubscribeUrl: unsubscribeUrlFor(recipient.email),
      });
      const result = await sendProductEmail({
        to: recipient.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        idempotencyKey: recipient.idempotencyKey,
        campaignTracking: {
          campaign: LAUNCH_CAMPAIGN,
          variant: recipient.variant,
          recipientId: recipient.recipientId,
        },
      });
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: "send_failed", recipientId: recipient.recipientId, reason: result.reason, sent },
          { status: 502 },
        );
      }
      sent.push({ recipientId: recipient.recipientId, variant: recipient.variant, id: result.id });
    }
  } finally {
    if (previousSwitch === undefined) delete process.env.PRODUCT_EMAIL_ENABLED;
    else process.env.PRODUCT_EMAIL_ENABLED = previousSwitch;
  }
  return NextResponse.json(
    { ok: true, count: sent.length, sent },
    { headers: { "cache-control": "no-store" } },
  );
}

