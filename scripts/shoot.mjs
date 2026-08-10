/**
 * Local screenshot walkthrough of the whole test flow.
 *
 *   node scripts/shoot.mjs [width] [height] [label]
 *
 * Drives a real Chromium through every step at a given viewport and writes the
 * frames to .shots/ (gitignored). Verification only — nothing imports this and
 * it is not part of any build. playwright-core is installed with --no-save so
 * it never lands in package.json.
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const W = Number(process.argv[2] ?? 360);
const H = Number(process.argv[3] ?? 640);
const LABEL = process.argv[4] ?? `${W}`;
/* `localhost` rather than the loopback address — see the note in
   scripts/measure-question.mjs. `next dev` binds by name, and against
   127.0.0.1 the HMR socket never connects, so nothing on the page responds. */
const BASE = "http://localhost:3000";
const OUT = join(process.cwd(), ".shots");
mkdirSync(OUT, { recursive: true });

const EXECUTABLE =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Next's dev overlay renders a portal pinned bottom-left whose hit area
 * swallows clicks aimed at anything under it, and it would appear in every
 * frame. Hidden for the walkthrough only.
 */
const HIDE_NEXT_OVERLAY = `nextjs-portal { display: none !important; }`;

let n = 0;
async function shot(page, name, opts = {}) {
  n++;
  const file = join(OUT, `${LABEL}-${String(n).padStart(2, "0")}-${name}.png`);
  await page.waitForTimeout(450);
  await page.screenshot({ path: file, ...opts });
  console.log(`  ${file.replace(process.cwd() + "/", "")}`);
  return file;
}

const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  isMobile: W < 768,
  hasTouch: W < 768,
});

console.log(`\n=== ${W}x${H} ===`);

/* 1. fork one */
await page.addStyleTag({ content: HIDE_NEXT_OVERLAY }).catch(() => {});
await page.goto(BASE, { waitUntil: "networkidle", timeout: 180_000 });
await page.addStyleTag({ content: HIDE_NEXT_OVERLAY });
await shot(page, "fork-parent-or-kid");

/* 2. parent's second fork */
await page.getByRole("button", { name: /I'm an adult/i }).click();
await shot(page, "fork-me-or-my-kid");

/* 3. grade picker (via the parent branch, so it says "your kid") */
await page.getByRole("button", { name: /^My kid/i }).click();
await shot(page, "grade-picker");

/* 4. intro for a child test */
await page.getByRole("button", { name: "Grade 5" }).click();
await shot(page, "intro-child");

/* 5. the child test running, first question */
await page.getByRole("button", { name: /start the test/i }).click();
await page.waitForTimeout(700);
await shot(page, "runner-child-q1");

/* 6. an answer selected */
const firstOption = page.locator('input[type="radio"]').first();
await firstOption.check({ force: true });
await shot(page, "runner-answer-selected");

/* 7. walk to a figure matrix and shoot it */
/*
  FOUND BY WHAT IS DRAWN, NOT BY A LABEL. This looked for a "FIGURE MATRIX"
  tier pill, and that pill was removed from the runner some time ago — so the
  loop never matched, always ran to its limit, and the frame written as
  "runner-figure-matrix" was whichever question happened to be fifteenth. A
  drawn stimulus is the actual property being looked for and cannot go stale
  the same way: in this bank only the figural items put an SVG in the stem.

  Each question on the way needs an answer before the forward control will
  move; there is no Skip. The break happens BEFORE answering, so the frame is
  of an untouched matrix, which is what it is for.
*/
for (let i = 0; i < 14; i++) {
  if ((await page.locator("[data-surface=stem] svg").count()) > 0) break;
  await page.locator("main label").first().click();
  await page.getByRole("button", { name: /^Next$/ }).click();
  await page.waitForTimeout(220);
}
await shot(page, "runner-figure-matrix");

/* 8. the whole-test clock under a minute */
await page.evaluate(() => {
  // Not reachable from the UI, and waiting four minutes for it is not a test.
  const el = document.querySelector("[data-lenis-prevent]");
  if (el) el.scrollTop = 0;
});
await shot(page, "runner-clock");

/* 9. the dev suite */
await page.getByRole("button", { name: "DEV", exact: true }).click();
await page.waitForTimeout(400);
await shot(page, "dev-tools-open");

/* 10. blurred results behind the email gate, reached by forcing a score */
/*
  The dev panel builds these chips from VERDICT_BANDS, so moving the verdict
  threshold renames them. This asked for "65%" long after the bar moved to 70,
  and the walkthrough had been dying here — the same staleness, and the same
  chip, that scripts/verify-shadows.mjs already carries a note about. 69% is
  `min - 1`: one under the bar, so the frame lands on the losing verdict.
*/
await page.getByRole("button", { name: "69%", exact: true }).click({ force: true });
await page.waitForTimeout(1400);
await page.getByRole("button", { name: "Close dev tools" }).click({ force: true });
await page.waitForTimeout(500);
await shot(page, "results-blurred-gate");

/* 10. the confirmation after a send */
// A fresh sub-address each run. Resend's `delivered@resend.dev` always
// succeeds, and the plus-tag keeps each run under the per-address hourly cap
// instead of screenshotting the rate-limit error.
await page
  .locator('input[type="email"]')
  .fill(`delivered+${Date.now()}@resend.dev`);
await page.getByRole("button", { name: /send my results|email me my results/i }).click();
await page.waitForTimeout(2600);
await shot(page, "results-email-sent");

/* 11. the unblurred results page from the link */
const token = await page.evaluate(() => {
  const raw = sessionStorage.getItem("sffs_test_v2");
  return raw ? JSON.parse(raw).token : null;
});
if (token) {
  await page.goto(`${BASE}/results/${token}`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.addStyleTag({ content: HIDE_NEXT_OVERLAY });
  await shot(page, "results-page-top");
  await shot(page, "results-page-full", { fullPage: true });
} else {
  console.log("  (no token in session — skipped the results page)");
}

/* 12. the adult test: one-way, 50 items */
await page.goto(BASE, { waitUntil: "networkidle", timeout: 120_000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({ content: HIDE_NEXT_OVERLAY });
await page.getByRole("button", { name: /I'm an adult/i }).click();
await page.getByRole("button", { name: /cognitive aptitude test/i }).click();
await shot(page, "intro-adult");
await page.getByRole("button", { name: /start the test/i }).click();
await page.waitForTimeout(800);
await shot(page, "runner-adult-q1");

await browser.close();
console.log(`\n${n} frames written to .shots/\n`);
