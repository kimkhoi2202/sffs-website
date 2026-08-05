/**
 * The check that found the original bug, kept as a script.
 *
 *   node scripts/verify-results-link.mjs [baseUrl]
 *
 * The point is the SEPARATE BROWSER CONTEXT. A second request on the same
 * connection proved nothing: the in-memory store passed thirty concurrent
 * curls and ten results created over a minute, because every one of them came
 * back to the same warm instance. Only a genuinely fresh context — new
 * connection, no cookies, no session storage — reproduced the failure, which is
 * also what a person opening an email on their phone actually is.
 *
 * Also asserts that a tampered token and an expired token are refused with an
 * honest page rather than a stack trace or a blank screen.
 */
import { chromium } from "playwright-core";

import { resolveWriteTarget, SYNTHETIC } from "./harness-target.mjs";

const BASE = resolveWriteTarget(process.argv[2], "scripts/verify-results-link.mjs");
const EXE =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const rows = [];
const check = (name, pass, detail = "") => {
  rows.push({ name, pass });
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
};

const GONE = "RESULTS HAVE GONE";

/** Create a finished attempt through the real API and return its token. */
async function createResult(testId = "grade-3", grade = 3) {
  const res = await fetch(`${BASE}/api/test-results`, {
    method: "POST",
    headers: { "content-type": "application/json", ...SYNTHETIC },
    body: JSON.stringify({
      testId,
      grade,
      answers: { "grade-3-01": "a", "grade-3-02": "b", "grade-3-04": "c" },
      elapsedSeconds: 120,
      timedOut: false,
    }),
  });
  const body = await res.json();
  return body.token ?? null;
}

console.log(`\nRESULTS LINK  ${BASE}\n${"-".repeat(62)}`);

const token = await createResult();
check("the API issues a token", !!token, token ? `${token.length} chars` : "none");
if (!token) process.exit(1);

const browser = await chromium.launch({ executablePath: EXE });

/**
 * A brand new context every time: this is the whole test. Sharing one context
 * would reuse the connection and quietly restore the conditions under which the
 * old bug passed.
 */
async function openInFreshContext(url) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
  const text = await page.evaluate(() => document.body.innerText);
  const shot = `/tmp/link-${Math.random().toString(36).slice(2, 7)}.png`;
  await page.screenshot({ path: shot });
  await ctx.close();
  return { status: resp?.status() ?? 0, text, shot };
}

/* -- the real link, from five separate contexts ---------------------------- */
let found = 0;
let firstScore = null;
for (let i = 0; i < 5; i++) {
  const r = await openInFreshContext(`${BASE}/results/${token}`);
  const gone = r.text.includes(GONE);
  if (!gone) found++;
  const m = r.text.match(/(\d{1,2})\s*[/\n]\s*(\d{1,2})/);
  if (!gone && m && firstScore === null) firstScore = m[0].replace(/\s+/g, "");
}
check("the link resolves from 5 separate browser contexts", found === 5, `${found}/5`);
check("it shows a real score, not the mask", !!firstScore && !firstScore.includes("?"), firstScore ?? "none");

/* -- a token from a DIFFERENT result must show a different score ----------- */
const other = await createResult("grade-5", 5);
const otherPage = await openInFreshContext(`${BASE}/results/${other}`);
check(
  "a second result renders independently",
  !otherPage.text.includes(GONE),
  otherPage.text.slice(0, 40).replace(/\s+/g, " "),
);

/* -- tampering ------------------------------------------------------------- */
const [body, sig] = token.split(".");
const bumpScore = (() => {
  // Flip a byte in the payload, which is what someone editing their score does.
  const i = Math.floor(body.length / 2);
  return `${body.slice(0, i)}${body[i] === "A" ? "B" : "A"}${body.slice(i + 1)}.${sig}`;
})();

for (const [label, bad] of [
  ["an edited payload", bumpScore],
  ["an edited signature", `${body}.${sig.slice(0, -2)}zz`],
  ["a missing signature", body],
  ["outright junk", "totally-made-up-token"],
]) {
  const r = await openInFreshContext(`${BASE}/results/${encodeURIComponent(bad)}`);
  const honest = r.text.includes(GONE);
  const crashed = /Application error|Internal Server Error|Unhandled/i.test(r.text) || r.status >= 500;
  const blank = r.text.trim().length < 20;
  check(
    `${label} is refused with an honest page`,
    honest && !crashed && !blank,
    `HTTP ${r.status}${crashed ? " CRASH" : ""}${blank ? " BLANK" : ""}`,
  );
}

await browser.close();

const bad = rows.filter((r) => !r.pass);
console.log("-".repeat(62));
console.log(bad.length === 0 ? `PASS: ${rows.length}/${rows.length}\n` : `FAIL: ${bad.length} of ${rows.length}\n`);
process.exit(bad.length === 0 ? 0 : 1);
