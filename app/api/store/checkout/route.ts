import { NextResponse, type NextRequest } from "next/server";

import { getProduct } from "@/lib/store/products";
import { getStripe, StripeNotConfiguredError } from "@/lib/store/stripe";
import { verifyCheckoutToken } from "@/lib/store/unlock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** productId/size/token are all short strings — reject anything larger as abuse. */
const MAX_BODY_BYTES = 4 * 1024;

/** Flat placeholder US shipping rate for v1 (no carrier integration yet). */
const FLAT_SHIPPING_CENTS = 500;

/**
 * Best-effort in-memory rate limit, keyed by client IP. Serverless instances are
 * ephemeral and not shared, so this is a light abuse speed-bump per instance —
 * not a hard, distributed guarantee. (See access-signup route.)
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistically bound memory so the map can't grow without limit.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > RATE_LIMIT_MAX;
}

interface CheckoutBody {
  productId?: unknown;
  size?: unknown;
  token?: unknown;
}

/**
 * Start a Stripe Checkout Session for a store product.
 *
 * POST { productId, size?, token? } -> 200 { url } | 400/403/503/502 { error }.
 *
 * The gate is server-authoritative: for the gated Smart Fella Tee, `token` is
 * independently re-verified here via `verifyCheckoutToken` — a client-supplied
 * "unlocked" flag is never trusted. Missing Stripe config never crashes the
 * route; it resolves to a clean 503 so preview deploys without keys still work.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Give it a minute and try again." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const product = getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  const size = typeof body.size === "string" ? body.size : undefined;
  const token = typeof body.token === "string" ? body.token : undefined;

  if (product.gated) {
    const secret = process.env.SFFS_UNLOCK_SECRET;
    if (!token || !secret || !verifyCheckoutToken(token, product.id, secret)) {
      return NextResponse.json(
        { error: "Unlock the Smart Fella Tee with your code first." },
        { status: 403 },
      );
    }
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: product.priceCents,
            product_data: { name: product.name },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Standard shipping",
            fixed_amount: { amount: FLAT_SHIPPING_CENTS, currency: "usd" },
          },
        },
      ],
      metadata: { productId: product.id, size: size ?? "" },
      success_url: `${base}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/store/canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json(
        { error: "The store is warming up — check back soon." },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("store/checkout route error:", message);
    return NextResponse.json(
      { error: "Something went wrong starting checkout. Please try again." },
      { status: 502 },
    );
  }
}
