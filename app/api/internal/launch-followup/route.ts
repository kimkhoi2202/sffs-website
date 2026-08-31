import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { LAUNCH_CAMPAIGN, launchClickUrlFor, type LaunchVariant } from "@/lib/email/campaign-tracking";
import { renderLaunchEmail } from "@/lib/email/launch-email";
import { sendProductEmail, unsubscribeUrlFor } from "@/lib/email/product-email";
import { filterSuppressed } from "@/lib/email/suppression";

export const dynamic = "force-dynamic";

const CONFIRMATION = "send-bounded-games-followup-2026-08-31";
const BLOCKED_DOMAINS = [
  "alphaaiengineering.com",
  "alphaai.engineering",
  "gauntlethq.com",
  "resend.dev",
  "example.com",
  "mailinator.com",
  "dnsink.com",
];
const BLOCKED_EMAILS = new Set([
  "kimkhoi2202@gmail.com",
  "khoilam@stanford.edu",
  "graceyan212@gmail.com",
]);

interface Recipient {
  email: string;
  source: "smart-fella-test-parent" | "smart-fella-test-child";
  createdAt: string;
  variant: LaunchVariant;
  recipientId: string;
  idempotencyKey: string;
}

function authorized(req: Request): boolean {
  const expected = process.env.FOLLOWUP_BATCH_SECRET?.trim();
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseRecipients(value: unknown, action: unknown): Recipient[] | null {
  if (!Array.isArray(value)) return null;
  const requiredCount = action === "preflight" ? 100 : action === "send" ? 10 : 0;
  if (value.length !== requiredCount) return null;

  const recipients: Recipient[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Partial<Recipient>;
    const email = typeof item.email === "string" ? item.email.trim().toLowerCase() : "";
    const domain = email.split("@")[1] ?? "";
    const local = email.split("@")[0] ?? "";
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      BLOCKED_EMAILS.has(email) ||
      BLOCKED_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`)) ||
      /(gauntlet|alphaai|alphaaiengineering|smartfella|fartsmella)/i.test(domain) ||
      /(test|qa|smartfella|fartsmella)/i.test(local) ||
      (item.source !== "smart-fella-test-parent" && item.source !== "smart-fella-test-child") ||
      (item.variant !== "a" && item.variant !== "b") ||
      typeof item.createdAt !== "string" ||
      !/^followup_20260831_[ab]_\d{2}$/.test(item.recipientId ?? "") ||
      !/^sffs_games_followup_20260831_[ab]_\d{2}$/.test(item.idempotencyKey ?? "")
    ) {
      return null;
    }
    recipients.push({ ...item, email } as Recipient);
  }

  if (
    new Set(recipients.map((r) => r.email)).size !== recipients.length ||
    new Set(recipients.map((r) => r.recipientId)).size !== recipients.length ||
    new Set(recipients.map((r) => r.idempotencyKey)).size !== recipients.length ||
    recipients.filter((r) => r.variant === "a").length !== requiredCount / 2 ||
    recipients.filter((r) => r.variant === "b").length !== requiredCount / 2
  ) {
    return null;
  }
  return recipients;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { action?: unknown; confirmation?: unknown; recipients?: unknown }
    | null;
  if (body?.confirmation !== CONFIRMATION) {
    return NextResponse.json({ ok: false, error: "confirmation_mismatch" }, { status: 400 });
  }
  const recipients = parseRecipients(body?.recipients, body?.action);
  if (!recipients) {
    return NextResponse.json({ ok: false, error: "invalid_manifest" }, { status: 400 });
  }

  const { suppressed } = await filterSuppressed(recipients.map((r) => r.email));
  if (body?.action === "preflight") {
    return NextResponse.json(
      { ok: suppressed.length === 0, count: recipients.length, suppressed: suppressed.length },
      { status: suppressed.length === 0 ? 200 : 409, headers: { "cache-control": "no-store" } },
    );
  }
  if (suppressed.length > 0) {
    return NextResponse.json(
      { ok: false, error: "recipient_suppressed", count: suppressed.length },
      { status: 409 },
    );
  }

  const previousSwitch = process.env.PRODUCT_EMAIL_ENABLED;
  process.env.PRODUCT_EMAIL_ENABLED = "1";
  const sent: Array<{ recipientId: string; variant: LaunchVariant; id: string }> = [];
  try {
    for (const recipient of recipients) {
      const rendered = renderLaunchEmail({
        variant: recipient.variant,
        ctaUrl: launchClickUrlFor({ variant: recipient.variant, recipientId: recipient.recipientId }),
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
          { ok: false, error: "send_failed", reason: result.reason, sent },
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
