# Merch Store (two tees, one app-gated) — Design

**Date:** 2026-07-25
**Status:** Draft for review
**Repo:** `kimkhoi2202/sffs-website` (Next.js 16 App Router, React 19, TS, Tailwind v4, neo-brutalist "Closer" design system)

## Goal

Add a merch store to the marketing site with two T-shirt listings:

- **Fart Smella Tee** — open to everyone, buy directly.
- **Smart Fella Tee** — **locked**; buyable only after entering a valid "Smart Fella"
  unlock code earned in the app (reaching the top `smart fella` tier of the app's
  Fella Score ladder). The gate doubles as an app-download hook.

Real checkout via **Stripe**. Shirt art is **placeholder** for now.

## Context & constraints

- **Pre-launch.** The app is not on the App Store yet, and there is no store/payment
  backend on the site. So real users can't earn a code until the app ships code
  generation — the locked tee is intentionally "unlock it once you're a certified
  Smart Fella in the app." Build the full gate now; demo with minted test codes.
- **Stripe account exists**, but keys/config land later. Build the integration and
  assume `STRIPE_*` env is present in production before launch. Do not block on live
  Stripe testing.
- **Brand guardrail** ([[sffs-brand]]): never claim the product makes anyone smarter /
  measures IQ. Store copy stays playful ("certified smart fella"), never clinical.
- **This is real money on a teammate's production repo** → ship via a **branch + PR**
  for review, NOT a direct push to `main`.
- Reuse the existing design system (Section, Card, Button, Heading, Eyebrow, Badge,
  SectionDivider) and the custom breakpoints in `globals.css`.

## Architecture

### Provider: Stripe Checkout (hosted)

Chosen over Shopify / Fourthwall / Gumroad because the **custom app-code gate**
requires running our own server-side logic before payment — the turnkey platforms
can't gate on an arbitrary app-issued code cleanly. Fulfillment starts **manual**
(low pre-launch volume) and can wire to **Printful** print-on-demand later without
changing the storefront.

Flow: client asks our API to create a **Checkout Session** → we redirect to the
Stripe-hosted checkout (which collects payment + shipping address) → Stripe redirects
back to our success/cancel pages. A **webhook** records completed orders.

### Products (source of truth in code)

A single typed product catalog module, `lib/store/products.ts`:

```ts
export type ProductId = "fart-smella-tee" | "smart-fella-tee";

export interface Product {
  id: ProductId;
  name: string;
  blurb: string;
  priceCents: number;        // placeholder 2900 ($29) each; edit freely
  image: string;             // placeholder mockup path
  gated: boolean;            // smart-fella-tee = true
}
```

No DB for the catalog — two products live in code. (Stripe Price IDs can replace
`priceCents` later; for v1 we create Checkout line items with inline `price_data`.)

### Routes & files

| Path | Responsibility |
|---|---|
| `app/store/page.tsx` | Store landing: hero + two product cards (one open, one locked). Server component. |
| `components/store/product-card.tsx` | One listing card (open state → Buy; gated state → lock + unlock affordance). |
| `components/store/unlock-form.tsx` | Client: enter code → POST `/api/store/unlock` → on success reveal Buy for the gated tee. |
| `components/store/buy-button.tsx` | Client: POST `/api/store/checkout` → redirect to Stripe. Carries the verified code for the gated tee. |
| `app/store/success/page.tsx` | Post-payment thank-you (reads Stripe `session_id`). |
| `app/store/canceled/page.tsx` | Checkout-canceled fallback. |
| `app/api/store/checkout/route.ts` | POST: validates product; **for gated product re-verifies the unlock code server-side**; creates Stripe Checkout Session; returns the redirect URL. |
| `app/api/store/unlock/route.ts` | POST `{ code }`: verifies the signed code; returns `{ ok, token }` where `token` is a short-lived signed proof the checkout route accepts. |
| `app/api/store/webhook/route.ts` | Stripe webhook: verifies signature, logs/records the paid order (reuse the existing Aurora email-proxy pattern or just log for v1). |
| `lib/store/products.ts` | Product catalog. |
| `lib/store/stripe.ts` | Server-only Stripe client (`server-only`, lazy-inits from env). |
| `lib/store/unlock.ts` | Signed-code verify + short-lived checkout-token mint/verify (HMAC-SHA256, Node `crypto`, no deps). |

### Unlock code mechanism (stateless, signed)

**Format:** `SF1.<base64url(payload)>.<base64url(hmacSHA256(payload, SFFS_UNLOCK_SECRET))>`
where `payload = { v:1, sub:<appUserId>, tier:"smart-fella", iat:<unixSeconds> }`.

- **App side (later, by the app team):** when a player reaches `smart fella` tier,
  generate the code with the shared secret. This design doc's `lib/store/unlock.ts`
  ships a matching generator (`signUnlockCode`) so the app team can copy the exact
  format; we can also mint **test codes** now to demo the gate.
- **Site side:** `/api/store/unlock` recomputes the HMAC and constant-time-compares.
  Optional `iat` staleness check is OFF for v1 (codes don't expire) — a knob for later.
- **Anti-bypass:** unlocking returns a **separate short-lived checkout token** (HMAC
  over `smart-fella-tee` + expiry, ~15 min). The checkout API requires that token for
  the gated product, so the Buy button can't be forged and a raw code can't be replayed
  straight at `/api/store/checkout` without going through verify first. The checkout
  route also re-verifies rather than trusting the client.
- **v1 = reusable-if-valid** (stateless, no datastore). **Upgrade path:** one-time-use
  by recording redeemed `code`/`sub` in a store table (Aurora via the email-proxy
  pattern, or Supabase) and rejecting repeats.

### Placement

- Add a **"Store"** link to the site nav (`quiz-nav.tsx`) and the footer
  (`site-footer.tsx`).
- Neo-brutalist visual language identical to the rest of the site.

## Data flow

**Fart Smella (open):**
1. Buy button → `POST /api/store/checkout { productId: "fart-smella-tee" }`.
2. API builds a Checkout Session (line item, shipping collection, success/cancel URLs)
   → returns `url`.
3. Client `window.location = url` → Stripe → back to `/store/success`.

**Smart Fella (gated):**
1. Card renders locked (lock icon, "Enter your Smart Fella code"). No Buy button.
2. User enters code → `POST /api/store/unlock { code }`.
3. On `ok`, client stores the returned checkout token and reveals the Buy button.
4. Buy → `POST /api/store/checkout { productId: "smart-fella-tee", token }`.
5. API **re-verifies** the token (and its product binding) before creating the session.
   Invalid/absent token → 403.

## Error handling

- Unlock: invalid/garbled code → 400 with a playful "that's not a real Smart Fella
  code" message; the form re-enables. Never reveal why it failed (no oracle).
- Checkout: unknown product → 400; gated product without a valid token → 403; Stripe
  error → 502 with a generic retry message. Buy button shows an inline error and
  re-enables (mirrors the waitlist form's UX).
- Missing Stripe env at runtime → checkout returns 503 "store is warming up"
  (so a keyless preview deploy degrades gracefully instead of 500-crashing).
- Webhook: bad signature → 400; never trust the body without verifying.

## Env vars (Vercel, added later)

- `STRIPE_SECRET_KEY` — server Stripe client.
- `STRIPE_WEBHOOK_SECRET` — verify webhook signatures.
- `SFFS_UNLOCK_SECRET` — shared HMAC secret with the app (unlock codes).
- (Optional) `NEXT_PUBLIC_SITE_URL` — absolute success/cancel URLs (fallback to request origin).

`.env.example` gets these keys (placeholders only).

## Testing

- `lib/store/unlock.ts`: unit tests — sign→verify round-trip, tampered payload/sig
  rejected, wrong-secret rejected, checkout-token mint/verify + expiry + product
  binding. (Node `crypto`, pure, fast.)
- `lib/store/products.ts`: catalog invariants (ids unique, prices > 0, gated flag).
- Checkout/unlock routes: input validation (bad body, unknown product, missing token
  → correct status) with the Stripe client mocked (no live calls).
- Manual: mint a test code, run the full gated flow against Stripe **test mode** keys
  once available.

## Out of scope (v1)

- Automated print-on-demand fulfillment (manual first; Printful later).
- One-time-use codes / redemption ledger (stateless reusable for now).
- Inventory, sizes/variants beyond a simple size selector (see open items), discounts,
  multi-item cart (each Buy is a single-item Checkout Session).

## Open items to confirm

- **Sizes/variants:** collect a size (S–XXL) at checkout? (Stripe Checkout can't do
  custom variant dropdowns natively; simplest is a size `<select>` on the card passed
  as Checkout `metadata` + adjustable_quantity off. Proposed: yes, a size select.)
- **Shipping:** flat-rate placeholder (e.g., $5) via a Stripe shipping rate, US-only
  to start? (Proposed: yes, one flat rate, editable.)
- **Prices:** $29 each placeholder — confirm or set real.
