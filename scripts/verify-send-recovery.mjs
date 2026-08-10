/**
 * Prove that a results email which fails is recoverable rather than lost.
 *
 *   npm run verify:send-recovery
 *
 * ===========================================================================
 * WHY THIS EXISTS
 * ===========================================================================
 * On 9 August the Resend account hit `daily_quota_exceeded` at 17:52 UTC and
 * every results email failed for six hours. 78 people were affected, 77 never
 * received their results, and NOT ONE OF THEM COULD BE IDENTIFIED afterwards:
 * the route called the provider first and wrote to Aurora second, so a 429
 * returned 502 having written nothing at all.
 *
 * The fix is an ordering change, and an ordering change is exactly the kind of
 * thing that a test of the individual pieces will happily pass while the
 * product still loses the address. So this drives the REAL route handlers and
 * counts artefacts: how many times the provider was called, and what rows
 * exist afterwards.
 *
 * ===========================================================================
 * IT ALSO GUARDS THE THING THAT IS EASY TO BREAK WHILE FIXING THIS
 * ===========================================================================
 * "Persist the address before sending" is one line away from "count everybody
 * who typed an address as a signup". Several dashboard tiles read those
 * tables and mean, today, that the mail actually went. So the cases below
 * assert the ABSENCES as hard as the presences: a failed send must leave a
 * pending row and must leave no signup and no emailed row.
 *
 * Nothing reaches the network and nothing reaches Aurora. `fetch` is stubbed,
 * the store is in local mode (lib/email-store-mode.ts fails toward local), and
 * the working directory is a throwaway.
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

/* == the environment this runs in ======================================== */

process.env.RESEND_API_KEY = "re_stub_key_not_a_real_credential";
process.env.RESEND_FROM = "stub@example.invalid";
process.env.RESULTS_DRAIN_SECRET = "stub-drain-secret";
/*
 * The proxy URL is set so the BACKLOG READ has somewhere to go, and the store
 * stays local anyway: `emailStoreMode` needs EMAIL_STORE=proxy or
 * VERCEL_ENV=production, and neither is set. So writes land in .data where
 * this suite can count them, while the one read goes to the stub below.
 */
process.env.EMAIL_PROXY_URL = "https://proxy.example.invalid/";
process.env.EMAIL_PROXY_SECRET = "stub-proxy-secret";
delete process.env.EMAIL_STORE;
delete process.env.VERCEL_ENV;
delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

const WORKDIR = mkdtempSync(join(tmpdir(), "sffs-send-recovery-"));
process.chdir(WORKDIR);

const realNow = Date.now;
let clockOffsetMs = 0;
Date.now = () => realNow() + clockOffsetMs;

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export{}", shortCircuit: true };
    }
    if (specifier === "next/server") return next("next/server.js", context);
    return next(specifier, context);
  },
});

/* == the network ========================================================= */

/**
 * What the next Resend call does. The quota shape is the real one: a 429
 * carrying `daily_quota_exceeded`, which is what the classifier keys on and
 * what separates "out for the day" from the OTHER 429 Resend sends.
 */
let resendMode = "ok";
let sends = 0;
/** What the stubbed proxy answers a `pending_sends` read with. */
let backlog = { supported: false, sends: [] };
let unexpectedCalls = [];

globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : (input?.url ?? String(input));

  if (url.startsWith("https://api.resend.com/")) {
    sends++;
    if (resendMode === "quota") {
      return json(429, {
        name: "daily_quota_exceeded",
        message: "You have reached your daily email sending quota.",
      });
    }
    if (resendMode === "rejected") {
      return json(422, { name: "validation_error", message: "Invalid recipient" });
    }
    return json(200, { id: `stub-${sends}` });
  }

  if (url.startsWith("https://proxy.example.invalid")) {
    const body = JSON.parse(init?.body ?? "{}");
    if (body.kind === "pending_sends") {
      // Exactly what a proxy that predates the read answers, which is the
      // case the drain has to report honestly rather than as "nothing to do".
      if (!backlog.supported) return json(400, { ok: false, error: "invalid_kind" });
      return json(200, { ok: true, sends: backlog.sends });
    }
    unexpectedCalls.push(`proxy:${body.kind ?? "email"}`);
    return json(200, { ok: true });
  }

  unexpectedCalls.push(url);
  return json(200, {});
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/* == the code under test ================================================= */

const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { POST: send } = await load("app/api/test-results/send/route.ts");
const { POST: drain } = await load("app/api/test-results/drain/route.ts");
const { NextRequest } = await import("next/server.js");
const { encodeResultToken } = await load("lib/test/result-token.ts");
const { getTest } = await load("lib/test/tests/index.ts");
const { resetSendHealth } = await load("lib/email/send-health.ts");
const { sendKeyFor } = await load("lib/test/result-stats.ts");
const { SEND_DEDUPE_WINDOW_MINUTES } = await load("lib/test/result-store.ts");

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

async function ask({ token, email, ip, isResend = false }) {
  const res = await send(
    new NextRequest("https://www.example.invalid/api/test-results/send", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ token, email, isResend }),
    }),
  );
  const body = await res.json();
  // The emailed row and the signup are fire-and-forget; give them a turn.
  await new Promise((r) => setTimeout(r, 0));
  return { status: res.status, body };
}

async function askDrain({ ip, secret = "stub-drain-secret", ...body }) {
  const headers = { "content-type": "application/json", "x-forwarded-for": ip };
  if (secret !== null) headers["x-drain-secret"] = secret;
  const res = await drain(
    new NextRequest("https://www.example.invalid/api/test-results/drain", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
}

/* == the artefacts ======================================================= */

function resultRows() {
  try {
    return JSON.parse(
      readFileSync(join(WORKDIR, ".data", "test-results.local.json"), "utf8"),
    );
  } catch {
    return [];
  }
}

const rowsWith = (stage, email) =>
  resultRows().filter((r) => r.stage === stage && (!email || r.email === email));

function signupRows(email) {
  try {
    const raw = JSON.parse(
      readFileSync(join(WORKDIR, ".data", "email-signups.local.json"), "utf8"),
    );
    return email ? raw.filter((r) => r.email === email) : raw;
  } catch {
    return [];
  }
}

/* == the cases =========================================================== */

let failures = 0;
function check(ok, label, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

/* -- 1. THE HEADLINE: a quota failure keeps the person ------------------- */
{
  resetSendHealth();
  resendMode = "quota";
  const token = mintToken();
  const email = "lost@example.invalid";
  const { status, body } = await ask({ token, email, ip: "203.0.113.10" });

  check(body.ok === false, "a quota failure is still reported as a failure");
  check(body.code === "send_quota", "and it is named as quota, not a generic send_failed", body.code);
  check(status === 503, "with a status that says capacity rather than upstream", `${status}`);

  check(
    rowsWith("pending", email).length === 1,
    "THE ADDRESS SURVIVES: one pending row exists after the send failed",
    `${rowsWith("pending", email).length}`,
  );
  check(
    rowsWith("pending", email)[0]?.token === token,
    "and it carries the token, so the results can actually be re-sent",
  );

  /* -- and none of it counts as anything that happened ------------------- */
  check(
    rowsWith("emailed", email).length === 0,
    "a failed send files NO emailed row",
    `${rowsWith("emailed", email).length}`,
  );
  check(
    signupRows(email).length === 0,
    "a failed send files NO signup — the count still means the mail went",
    `${signupRows(email).length}`,
  );
}

/* -- 2. the copy that was false for six hours ---------------------------- */
{
  const token = mintToken();
  const { body } = await ask({ token, email: "copy@example.invalid", ip: "203.0.113.11" });

  check(
    !/try again in a moment/i.test(body.error),
    "quota copy does not invite a retry that cannot work",
    body.error,
  );
  check(
    /limit/i.test(body.error) && /saved/i.test(body.error),
    "quota copy names the limit and says what survives",
    body.error,
  );
}

/* -- 3. the rate limiter no longer implies a delivery -------------------- */
{
  // Three attempts to one address, then the fourth meets ADDRESS_LIMIT.
  const email = "limited@example.invalid";
  for (let i = 0; i < 3; i++) {
    await ask({ token: mintToken(), email, ip: `203.0.113.2${i}` });
  }
  const { body } = await ask({ token: mintToken(), email, ip: "203.0.113.29" });

  check(
    body.code === "send_quota",
    "during an outage the limiter tells the truth instead of its own rule",
    body.code,
  );
  check(
    !/had a few of these already/i.test(body.error ?? ""),
    'the "has had a few of these already" phrasing is gone',
  );

  // And with no outage in memory it states the rule without implying delivery.
  resetSendHealth();
  const { body: plain } = await ask({ token: mintToken(), email, ip: "203.0.113.30" });
  check(plain.code === "address_limited", "outside an outage the limiter speaks for itself", plain.code);
  check(
    /attempts, not deliveries/i.test(plain.error),
    "and says it is counting attempts rather than deliveries",
    plain.error,
  );
}

/* -- 4. a successful send is unchanged, plus the key that ties them ------ */
{
  resetSendHealth();
  resendMode = "ok";
  const token = mintToken();
  const email = "fine@example.invalid";
  const before = sends;
  const { body } = await ask({ token, email, ip: "203.0.113.40" });

  check(body.ok === true, "a good send still succeeds");
  check(sends - before === 1, "one submission is still exactly one send", `${sends - before}`);
  check(rowsWith("emailed", email).length === 1, "it files one emailed row");
  check(signupRows(email).length === 1, "and one signup");

  const key = sendKeyFor(token, email);
  check(
    rowsWith("pending", email)[0]?.sendKey === key &&
      rowsWith("emailed", email)[0]?.sendKey === key,
    "the pending row and its emailed row share a send key, so the backlog clears",
  );
}

/* -- 5. four attempts by one person are one entry in the backlog --------- */
{
  resetSendHealth();
  resendMode = "quota";
  const token = mintToken();
  const email = "persistent@example.invalid";
  // Four attempts, exactly as the average person managed on 9 August. Fresh
  // IPs so this measures the backlog and not the per-IP limiter.
  for (let i = 0; i < 4; i++) {
    await ask({ token, email, ip: `203.0.113.5${i}`, isResend: i > 0 });
    // Past the per-ADDRESS window each time, so all four genuinely reach
    // Resend. Inside one hour the limiter refuses the fourth — which is a real
    // behaviour and is asserted separately below.
    clockOffsetMs += 61 * 60_000;
  }

  const pending = rowsWith("pending", email);
  const keys = new Set(pending.map((r) => r.sendKey));
  check(pending.length === 4, "four attempts write four pending rows", `${pending.length}`);
  check(
    keys.size === 1,
    "but they share ONE send key, so recovery mails them once rather than four times",
    `${keys.size}`,
  );
  clockOffsetMs = 0;
}

/* -- 5b. and the attempt the limiter refuses is not a lost person -------- */
{
  resetSendHealth();
  resendMode = "quota";
  const token = mintToken();
  const email = "capped@example.invalid";
  // Four attempts inside one hour, which is what actually happened: the
  // per-address limiter refuses the fourth before it reaches the provider.
  for (let i = 0; i < 4; i++) {
    await ask({ token, email, ip: `203.0.113.7${i}`, isResend: i > 0 });
    clockOffsetMs += (SEND_DEDUPE_WINDOW_MINUTES + 1) * 60_000;
  }

  check(
    rowsWith("pending", email).length === 3,
    "the limiter still refuses the fourth attempt within the hour",
    `${rowsWith("pending", email).length}`,
  );
  check(
    new Set(rowsWith("pending", email).map((r) => r.sendKey)).size === 1,
    "and the three that got through are one recoverable person, not three",
  );
  clockOffsetMs = 0;
}

/* -- 6. the dedupe window and the copy that describes it ----------------- */
{
  check(
    SEND_DEDUPE_WINDOW_MINUTES === 15,
    "the duplicate window is 15 minutes",
    `${SEND_DEDUPE_WINDOW_MINUTES}`,
  );

  /*
    The gate is a client component and cannot import the server-only constant,
    so the two are held together here instead. This is the check that stops the
    product describing a rule it no longer follows.
  */
  const gate = readFileSync(join(ROOT, "components/test/email-gate.tsx"), "utf8");
  const stated = [...gate.matchAll(/(\d+)\s*minutes/g)].map((m) => Number(m[1]));
  check(
    stated.length >= 2 && stated.every((n) => n === SEND_DEDUPE_WINDOW_MINUTES),
    "both audiences' copy states that same window",
    `found ${stated.join(", ") || "none"}`,
  );
  check(
    !/twice in a minute|once a minute/i.test(gate),
    "and the old one-minute wording is gone",
  );
}

/* -- 7. the confirmation screen removals --------------------------------- */
{
  /*
    CODE ONLY, NOT PROSE. These files explain at length what was removed and
    why, quoting the old copy and naming the old component — so a plain search
    of the source finds "Start over" in a comment that exists precisely to say
    it is gone, and every check below passes or fails on the wrong evidence.
  */
  const code = (rel) =>
    readFileSync(join(ROOT, rel), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");

  const gate = code("components/test/email-gate.tsx");
  check(!/resendPrompt/.test(gate), '"Not there yet?" prompt is gone from both audiences');
  check(!/Not in your inbox/.test(gate), "and so is the adult variant of it");
  check(!/border-dashed/.test(gate), "the dashed divider is gone");
  check(!/Start over/.test(gate), '"Start over" is gone from the results card');
  check(/Send it again/.test(gate), '"Send it again" is still there');
  check(/Wrong address\? Use a different one/.test(gate), "and so is the typo exit");
  check(/Privacy/.test(gate) && /Terms/.test(gate) && /Support/.test(gate), "the legal links stay");

  const gated = code("components/test/gated-results.tsx");
  check(
    !/onRestart/.test(gate) && !/onRestart/.test(gated),
    "the onRestart prop was removed rather than left plumbed to nothing",
  );
  check(
    /onQuit=\{reset\}/.test(code("components/test/test-flow.tsx")),
    "restarting is still possible from inside the test itself",
  );
}

/* -- 8. the drain refuses before it does anything ------------------------ */
{
  const { status } = await askDrain({ ip: "203.0.113.60", secret: null });
  check(status === 401, "the drain refuses a request with no secret", `${status}`);

  const wrong = await askDrain({ ip: "203.0.113.61", secret: "not-it" });
  check(wrong.status === 401, "and one with the wrong secret", `${wrong.status}`);
}

/* -- 9. the drain says so when it cannot see the backlog ----------------- */
{
  backlog = { supported: false, sends: [] };
  const { status, body } = await askDrain({ ip: "203.0.113.62" });
  check(
    body.code === "backlog_unavailable" && status === 501,
    "a proxy without the read is reported, not silently read as an empty queue",
    `${status} ${body.code}`,
  );
}

/* -- 10. the drain dry runs unless told otherwise ------------------------ */
{
  resetSendHealth();
  resendMode = "ok";
  const token = mintToken();
  const email = "owed@example.invalid";
  backlog = {
    supported: true,
    sends: [{ sendKey: sendKeyFor(token, email), email, token, pendingSince: "2026-08-09T17:52:00Z" }],
  };

  const before = sends;
  const { body } = await askDrain({ ip: "203.0.113.63" });
  check(body.dryRun === true, "the drain dry runs by default");
  check(body.pending === 1, "and reports what it would send", `${body.pending}`);
  check(sends - before === 0, "having sent nothing at all", `${sends - before}`);
}

/* -- 11. THE RECOVERY ITSELF --------------------------------------------- */
{
  resendMode = "ok";
  const token = mintToken();
  const email = "recovered@example.invalid";
  backlog = {
    supported: true,
    sends: [{ sendKey: sendKeyFor(token, email), email, token, pendingSince: "2026-08-09T17:52:00Z" }],
  };

  const before = sends;
  const { body } = await askDrain({ ip: "203.0.113.64", dryRun: false });

  check(body.sent === 1, "the drain sends the owed email", JSON.stringify(body));
  check(sends - before === 1, "exactly once", `${sends - before}`);
  check(
    rowsWith("emailed", email).length === 1,
    "and files the emailed row it would have had all along",
  );
  check(
    rowsWith("emailed", email)[0]?.sendKey === sendKeyFor(token, email),
    "carrying the send key, so it leaves the backlog",
  );
  check(signupRows(email).length === 1, "and the signup, now that the mail genuinely went");
}

/* -- 12. a second outage stops the batch instead of burning it ----------- */
{
  resetSendHealth();
  resendMode = "quota";
  const items = ["a", "b", "c"].map((n) => {
    const token = mintToken();
    const email = `batch-${n}@example.invalid`;
    return { sendKey: sendKeyFor(token, email), email, token, pendingSince: "" };
  });
  backlog = { supported: true, sends: items };

  const before = sends;
  const { body } = await askDrain({ ip: "203.0.113.65", dryRun: false });

  check(body.stoppedBecause === "quota", "a drain into an exhausted quota stops", body.stoppedBecause);
  check(sends - before === 1, "after one attempt, not three", `${sends - before}`);
  check(body.sent === 0, "nothing is recorded as sent");
  check(
    items.every((i) => rowsWith("emailed", i.email).length === 0),
    "and nobody is marked settled, so they are all still owed",
  );
}

/* -- 13. a hard rejection leaves the backlog rather than looping --------- */
{
  resetSendHealth();
  resendMode = "rejected";
  const token = mintToken();
  const email = "dead-domain@example.invalid";
  backlog = {
    supported: true,
    sends: [{ sendKey: sendKeyFor(token, email), email, token, pendingSince: "" }],
  };

  const { body } = await askDrain({ ip: "203.0.113.66", dryRun: false });
  check(body.dropped === 1, "a refused recipient is dropped", JSON.stringify(body));
  check(rowsWith("dropped", email).length === 1, "with a row that settles it");
  check(
    rowsWith("emailed", email).length === 0,
    "and no emailed row, because nothing was delivered",
  );
  check(signupRows(email).length === 0, "and no signup either");
}

/* -- and nothing else went anywhere -------------------------------------- */
check(
  unexpectedCalls.length === 0,
  "nothing but the mail provider and the backlog read was contacted",
  unexpectedCalls.join(", "),
);

console.log(
  failures === 0
    ? `\nverify-send-recovery: OK. ${sends} stubbed sends, and a failed one now leaves somebody to send to.`
    : `\nverify-send-recovery: ${failures} failure(s).`,
);
if (failures > 0) process.exit(1);
