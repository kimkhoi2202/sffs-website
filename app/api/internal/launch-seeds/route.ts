import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  LAUNCH_CAMPAIGN,
  launchClickUrlFor,
  type LaunchVariant,
} from "@/lib/email/campaign-tracking";
import { renderLaunchEmail } from "@/lib/email/launch-email";
import {
  sendProductEmail,
  unsubscribeUrlFor,
} from "@/lib/email/product-email";
import { filterSuppressed } from "@/lib/email/suppression";

export const dynamic = "force-dynamic";

const CONFIRMATION = "send-four-production-seeds";
const VARIANTS: LaunchVariant[] = ["a", "b"];

function authorized(req: Request): boolean {
  const expected = process.env.LAUNCH_SEED_SECRET?.trim();
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

function recipientsFrom(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const recipients = value.map((item) =>
    typeof item === "string" ? item.trim().toLowerCase() : "",
  );
  if (
    recipients.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    new Set(recipients).size !== 2
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
    | { confirmation?: unknown; recipients?: unknown }
    | null;
  const recipients = recipientsFrom(body?.recipients);
  if (body?.confirmation !== CONFIRMATION || !recipients) {
    return NextResponse.json({ ok: false, error: "invalid_seed_manifest" }, { status: 400 });
  }

  // Refuse the entire seed set before the first send if either address is
  // already suppressed. sendProductEmail repeats this check per message.
  const { suppressed } = await filterSuppressed(recipients);
  if (suppressed.length > 0) {
    return NextResponse.json(
      { ok: false, error: "seed_recipient_suppressed", count: suppressed.length },
      { status: 409 },
    );
  }

  const previousSwitch = process.env.PRODUCT_EMAIL_ENABLED;
  process.env.PRODUCT_EMAIL_ENABLED = "1";
  const sent: Array<{ variant: LaunchVariant; id: string }> = [];

  try {
    for (let recipientIndex = 0; recipientIndex < recipients.length; recipientIndex += 1) {
      const to = recipients[recipientIndex];
      for (const variant of VARIANTS) {
        const ordinal = String(recipientIndex + 1).padStart(2, "0");
        const recipientId = `seed_20260822_${ordinal}_${variant}`;
        const rendered = renderLaunchEmail({
          variant,
          ctaUrl: launchClickUrlFor({ variant, recipientId }),
          unsubscribeUrl: unsubscribeUrlFor(to),
        });
        const result = await sendProductEmail({
          to,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          idempotencyKey: `sffs-launch-seed-20260822-${ordinal}-${variant}`,
          campaignTracking: {
            campaign: LAUNCH_CAMPAIGN,
            variant,
            recipientId,
          },
        });

        if (!result.ok) {
          return NextResponse.json(
            {
              ok: false,
              error: "seed_send_failed",
              variant,
              reason: result.reason,
              sent,
            },
            { status: 502 },
          );
        }
        sent.push({ variant, id: result.id });
      }
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
