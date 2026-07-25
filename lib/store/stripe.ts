import "server-only";
import Stripe from "stripe";

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("STRIPE_SECRET_KEY is not configured.");
    this.name = "StripeNotConfiguredError";
  }
}

let stripe: Stripe | undefined;

/**
 * Lazily builds (and caches) the Stripe client. Never runs at import time —
 * only when a route actually needs it — so the site can build and deploy to
 * previews without a STRIPE_SECRET_KEY set.
 */
export function getStripe(): Stripe {
  if (stripe) return stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new StripeNotConfiguredError();
  }

  stripe = new Stripe(key);
  return stripe;
}
