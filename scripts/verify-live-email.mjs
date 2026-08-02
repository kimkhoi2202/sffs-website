/**
 * The one path that has never run outside localhost: finish a real test on the
 * live site, send the results email, and open the link that email actually
 * contains.
 *
 * It is deliberately end to end rather than a set of unit assertions, because
 * every interesting failure here is a wiring failure between two things that
 * are each fine on their own. RESULTS_BASE_URL is the example: get it wrong and
 * the email arrives looking perfect and the link goes nowhere, and nothing
 * short of following the link notices.
 *
 * No dev tools. They are removed from the production build, so this answers all
 * fifteen questions by hand, the way a person would.
 *
 *   node scripts/verify-live-email.mjs [baseUrl]
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "https://www.smartfellaorfartsmella.com";
const EXE =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Resend's `delivered@resend.dev` always succeeds. The plus tag keeps each run
 * under the per-address hourly cap rather than tripping the rate limiter.
 */
const TO = `delivered+live${Date.now()}@resend.dev`;

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  ${detail}` : ""}`);
};

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  PAGE ERROR:", String(e).slice(0, 200)));

console.log(`\nLIVE END-TO-END EMAIL TEST  ${BASE}\n${"-".repeat(64)}`);

/* -- 1. take the grade 3 test for real ------------------------------------ */
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.reload({ waitUntil: "networkidle" });

await page.getByRole("button", { name: /I'm a kid/i }).click();
await page.getByRole("button", { name: "Grade 3" }).click();
await page.getByRole("button", { name: /start the test/i }).click();
await page.waitForTimeout(900);

let answered = 0;
for (let i = 0; i < 15; i++) {
  const opts = page.locator("main label");
  await opts.first().waitFor({ state: "visible", timeout: 15000 });
  // Vary the pick so the attempt is not a straight column of A, which would
  // score oddly and tell us less about the scoring path.
  const n = await opts.count();
  await opts.nth(i % Math.max(1, n)).click();
  answered++;
  const next = page.getByRole("button", { name: /^Next$/ });
  const finish = page.getByRole("button", { name: /see my result/i });
  if (await finish.count()) {
    await finish.click();
    break;
  }
  await next.click();
  await page.waitForTimeout(220);
}
check("answered all 15 questions by hand", answered === 15, `answered=${answered}`);
await page.waitForTimeout(2200);

/* -- 2. the gate must be masked ------------------------------------------- */
const gated = await page.evaluate(() => document.body.innerText);
check("gated screen masks the score", gated.includes("???"), "shows ???");
check(
  "gated screen leaks no real score",
  !/\b(\d{1,2})\s*\/\s*15\b/.test(gated.replace(/\?\?\?\s*\/\s*15/g, "")),
  "no N/15 anywhere",
);
check("email gate is present", /email/i.test(gated));
await page.screenshot({ path: "/tmp/live-gated.png" });

/* -- 3. send it ------------------------------------------------------------ */
await page.locator('input[type="email"]').fill(TO);
await page.getByRole("button", { name: /send my results/i }).click();
// The send does a Resend call and an Aurora write behind a possible cold start,
// so poll for the confirmation rather than guessing a duration.
await page
  .getByRole("button", { name: /sending/i })
  .waitFor({ state: "detached", timeout: 45000 })
  .catch(() => {});
await page.waitForTimeout(1500);
const afterSend = await page.evaluate(() => document.body.innerText);
check(
  "send succeeded",
  /sent|check|inbox|on its way|verdict is in the email/i.test(afterSend),
  afterSend.replace(/\s+/g, " ").slice(0, 70),
);
await page.screenshot({ path: "/tmp/live-sent.png" });

/* The gate must STILL be masked after sending. */
check("still masked after sending", afterSend.includes("???") || !/\d\s*\/\s*15/.test(afterSend));

const token = await page.evaluate(() => {
  for (const k of Object.keys(sessionStorage)) {
    try {
      const v = JSON.parse(sessionStorage.getItem(k) ?? "");
      if (v && typeof v.token === "string") return v.token;
    } catch {}
  }
  return null;
});
check("result token issued", !!token, token ? `${token.slice(0, 10)}…` : "none");

/* Read the record back IMMEDIATELY, from the same warm path, to separate "the
   token is wrong" from "the store lost it between instances". */
if (token) {
  const immediate = await page.evaluate(async (u) => {
    const r = await fetch(u);
    return { status: r.status, gone: (await r.text()).includes("RESULTS HAVE GONE") };
  }, `${BASE}/results/${encodeURIComponent(token)}`);
  check(
    "token resolves immediately (same session)",
    immediate.status === 200 && !immediate.gone,
    `HTTP ${immediate.status}${immediate.gone ? " but GONE" : ""}`,
  );
}

/* -- 4. read the link out of the email Resend actually sent ---------------- */
let emailUrl = null;
try {
  const key = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith("RESEND_API_KEY="))
    ?.split("=")[1]
    ?.replace(/["']/g, "")
    .trim();
  if (key) {
    // Give Resend a moment to have the record queryable.
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch("https://api.resend.com/emails?limit=5", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const body = await res.json();
      const list = body.data ?? [];
      const mine = list.find((e) =>
        (Array.isArray(e.to) ? e.to : [e.to]).some((a) => a === TO),
      );
      if (mine?.id) {
        const one = await fetch(`https://api.resend.com/emails/${mine.id}`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (one.ok) {
          const full = await one.json();
          const html = full.html ?? full.text ?? "";
          emailUrl = (html.match(/https?:\/\/[^\s"'<>]*\/results\/[^\s"'<>]+/) ?? [])[0] ?? null;
        }
      } else {
        console.log(`  note: Resend list returned ${list.length} row(s), none matching ${TO}`);
      }
    } else {
      console.log(`  note: Resend list endpoint returned ${res.status}`);
    }
  }
} catch (err) {
  console.log("  note: could not read the sent email:", String(err).slice(0, 120));
}

if (emailUrl) {
  check(
    "emailed link points at production",
    emailUrl.startsWith("https://www.smartfellaorfartsmella.com/results/") ||
      emailUrl.startsWith("https://smartfellaorfartsmella.com/results/"),
    emailUrl,
  );
} else {
  console.log("  --  emailed link not readable from the Resend API; falling back");
  console.log("      to the token, which tests the results page but NOT the origin");
}

/* -- 5. open the link in a clean context ----------------------------------- */
const openUrl = emailUrl ?? (token ? `${BASE}/results/${encodeURIComponent(token)}` : null);
if (openUrl) {
  const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const rp = await fresh.newPage();
  const resp = await rp.goto(openUrl, { waitUntil: "networkidle" });
  const text = await rp.evaluate(() => document.body.innerText);
  const gone = /results have gone/i.test(text);
  // The gone page is also a 200, so the status alone proves nothing. This is
  // the check that was too weak the first time round.
  check("results link loads a result", resp?.status() === 200 && !gone, `HTTP ${resp?.status()}${gone ? " but GONE" : ""}`);
  const score = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  check("results page shows the TRUE score", !!score && !text.includes("???"), score?.[0] ?? "no score found");
  check("results page is not gated", !/send my results/i.test(text));
  await rp.screenshot({ path: "/tmp/live-results.png" });
  await fresh.close();
}

await browser.close();

/* -- report ---------------------------------------------------------------- */
const failed = results.filter((r) => !r.pass);
console.log("-".repeat(64));
console.log(
  failed.length === 0
    ? `PASS: ${results.length}/${results.length} checks.\n`
    : `FAIL: ${failed.length} of ${results.length} checks.\n`,
);
process.exit(failed.length === 0 ? 0 : 1);
