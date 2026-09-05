import { type NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { LAUNCH_CAMPAIGN } from "@/lib/email/campaign-tracking";
import { captureLaunchEmailProviderEvent } from "@/lib/posthog-server";

const OPAQUE_ID = /^[A-Za-z0-9_-]{8,80}$/;
const TRACKED_EVENTS = new Set([
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.failed",
  "email.bounced",
  "email.complained",
  "email.suppressed",
  "email.opened",
  "email.clicked",
]);

interface ResendEvent {
  type?: unknown;
  created_at?: unknown;
  data?: {
    email_id?: unknown;
    tags?: unknown;
  };
}

function stringTags(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (!entries.every(([, item]) => typeof item === "string")) return null;
  return Object.fromEntries(entries) as Record<string, string>;
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  }

  const webhookId = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!webhookId || !timestamp || !signature) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: ResendEvent;
  try {
    event = new Webhook(secret).verify(rawBody, {
      "svix-id": webhookId,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    }) as ResendEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  const tags = stringTags(event.data?.tags);
  const type = typeof event.type === "string" ? event.type : "";
  const createdAt = typeof event.created_at === "string" ? event.created_at : "";
  const emailId = typeof event.data?.email_id === "string" ? event.data.email_id : "";
  const variant = tags?.variant;
  const recipientId = tags?.recipient_id;

  // The same endpoint can safely receive other transactional email events.
  // They are acknowledged but ignored, keeping the launch dataset scoped.
  if (
    !TRACKED_EVENTS.has(type) ||
    (tags?.campaign !== LAUNCH_CAMPAIGN && tags?.campaign !== "app-launch-hybrid-2026-09-05") ||
    (variant !== "a" && variant !== "b") ||
    !recipientId ||
    !OPAQUE_ID.test(recipientId) ||
    !createdAt ||
    !emailId
  ) {
    return NextResponse.json({ ok: true, recorded: false });
  }

  await captureLaunchEmailProviderEvent(req, {
    webhookId,
    type,
    createdAt,
    emailId,
    campaign: tags.campaign,
    variant,
    recipientId,
  });

  return NextResponse.json({ ok: true, recorded: true });
}
