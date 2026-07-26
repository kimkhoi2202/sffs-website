import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { getStripe, StripeNotConfiguredError } from "@/lib/store/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver.
 *
 * Per the Next docs' "Webhooks" example (node_modules/next/dist/docs/01-app/
 * 01-getting-started/15-route-handlers.md), Route Handlers need no special
 * body-parser config — reading the RAW body via `request.text()` before any
 * JSON parsing is what lets `stripe.webhooks.constructEvent` verify the
 * `stripe-signature` HMAC against the exact bytes Stripe signed. Parsing with
 * `request.json()` first would reformat the bytes and break verification.
 *
 * POST (from Stripe) -> 200 { received: true } on a verified event;
 * 400 on a missing/invalid signature or missing webhook secret. No DB in v1 —
 * `checkout.session.completed` orders are just logged.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("store/webhook: STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { received: false, error: "Webhook not configured." },
      { status: 400 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { received: false, error: "Missing signature." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      console.error("store/webhook: STRIPE_SECRET_KEY is not configured.");
      return NextResponse.json(
        { received: false, error: "Webhook not configured." },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Invalid signature.";
    console.error("store/webhook: signature verification failed:", message);
    return NextResponse.json(
      { received: false, error: "Invalid signature." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email ?? session.customer_email ?? null;
    console.log("store order completed:", {
      sessionId: session.id,
      productId: session.metadata?.productId ?? null,
      size: session.metadata?.size ?? null,
      email,
    });
  }

  return NextResponse.json({ received: true });
}
