/**
 * Prove that one submission produces exactly one send.
 *
 *   npm run verify:send-dedupe
 *
 * ===========================================================================
 * WHY THIS EXISTS
 * ===========================================================================
 * Somebody received the same results email twice, three seconds apart. It was
 * not a double submit and it was not a retry: they pressed "Send it again" two
 * and a half seconds after the confirmation appeared, while the first message
 * was still in flight. The server had nothing to say about it — every limit it
 * carried was about volume, and two identical messages in three seconds is well
 * inside all of them.
 *
 * So the route now claims a result-and-address pair before it calls the
 * provider. This is the suite that holds that claim in place, and it counts
 * the thing that actually matters: HOW MANY TIMES THE PROVIDER WAS CALLED.
 * `fetch` is stubbed, so a send is a POST to api.resend.com and nothing else,
 * and the count is not inferred from a return value the route could get wrong.
 *
 * ===========================================================================
 * IT DRIVES THE REAL ROUTE, NOT A RESTATEMENT OF IT
 * ===========================================================================
 * The handler is imported and called. That is worth the two shims below,
 * because the ordering is the entire fix — claiming AFTER the await instead of
 * before it would still pass a test that only exercised the claim function,
 * and would still send twice.
 *
 *   `server-only`  throws the moment plain Node loads it. Stubbed empty, the
 *                  same thing Next's own react-server condition does.
 *   `next/server`  has no exports map, so ESM wants the extension.
 *
 * Nothing reaches the network and nothing reaches Aurora: the store is in its
 * local mode (see lib/email-store-mode.ts, which fails toward local) and the
 * working directory is a throwaway, so local-mode writes land there and are
 * read back as evidence rather than left in the repo.
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

/* == the environment this runs in ======================================== */

// Resend is configured, so the route takes the sending path rather than
// short-circuiting on `not_configured`. The stub below is what it reaches.
process.env.RESEND_API_KEY = "re_stub_key_not_a_real_credential";
process.env.RESEND_FROM = "stub@example.invalid";
// No production signal anywhere: the store stays local and PostHog is off, so
// there is no client to keep a timer alive and nothing to flush.
delete process.env.EMAIL_STORE;
delete process.env.VERCEL_ENV;
delete process.env.EMAIL_PROXY_URL;
delete process.env.EMAIL_PROXY_SECRET;
delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

/*
 * Both local stores resolve their file from `process.cwd()` at import time, so
 * this has to happen before the route is loaded. A temp directory keeps the
 * repo's own .data untouched and gives each run an empty table to count.
 */
const WORKDIR = mkdtempSync(join(tmpdir(), "sffs-send-dedupe-"));
process.chdir(WORKDIR);

/*
 * A movable clock, so the window can be waited out without the suite taking a
 * minute. Only Date.now is patched, which is what the claim and the rate
 * limiters read.
 */
const realNow = Date.now;
let clockOffsetMs = 0;
Date.now = () => realNow() + clockOffsetMs;

/* == the two shims ======================================================= */

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export{}", shortCircuit: true };
    }
    if (specifier === "next/server") return next("next/server.js", context);
    return next(specifier, context);
  },
});

/* == the network, which is a counter ===================================== */

let sends = 0;
let unexpectedCalls = [];

globalThis.fetch = async (input) => {
  const url = typeof input === "string" ? input : (input?.url ?? String(input));
  if (url.startsWith("https://api.resend.com/")) {
    sends++;
    return new Response(JSON.stringify({ id: `stub-${sends}` }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  // Not thrown: the route swallows failures from its own bookkeeping, so a
  // throw here would be invisible. Counted and asserted at the end instead.
  unexpectedCalls.push(url);
  return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
};

/* == the code under test ================================================= */

const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { POST } = await load("app/api/test-results/send/route.ts");
const { NextRequest } = await import("next/server.js");
const { encodeResultToken } = await load("lib/test/result-token.ts");
const { getTest } = await load("lib/test/tests/index.ts");
const { SEND_DEDUPE_WINDOW_MS } = await load("lib/test/result-store.ts");

/**
 * One finished adult attempt, signed with the development key.
 *
 * The elapsed time varies per call so each case is genuinely a different
 * completion. The token is a signature over its payload and `createdAt` has
 * only second resolution, so two identical attempts minted in the same second
 * are the same token — and would share a send counter and a claim namespace,
 * which is a suite quietly testing one result instead of five.
 */
let attempts = 0;
function mintToken() {
  const test = getTest("adult", null);
  return encodeResultToken({
    testId: test.id,
    grade: null,
    answers: {},
    elapsedSeconds: 40 + attempts++,
    timedOut: false,
    createdAt: Math.floor(Date.now() / 1000),
  });
}

/**
 * Ask the route to send, exactly as the browser does.
 *
 * A distinct IP per case, because the per-IP limiter is real and a suite that
 * tripped it would be testing the limiter while claiming to test the claim.
 */
async function ask({ token, email, ip, isResend = false, forceFailure = false }) {
  const res = await POST(
    new NextRequest("https://www.example.invalid/api/test-results/send", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ token, email, isResend, forceFailure }),
    }),
  );
  const body = await res.json();
  // `recordResultStats` is fire-and-forget by design, so give the row it files
  // a turn of the loop before anything counts them.
  await new Promise((r) => setTimeout(r, 0));
  return { status: res.status, body };
}

/** How many `emailed` rows local mode has filed — the Aurora row, in miniature. */
function emailedRows() {
  try {
    const raw = readFileSync(join(WORKDIR, ".data", "test-results.local.json"), "utf8");
    return JSON.parse(raw).filter((row) => row.stage === "emailed").length;
  } catch {
    return 0;
  }
}

/* == the cases =========================================================== */

let failures = 0;

function check(ok, label, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

/* -- 1. the headline ------------------------------------------------------ */
{
  const token = mintToken();
  const before = sends;
  const { body } = await ask({ token, email: "one@example.invalid", ip: "203.0.113.1" });

  check(body.ok === true, "a submission is accepted");
  check(sends - before === 1, "one submission sends exactly once", `sent ${sends - before}`);
  check(!body.deduped, "the first send is not reported as a duplicate");
  check(emailedRows() === 1, "one submission files exactly one emailed row", `${emailedRows()}`);

  /* -- 2. the bug, exactly as it happened -------------------------------- */
  const { body: again } = await ask({
    token,
    email: "one@example.invalid",
    ip: "203.0.113.1",
    isResend: true,
  });

  check(sends - before === 1, "a second ask seconds later does not send", `sent ${sends - before}`);
  check(again.ok === true, "the suppressed ask is not reported as a failure");
  check(again.deduped === true, "the suppressed ask says it was suppressed");
  check(emailedRows() === 1, "the suppressed ask files no second row", `${emailedRows()}`);

  /* -- 6. and the window ends -------------------------------------------- */
  clockOffsetMs += SEND_DEDUPE_WINDOW_MS + 1_000;
  const { body: later } = await ask({
    token,
    email: "one@example.invalid",
    ip: "203.0.113.6",
    isResend: true,
  });

  check(sends - before === 2, '"Send it again" still works once the window is out');
  check(!later.deduped, "the deliberate resend is a real send");
  clockOffsetMs = 0;
}

/* -- 3. the race ---------------------------------------------------------- */
{
  const token = mintToken();
  const before = sends;
  const both = await Promise.all([
    ask({ token, email: "race@example.invalid", ip: "203.0.113.2" }),
    ask({ token, email: "race@example.invalid", ip: "203.0.113.2" }),
  ]);

  check(sends - before === 1, "two simultaneous asks send exactly once", `sent ${sends - before}`);
  check(both.every((r) => r.body.ok === true), "neither concurrent ask fails");
  check(
    both.filter((r) => r.body.deduped === true).length === 1,
    "exactly one of the two is reported as suppressed",
  );
}

/* -- 4. the exit that must survive ---------------------------------------- */
{
  const token = mintToken();
  const before = sends;
  await ask({ token, email: "typo@example.invalid", ip: "203.0.113.3" });
  const { body } = await ask({ token, email: "fixed@example.invalid", ip: "203.0.113.3" });

  check(
    sends - before === 2,
    '"Wrong address? Use a different one" sends immediately',
    `sent ${sends - before}`,
  );
  check(!body.deduped, "a correction to a different address is never a duplicate");
}

/* -- 5. a failure leaves nothing latched ---------------------------------- */
{
  const token = mintToken();
  const before = sends;
  const failed = await ask({
    token,
    email: "retry@example.invalid",
    ip: "203.0.113.4",
    forceFailure: true,
  });
  check(failed.body.ok === false, "a rejected send is reported as a failure");
  // Named, so this case cannot pass by failing for some other reason — a
  // shared send cap would look identical from the outside.
  check(failed.body.code === "send_failed", "and it failed at the provider", failed.body.code);

  const { body } = await ask({ token, email: "retry@example.invalid", ip: "203.0.113.5" });
  check(sends - before === 1, "the retry after a failure actually sends", `sent ${sends - before}`);
  check(body.ok === true, "the retry after a failure succeeds");
}

/* -- and nothing else went anywhere --------------------------------------- */
check(
  unexpectedCalls.length === 0,
  "nothing but the mail provider was contacted",
  unexpectedCalls.join(", "),
);

console.log(
  failures === 0
    ? `\nverify-send-dedupe: OK. ${sends} sends across every path, and one submission is still one send.`
    : `\nverify-send-dedupe: ${failures} failure(s).`,
);
if (failures > 0) process.exit(1);
