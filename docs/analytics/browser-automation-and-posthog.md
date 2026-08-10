# Driving a browser at PostHog without lying to yourself

Anything that automates a real browser and then asserts on PostHog events has
two traps in front of it. Both fail **silently and green**, which is the worst
possible shape for a check: the suite passes, the reviewer relaxes, and the
thing it was built to prove was never proved.

Both were hit for real on 2026-08-10 while verifying the deep entry URLs
(`scripts/verify-entry-links.mjs`). This is the writeup so the next person does
not spend the afternoon on them.

---

## 1. posthog-js drops every capture when `navigator.webdriver` is true

**Symptom.** The SDK boots. `/ingest/flags/` fires and returns 200. Static
assets load. `localStorage` fills with `ph_<token>_posthog`. The visitor is not
opted out, DNT and GPC are unset, the project is not quota-limited — and **not
one event is ever sent.** No `$pageview`, no autocapture, nothing.

**Cause.** posthog-js treats an automated browser as a bot and silently
suppresses capture. Playwright sets `navigator.webdriver = true`, so every
Playwright-driven page is a bot by that test. Chrome's own automation banner
flag (`--disable-blink-features=AutomationControlled`) does **not** clear it,
and neither does a realistic `userAgent` — both were tried, both made no
difference on their own.

**Why it is dangerous rather than merely annoying.** A suite that asserts
"every event carries `utm_content`" over an empty event list passes. Every
`.every()` is vacuously true on `[]`, and `find()` returning `undefined` only
fails if something explicitly checks for it. You get a confident green tick
proving nothing at all.

**Fix.** Mask the flag before any page script runs:

```js
await context.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
});
```

**And assert that you saw something.** Masking can regress, and the failure mode
is invisible. Count the events and fail — or explicitly SKIP, loudly — when the
count is zero. Never let an empty stream satisfy an assertion about events.

> Related: `instrumentation-client.ts` only calls `posthog.init` on the
> production hostname (`PROD_HOSTS`), so against localhost there are genuinely
> no events and the honest report is SKIP, not pass. To exercise event
> assertions against a local build, map the production hostname at the
> resolver — see the `HOST_MAP` note in `scripts/verify-entry-links.mjs`.

---

## 2. Route interception cannot catch what unloads flush

**Symptom.** `context.route("**/ingest/**", …)` is installed and fulfils every
event POST locally, so "nothing reaches the project" looks guaranteed. Events
show up in PostHog anyway.

**Cause.** posthog-js batches. Whatever is still queued when a page **unloads**
leaves as a `navigator.sendBeacon`, and a Playwright route handler on an
unloading page does not reliably see it.

Read "unload" literally: closing a tab does it, and so does **every
`page.goto`**. A suite that visits more than one URL therefore leaks by
construction, and there is no arrangement of interception that fixes it —
removing `page.close()` from this suite cut the volume by roughly 4x and still
left ~33 events per run reaching the project. Interception is a volume control
and an assertion mechanism. It is not a guarantee.

**What it cost.** Six synthetic people, 135 events and 31 `test_fork_selected`
landed in the production project. They sat on the funnel's "Chose a branch"
step with zero test starts — the exact metric the paid-traffic experiment is
judged on, biased in the flattering direction. They had to be found after the
fact and added to the project's test-account exclusion.

**Fix — two layers, and the second is the one that actually holds.**

1. **Intercept.** Catch `/ingest/**`, decode, assert, and `route.fulfill` a
   local `200`. Let `/flags/` and `/static/` through untouched or the SDK never
   starts capturing.
2. **Stamp the browser internal**, before any page script runs, so anything
   that escapes is excluded from every public metric by the project's
   test-account filter:

   ```js
   await context.addInitScript(() => {
     localStorage.setItem("sffs_ph_internal", "1"); // INTERNAL_STORAGE_KEY
   });
   ```

   This is the same durable flag `/internal` sets, read synchronously by
   `instrumentation-client.ts` before the first capture. Assert it too —
   `properties.is_internal === true` on your captured events — or layer 2 is
   another thing that fails silently.

**Also: do not close tabs mid-run.** It does not make layer 1 airtight — only
navigation does that, and you cannot avoid navigating — but it is free volume
reduction. Needing a clean per-tab `sessionStorage` is the usual reason to close
one, and an init script that clears it runs before the page's own scripts and
does the same job. Clearing storage from inside the page *after* load is a third
trap: it races the app's own persist effect and fails intermittently.

**Assume events will reach the project and make that safe**, rather than
assuming they will not. That is the whole design.

---

## Decoding what you intercepted

Bodies are **gzip**, not JSON and not always base64 — and `request.postData()`
returns a mangled string for binary. Use `request.postDataBuffer()` and try the
shapes in order, because the encoding varies with SDK version and config:

```js
gunzipSync(buf) → inflateSync(buf) → buf.toString("utf8")
→ form field `data=` → base64 → JSON
```

Count the bodies you could not decode and fail on a non-zero count. An
undecodable body is an unasserted event, which is the same silent-green problem
in a different coat.

---

## The rule underneath all of this

Every mechanism here — the mask, the interception, the internal stamp, the
decoder — is invisible when it works and silent when it breaks. So each one gets
an assertion of its own, and the suite fails rather than shrugs when a stream it
expected to be full is empty. A verifier for the dashboard's honesty must not be
the thing that puts synthetic steps into the dashboard.
