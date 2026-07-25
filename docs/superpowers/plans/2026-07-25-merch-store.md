# Merch Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/store` with two tees — an open "Fart Smella" tee and an app-code-gated "Smart Fella" tee — with real Stripe Checkout and a stateless HMAC unlock gate.

**Architecture:** Stripe hosted Checkout via our own API routes (so we can gate). The Smart Fella tee is unlocked by a signed code the app issues at `smart fella` tier; the site verifies the code, mints a short-lived checkout token, and the checkout route re-verifies it server-side. Catalog + logic live in code (no DB). Neo-brutalist UI reusing the existing design system.

**Tech Stack:** Next.js 16 App Router (customized — consult `node_modules/next/dist/docs/` before Next APIs), React 19, TypeScript, Tailwind v4, `stripe` (Node SDK), `vitest` (new, for pure-logic tests), Node `crypto`.

## Global Constraints

- **Brand guardrail** ([[sffs-brand]]): never claim the product makes anyone smarter / measures IQ. Copy stays playful ("certified smart fella"), never clinical.
- **Customized Next.js**: before using any Next API (route handlers, `runtime`, metadata, redirects), read the matching guide under `node_modules/next/dist/docs/`.
- **Graceful without keys**: missing `STRIPE_SECRET_KEY` at runtime must return a clean 503, never crash — the site deploys to previews without keys.
- **Gate is server-authoritative**: the checkout route must independently verify the unlock proof for the gated product; never trust a client flag.
- **Match existing patterns**: API routes mirror `app/api/access-signup/route.ts` (`runtime="nodejs"`, body-size cap, in-memory rate-limit, `{ ok, error }` JSON). UI reuses `Section`, `Card`, `Button`, `Heading`, `Eyebrow`, `Badge`, `SectionDivider`; honor custom breakpoints in `globals.css`.
- **Money on a teammate's prod repo**: this ships as a PR, not a push to `main`.
- Placeholder shirt art; placeholder price $29 (`2900` cents) each; size select S–XXL; one flat US shipping rate placeholder.

## File Structure

- `lib/store/products.ts` — typed catalog (2 products).
- `lib/store/unlock.ts` — HMAC sign/verify for unlock codes + short-lived checkout tokens (pure, tested).
- `lib/store/stripe.ts` — server-only lazy Stripe client.
- `app/api/store/unlock/route.ts` — POST `{code}` → `{ok, token}`.
- `app/api/store/checkout/route.ts` — POST `{productId, token?}` → `{url}`.
- `app/api/store/webhook/route.ts` — Stripe webhook (verify sig, log order).
- `app/store/page.tsx` — store landing (server component).
- `app/store/success/page.tsx`, `app/store/canceled/page.tsx` — post-checkout pages.
- `components/store/product-card.tsx`, `unlock-form.tsx`, `buy-button.tsx` — UI.
- `scripts/mint-unlock-code.mjs` — dev util to mint a test code.
- `vitest.config.ts` — minimal (resolve `@` alias).
- Modify: `package.json` (deps + `test` script), `.env.example`, `components/quiz/quiz-nav.tsx` + `components/sections/site-footer.tsx` (Store link).

---

### Task 1: Tooling, deps, product catalog, Stripe client

**Files:**
- Modify: `package.json` (add `stripe` dep; `vitest` devDep; `"test": "vitest run"`, `"test:watch": "vitest"`)
- Create: `vitest.config.ts`, `lib/store/products.ts`, `lib/store/stripe.ts`
- Modify: `.env.example`
- Test: `lib/store/products.test.ts`

**Interfaces — Produces:**
- `ProductId = "fart-smella-tee" | "smart-fella-tee"`
- `interface Product { id: ProductId; name: string; blurb: string; priceCents: number; image: string; gated: boolean; sizes: string[]; }`
- `PRODUCTS: Record<ProductId, Product>`, `getProduct(id: string): Product | undefined`, `SIZES: readonly string[]`
- `getStripe(): Stripe` (throws `StripeNotConfiguredError` if `STRIPE_SECRET_KEY` missing)

- [ ] **Step 1:** `npm install stripe` and `npm install -D vitest`.
- [ ] **Step 2:** Create `vitest.config.ts` resolving the `@` alias to repo root:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: { environment: "node", include: ["**/*.test.ts"], exclude: ["node_modules/**", ".next/**"] },
});
```
- [ ] **Step 3:** Write `lib/store/products.test.ts` — assert: both ids present; each `priceCents > 0`; each has ≥1 size; exactly one product has `gated === true` (the smart-fella tee); `getProduct("nope")` is `undefined`.
- [ ] **Step 4:** Run `npm test` → FAIL (module missing).
- [ ] **Step 5:** Implement `lib/store/products.ts` (catalog with the two products; `fart-smella-tee` open, `smart-fella-tee` gated; `SIZES=["S","M","L","XL","XXL"]`; placeholder images `/store/fart-smella-tee.png`, `/store/smart-fella-tee.png`; `getProduct`).
- [ ] **Step 6:** Implement `lib/store/stripe.ts`: `import "server-only";` lazy singleton, `export class StripeNotConfiguredError extends Error {}`, `getStripe()` reads `process.env.STRIPE_SECRET_KEY` (throw `StripeNotConfiguredError` if absent), `new Stripe(key)` with the SDK's default API version.
- [ ] **Step 7:** Add to `.env.example`: `STRIPE_SECRET_KEY=`, `STRIPE_WEBHOOK_SECRET=`, `SFFS_UNLOCK_SECRET=`, `NEXT_PUBLIC_SITE_URL=`.
- [ ] **Step 8:** `npm test` → PASS; `npm run typecheck` → clean.
- [ ] **Step 9:** Commit.

---

### Task 2: Unlock + checkout-token crypto (`lib/store/unlock.ts`)

**Files:**
- Create: `lib/store/unlock.ts`, `scripts/mint-unlock-code.mjs`
- Test: `lib/store/unlock.test.ts`

**Interfaces — Consumes:** `ProductId` from Task 1.
**Produces:**
- `signUnlockCode(sub: string, secret: string): string` — format `SF1.<b64url(payload)>.<b64url(hmac)>`, `payload={v:1,sub,tier:"smart-fella",iat}`.
- `verifyUnlockCode(code: string, secret: string): { ok: true; sub: string } | { ok: false }` — constant-time HMAC compare; tolerant of malformed input (returns `{ok:false}`, never throws).
- `mintCheckoutToken(productId: ProductId, secret: string, ttlSec?: number): string` — HMAC over `{productId, exp}`.
- `verifyCheckoutToken(token: string, productId: ProductId, secret: string): boolean` — checks signature, `exp` not passed, and product binding.

**Security requirements (assert in tests):**
- Sign→verify round-trips; returns correct `sub`.
- Tampered payload OR tampered signature → `{ok:false}`.
- Correct code but WRONG secret → `{ok:false}`.
- Malformed/empty/`"a.b"`/non-string input → `{ok:false}` (no throw).
- HMAC compare uses `crypto.timingSafeEqual` on equal-length buffers.
- Checkout token: valid within TTL → `true`; expired (`ttlSec` past) → `false`; right token but WRONG `productId` → `false`; tampered → `false`.

- [ ] **Step 1:** Write `lib/store/unlock.test.ts` covering every bullet above (use a fixed test secret; for expiry, mint with `ttlSec: -1`).
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement `lib/store/unlock.ts` with Node `crypto` (`createHmac("sha256", secret)`, base64url encode/decode, `timingSafeEqual` guarded by length check).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Add `scripts/mint-unlock-code.mjs` — reads `SFFS_UNLOCK_SECRET` from env (or first CLI arg), prints a valid code for a sample `sub` (so we can demo the gate). Include a header comment giving the app team the exact format to reproduce.
- [ ] **Step 6:** `npm run typecheck` → clean. Commit.

---

### Task 3: API routes — unlock, checkout, webhook

**Files:**
- Create: `app/api/store/unlock/route.ts`, `app/api/store/checkout/route.ts`, `app/api/store/webhook/route.ts`

**Interfaces — Consumes:** Task 1 (`getProduct`, `getStripe`, `StripeNotConfiguredError`), Task 2 (all four fns). Reads `SFFS_UNLOCK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`.
**Produces (consumed by Task 4 client):**
- `POST /api/store/unlock` body `{code:string}` → `200 {ok:true, token:string}` | `400 {ok:false, error}`.
- `POST /api/store/checkout` body `{productId:string, size?:string, token?:string}` → `200 {url:string}` | `400`/`403`/`503`/`502 {error}`.

**Requirements:**
- Mirror `access-signup/route.ts`: `runtime="nodejs"`, `dynamic="force-dynamic"`, body-size cap, per-IP in-memory rate limit, JSON error shape.
- `unlock`: `verifyUnlockCode`; on ok → `mintCheckoutToken("smart-fella-tee", ...)` → `{ok:true, token}`; on fail → `400 {ok:false, error:"That's not a real Smart Fella code."}` (no failure oracle).
- `checkout`: resolve product; if `product.gated` → require `token` and `verifyCheckoutToken(token,"smart-fella-tee",secret)` (else `403`); build a Checkout Session (mode `payment`, one line item via inline `price_data` from `priceCents`, `quantity 1`, `shipping_address_collection` US, one flat `shipping_options` rate, `metadata:{productId,size}`, success `${base}/store/success?session_id={CHECKOUT_SESSION_ID}`, cancel `${base}/store/canceled`); `base` = `NEXT_PUBLIC_SITE_URL` ?? request origin; return `{url:session.url}`. Catch `StripeNotConfiguredError` → `503 {error:"The store is warming up — check back soon."}`; other Stripe errors → `502`.
- `webhook`: read raw body, `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`; on `checkout.session.completed` log the order (id, productId, size, email); bad signature → `400`. (No DB in v1.)
- [ ] **Step 1:** Implement the three routes per above; consult `node_modules/next/dist/docs/` for the route-handler + raw-body (webhook) conventions in this Next fork.
- [ ] **Step 2:** `npm run typecheck` → clean.
- [ ] **Step 3:** Manual sanity: with no Stripe key, `curl -XPOST /api/store/checkout` (via `next dev`) returns 503; `unlock` with a code from `scripts/mint-unlock-code.mjs` returns `{ok:true,token}`; a bad code returns 400; gated checkout without token returns 403.
- [ ] **Step 4:** Commit.

---

### Task 4: Store UI — page, cards, unlock form, buy button, result pages

**Files:**
- Create: `app/store/page.tsx`, `app/store/success/page.tsx`, `app/store/canceled/page.tsx`, `components/store/product-card.tsx`, `components/store/unlock-form.tsx`, `components/store/buy-button.tsx`
- Add placeholder images: `public/store/fart-smella-tee.png`, `public/store/smart-fella-tee.png` (simple brand-color placeholders).

**Interfaces — Consumes:** Task 1 catalog; Task 3 endpoints.

**Requirements:**
- `app/store/page.tsx` (server component): `QuizNav pinned` + a neo-brutalist hero (`Eyebrow`/`Heading`), then two `ProductCard`s (fart-smella open, smart-fella gated), `SiteFooter`, `metadata`. Playful, brand-safe copy.
- `product-card.tsx`: `Card` with placeholder image, name, blurb, price, a size `<select>` (S–XXL). Open product → renders `BuyButton`. Gated product → shows a lock `Badge` + "Unlock with your Smart Fella code" + `UnlockForm`; only after unlock does `BuyButton` appear.
- `unlock-form.tsx` (client): input + submit → `POST /api/store/unlock`; on `{ok}` lift the returned `token` to parent (reveal Buy); on fail show inline playful error + re-enable (mirror waitlist UX).
- `buy-button.tsx` (client): `POST /api/store/checkout {productId,size,token?}` → `window.location.assign(url)`; inline error + re-enable on failure; disabled/pending state during request.
- `success/page.tsx`: celebratory thank-you (may read `session_id` searchParam, no secret lookup needed in v1). `canceled/page.tsx`: "no worries" + back-to-store link.
- [ ] **Step 1:** Build components + pages using the design system; verify copy against the brand guardrail.
- [ ] **Step 2:** Add placeholder tee images.
- [ ] **Step 3:** `npm run typecheck` + `npm run build` → clean.
- [ ] **Step 4:** Manual: `PORT=3111 npm run dev`, screenshot `/store` (headless at ≥500px width) — both cards render; gated card shows locked → after a minted code, Buy appears.
- [ ] **Step 5:** Commit.

---

### Task 5: Wire Store into nav + footer

**Files:**
- Modify: `components/quiz/quiz-nav.tsx`, `components/sections/site-footer.tsx`

**Requirements:**
- Add a "Store" link (to `/store`) in the nav's right zone (alongside "For Parents") and in the footer link row, matching existing link styling and the mobile-safe layout already in place.
- [ ] **Step 1:** Add the links.
- [ ] **Step 2:** `npm run typecheck` + `npm run build` → clean.
- [ ] **Step 3:** Manual: Store link visible + navigates on desktop + mobile widths.
- [ ] **Step 4:** Commit.

## Self-Review

- **Spec coverage:** provider (Stripe) ✓ T1/T3; catalog ✓ T1; unlock code + anti-bypass ✓ T2/T3; both product flows ✓ T3/T4; graceful-no-keys ✓ T1/T3; nav+footer ✓ T5; env ✓ T1; tests for the security core ✓ T2. Fulfillment/one-time-use correctly out of scope.
- **Placeholders:** art/price/shipping are explicit design decisions, not spec gaps.
- **Type consistency:** `ProductId`, `getProduct`, `getStripe`, `signUnlockCode`/`verifyUnlockCode`/`mintCheckoutToken`/`verifyCheckoutToken` used identically across tasks.
