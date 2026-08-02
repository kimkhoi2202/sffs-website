/**
 * Renders every screen of the test flow and reports, per surface, whether it
 * actually paints a shadow.
 *
 * This reads computed style off the live DOM rather than grepping for class
 * names, because a class name is not the question. The shadow can arrive from a
 * shared utility (`btn-press` paints one with no `shadow-*` class anywhere) and
 * it can be cancelled by a scoped rule further up. Only the rendered value
 * knows which won.
 *
 * Usage: node scripts/verify-shadows.mjs [baseUrl]
 */
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";

/** Compact "4px 4px 0 0" style summary, so the report is readable. */
const brief = (v) => (v ? v.replace(/rgba?\([^)]+\)\s*/g, "").trim() : "flat");

/**
 * Resolve each surface with a Playwright locator (so text selectors work), then
 * read the computed box-shadow off the real node.
 */
async function probe(page, spec) {
  const out = [];
  for (const { label, sel } of spec) {
    const loc = page.locator(sel).first();
    const count = await page.locator(sel).count();
    if (count === 0) {
      out.push({ label, missing: true });
      continue;
    }
    const shadow = await loc.evaluate((el) => {
      const v = getComputedStyle(el).boxShadow;
      return !v || v === "none" ? null : v;
    });
    out.push({ label, count, shadow });
  }
  return out;
}

const rows = [];
const record = (screen, results, expected) => {
  for (const r of results) {
    const lifted = !r.missing && r.shadow !== null;
    const want = expected[r.label];
    rows.push({
      screen,
      surface: r.label,
      got: r.missing ? "MISSING" : lifted ? "shadow" : "flat",
      want,
      ok: r.missing ? false : (lifted ? "shadow" : "flat") === want,
      detail: r.missing ? "" : brief(r.shadow),
      count: r.count ?? 0,
    });
  }
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

/* -- fork ------------------------------------------------------------------ */
await page.goto(BASE, { waitUntil: "networkidle" });
// A previous run leaves a saved attempt in localStorage and the flow restores
// it, which would land this walkthrough halfway through a test.
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForTimeout(500);
record(
  "fork",
  await probe(page, [
    { label: "audience fork card", sel: "button:has-text('grown-up')" },
    // Shipped flat and stays flat: it is a caption, not a control, and the
    // correction did not put it on either list.
    { label: "brand header pill", sel: "span.bg-orange" },
  ]),
  { "audience fork card": "shadow", "brand header pill": "flat" },
);

/* -- parent sub-fork ------------------------------------------------------- */
await page.getByRole("button", { name: /grown-up/i }).click();
await page.waitForTimeout(350);
record(
  "parent-intent",
  await probe(page, [
    { label: "sub-fork card (Me)", sel: "button:has-text('My kid')" },
    { label: "back control", sel: "button:text-is('Back')" },
  ]),
  { "sub-fork card (Me)": "shadow", "back control": "shadow" },
);

/* -- grade picker ---------------------------------------------------------- */
await page.getByRole("button", { name: /^My kid/i }).click();
await page.waitForTimeout(400);
record(
  "grade",
  await probe(page, [{ label: "grade picker button", sel: "button[aria-label='Grade 5']" }]),
  { "grade picker button": "shadow" },
);

/* -- intro ----------------------------------------------------------------- */
await page.getByRole("button", { name: "Grade 5" }).click();
await page.waitForTimeout(400);
record(
  "intro",
  await probe(page, [
    { label: "intro bullet card", sel: "ul li" },
    { label: "Start the test button", sel: "button:has-text('Start the test')" },
  ]),
  { "intro bullet card": "flat", "Start the test button": "shadow" },
);
await page.screenshot({ path: "/tmp/sh-intro.png" });

/* -- in test --------------------------------------------------------------- */
await page.getByRole("button", { name: /start the test/i }).click();
await page.waitForTimeout(700);
record(
  "test",
  await probe(page, [
    { label: "question stem card", sel: "[data-surface=stem]" },
    { label: "option card", sel: "main label" },
    { label: "clock pill", sel: "[data-surface=clock]" },
    { label: "quit control", sel: "button[aria-label='Quit the test']" },
    { label: "Next button", sel: "button:text-is('Next')" },
  ]),
  {
    "question stem card": "flat",
    "option card": "flat",
    "clock pill": "flat",
    "quit control": "shadow",
    "Next button": "shadow",
  },
);
await page.screenshot({ path: "/tmp/sh-test.png" });

/* -- quit dialog ----------------------------------------------------------- */
const quit = page.locator("button[aria-label='Quit the test']").first();
if (await quit.count()) {
  await quit.click();
  await page.waitForTimeout(350);
  record(
    "quit dialog",
    await probe(page, [{ label: "quit dialog card", sel: "[role='dialog'] > div, [role='alertdialog'] > div" }]),
    { "quit dialog card": "shadow" },
  );
  await page.screenshot({ path: "/tmp/sh-quit.png" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
}

/* -- gated results --------------------------------------------------------- */
await page.getByRole("button", { name: "DEV", exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "65%", exact: true }).click({ force: true });
await page.waitForTimeout(1500);
await page.getByRole("button", { name: "Close dev tools" }).click({ force: true });
await page.waitForTimeout(600);
record(
  "results (gated)",
  await probe(page, [
    { label: "email gate card", sel: "form >> xpath=ancestor::div[contains(@class,'rounded')][1]" },
    { label: "Send my results button", sel: "button:has-text('Send my results')" },
    { label: "Start over (quiet)", sel: "button:has-text('Start over')" },
    { label: "results score card", sel: "div.bg-yellow" },
  ]),
  {
    "email gate card": "shadow",
    "Send my results button": "shadow",
    "Start over (quiet)": "flat",
    "results score card": "shadow",
  },
);
await page.screenshot({ path: "/tmp/sh-results.png" });

await browser.close();

/* -- report ---------------------------------------------------------------- */
const pad = (s, n) => String(s).padEnd(n);
console.log(
  "\n" +
    pad("SCREEN", 15) +
    pad("SURFACE", 26) +
    pad("WANT", 9) +
    pad("GOT", 9) +
    "SHADOW",
);
console.log("-".repeat(84));
let bad = 0;
for (const r of rows) {
  if (!r.ok) bad++;
  console.log(
    (r.ok ? "  " : "! ") +
      pad(r.screen, 13) +
      pad(r.surface, 26) +
      pad(r.want ?? "?", 9) +
      pad(r.got, 9) +
      r.detail,
  );
}
console.log("-".repeat(84));
console.log(bad === 0 ? "PASS: every surface is on the intended side.\n" : `FAIL: ${bad} surface(s) wrong.\n`);
process.exit(bad === 0 ? 0 : 1);
