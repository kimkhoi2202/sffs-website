/**
 * The score is hidden before a send and on the screen after one.
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-results-after-send.mjs [baseUrl]
 *
 * ===========================================================================
 * THE ONE ASSERTION
 * ===========================================================================
 * Everything else in this file is scaffolding around a single pair. The SAME
 * element on the SAME screen reads "???/15" before an address is handed over
 * and the real "5/15" after, and both halves have to hold or the change is
 * either a leak or a no-op. Checking only the second half would pass a build
 * with no gate at all; checking only the first is what the code already did.
 *
 * scripts/verify-gate-leak.mjs still owns the BEFORE side in depth — every
 * stem, every option, every explanation, in the rendered text, the hydrated
 * DOM and the server HTML. This does not duplicate that. It asserts the
 * before/after transition that suite cannot see, because that suite never
 * types an address.
 *
 * ===========================================================================
 * "VISIBLE" IS MEASURED, NOT ASSUMED
 * ===========================================================================
 * The house rule from scripts/verify-share-visible.mjs applies here more than
 * anywhere: an element being in the document is not the question a reader is
 * asking. A score can be present and inert, present and aria-hidden, present
 * behind a 5px blur, or present with no box at all — and the first three are
 * exactly the states this screen puts it in BEFORE the send, by design. So the
 * check reads the computed filter chain, the inert/aria-hidden ancestry and
 * the bounding box, and only counts a score a person could actually read.
 *
 * ===========================================================================
 * THE SEND IS STUBBED, AND THAT IS THE POINT
 * ===========================================================================
 * `/api/test-results/send` is fulfilled with `{ ok: true }` rather than left
 * to reach Resend. Three reasons, in order:
 *
 *   1. No mail is sent. A suite that puts a real message in someone's inbox
 *      every time it runs is a suite people stop running.
 *   2. It is hermetic. Without a key configured the route answers 502
 *      `not_configured`, so the unstubbed version of this file would pass or
 *      fail on whether a `.env.local` happened to exist.
 *   3. What is under test is the CLIENT's contract: on a confirmed send, and
 *      only then, the score appears. The server's send path has its own
 *      coverage (verify-results-email, verify-live-email) and is not this.
 *
 * Nothing is stubbed on the way in. The result itself is minted by the real
 * page POSTing to the real /api/test-results, which is a write, which is why
 * the target is checked — see scripts/harness-target.mjs.
 */
import { chromium } from "playwright-core";

import { resolveWriteTarget, SYNTHETIC } from "./harness-target.mjs";

const BASE = resolveWriteTarget(process.argv[2], "scripts/verify-results-after-send.mjs");
const { getTestById } = await import("../lib/test/tests/index.ts");
const test = getTestById("grade-5");

/** Every third one right, so the score is a number a bug could not guess. */
const answers = {};
test.items.forEach((item, i) => {
  answers[item.id] =
    i % 3 === 0 ? item.answer : item.options.find((o) => o.id !== item.answer).id;
});
const SCORE = test.items.filter((_, i) => i % 3 === 0).length;
const REAL = `${SCORE}/${test.items.length}`;
const MASKED = `???/${test.items.length}`;

/** Nothing is actually sent to it; the route is fulfilled in the browser. */
const ADDRESS = "regression@example.com";

let failures = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
};

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  // Marks the POST the PAGE makes, not just ours, so a run against a preview
  // deployment is recognisable in the stats table.
  extraHTTPHeaders: SYNTHETIC,
});
const page = await ctx.newPage();

/**
 * What the big number on the score card is doing right now.
 *
 * Found by its text rather than by a test id, because a test id would be a
 * seam added to production code for this file's benefit and the number is
 * unambiguous: it is the only element on the page whose whole content is
 * "???/15" or "5/15".
 */
const scoreState = (wanted) =>
  page.evaluate((text) => {
    const el = [...document.querySelectorAll("p")].find(
      (n) => (n.textContent ?? "").replace(/\s+/g, "") === text,
    );
    if (!el) return { present: false };
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const r = el.getBoundingClientRect();
    let blurred = false;
    for (let n = el; n; n = n.parentElement) {
      const filter = getComputedStyle(n).filter;
      if (filter && filter !== "none" && filter.includes("blur")) blurred = true;
    }
    return {
      present: true,
      boxed: r.width > 2 && r.height > 2,
      onScreen: r.top < window.innerHeight && r.bottom > 0,
      blurred,
      // Either one takes it out of the accessibility tree, so either one means
      // a screen reader is not being shown this however it looks.
      withheld: Boolean(el.closest("[inert], [aria-hidden='true']")),
    };
  }, wanted);

const readable = (s) =>
  Boolean(s.present && s.boxed && s.onScreen && !s.blurred && !s.withheld);

/* == getting to the gate, the long way, like a person =================== */
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

await page.getByRole("button", { name: /I'm a kid/i }).click();
await page.getByRole("button", { name: "Grade 5" }).click();
await page.getByRole("button", { name: /start the test/i }).click();
await page.waitForTimeout(700);

for (let i = 0; i < test.items.length; i++) {
  const item = test.items[i];
  const idx = item.options.findIndex((o) => o.id === answers[item.id]);
  const opts = page.locator("main label");
  await opts.first().waitFor({ state: "visible", timeout: 15000 });
  await opts.nth(idx).click();
  const finish = page.getByRole("button", { name: /see my result/i });
  if (await finish.count()) {
    await finish.click();
    break;
  }
  await page.getByRole("button", { name: /^(Next|Skip)$/ }).click();
  await page.waitForTimeout(120);
}
// The page POSTs the finished attempt the instant the test ends; the gate
// cannot send without the token that comes back.
await page.waitForTimeout(2500);

/* == 1. BEFORE: nothing earned is on the screen ========================= */
console.log(`\nBEFORE THE SEND, THE SCORE IS NOT THERE  ${BASE}`);
console.log("-".repeat(72));
{
  const masked = await scoreState(MASKED);
  const real = await scoreState(REAL);
  check("the mask is what is on the card", masked.present, `looking for "${MASKED}"`);
  check(`the real score is nowhere on the page`, !real.present, `would be "${REAL}"`);

  const dom = await page.evaluate(() => document.documentElement.outerHTML);
  check("no verdict sticker", !/certified-(smart-fella|fart-smella)\.png/.test(dom));
  check("no question review", !/<article/.test(dom));
  check("no share control", !/Share my result/.test(dom));
  check(
    "the email box is the thing on screen",
    await page.getByRole("button", { name: /send my results/i }).isVisible(),
  );
}

/* == 2. the send, with nothing actually leaving ========================= */
await page.route("**/api/test-results/send", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, sendsRemaining: 4 }),
  }),
);
await page.getByRole("textbox").fill(ADDRESS);
await page.getByRole("button", { name: /send my results/i }).click();
await page.getByText(/sent!/i).first().waitFor({ state: "visible", timeout: 15000 });
await page.waitForTimeout(600);

/* == 3. AFTER: the thing they earned ==================================== */
console.log("\nAFTER THE SEND, THE SCORE IS ON THE SCREEN");
console.log("-".repeat(72));
{
  const real = await scoreState(REAL);
  const masked = await scoreState(MASKED);
  check(
    `the real score is readable`,
    readable(real),
    real.present
      ? `"${REAL}" boxed=${real.boxed} onScreen=${real.onScreen} blurred=${real.blurred} withheld=${real.withheld}`
      : `"${REAL}" is not on the page at all`,
  );
  check("the mask is gone", !masked.present);

  const dom = await page.evaluate(() => document.documentElement.outerHTML);
  const text = await page.evaluate(() => document.body.innerText);
  check("the verdict landed", /certified-(smart-fella|fart-smella)\.png/.test(dom));
  check("the question review opened", /<article/.test(dom));
  check(
    "a real question is in it",
    test.items.some((i) => i.stem && text.includes(i.stem)),
  );
  check(
    "the share control arrived",
    await page.getByRole("button", { name: /share my result/i }).isVisible(),
  );
}

/* == 4. and the send was not broken to get there ======================== */
console.log("\nTHE CONFIRMATION IS STILL A CONFIRMATION");
console.log("-".repeat(72));
{
  const text = await page.evaluate(() => document.body.innerText);
  check("it says the mail has gone", /Sent!/i.test(text));
  check("it names the address it went to", text.includes(ADDRESS));
  for (const label of [/send it again/i, /use a different one/i, /start over/i]) {
    check(
      `"${String(label).slice(1, -2)}" is still offered`,
      await page.getByRole("button", { name: label }).isVisible(),
    );
  }
}

/* == 4b. and nothing puts the glass back ================================ */
console.log("\nONCE PAID FOR, THE SCORE STAYS PAID FOR");
console.log("-".repeat(72));
{
  /*
    THE TWO WAYS IT COULD COME BACK, AND BOTH ARE CLOSED.

    The first is the typo path: "Wrong address? Use a different one" returns
    the card to an empty form, and if the reveal were tied to that card's own
    state it would take the results down with it — punishing somebody for
    correcting the address they already paid with.

    The second is a refresh. The reveal lives in the flow's persisted state
    rather than in a component precisely so that reloading this screen does not
    re-blur it. Get that wrong and the bug is invisible until somebody hits F5
    on the one screen they were told to look at.
  */
  await page.getByRole("button", { name: /use a different one/i }).click();
  await page.waitForTimeout(400);
  check(
    "the address form comes back",
    await page.getByRole("button", { name: /send my results/i }).isVisible(),
  );
  check("and the score stays put", readable(await scoreState(REAL)));

  await page.reload({ waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(800);
  check("a refresh does not re-blur it", readable(await scoreState(REAL)));
  check("and the mask does not return", !(await scoreState(MASKED)).present);
}

/* == 5. the browser remembers, and offers it back ======================= */
console.log("\nA RETURN VISIT IS OFFERED THE RESULT INSTEAD OF THE FORK");
console.log("-".repeat(72));
{
  const stored = await page.evaluate(() => localStorage.getItem("sffs_result_v1"));
  const saved = stored ? JSON.parse(stored) : null;
  check("the token was kept in this browser", Boolean(saved?.token));
  // An exact key list, not a search for forbidden words: a score, a verdict or
  // an address creeping into browser storage should fail loudly whatever it is
  // called, and a token is base64 so a substring scan of it proves nothing.
  check(
    "and nothing else was kept with it",
    saved !== null && Object.keys(saved).sort().join(",") === "savedAt,token",
    saved ? Object.keys(saved).join(", ") : "nothing stored",
  );

  /*
    A CLOSED TAB, NOT A RELOAD. The flow's own state is sessionStorage, so
    clearing that and keeping localStorage is exactly what coming back
    tomorrow looks like — and it is the case that was reported, a completion
    followed seventeen minutes later by the opening fork.
  */
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const offer = page.getByRole("link", { name: /see my results/i });
  check("the offer is on the fork", await offer.isVisible());
  check(
    "it points at this browser's own result",
    (await offer.getAttribute("href")) ===
      `/results/${encodeURIComponent(saved?.token ?? "")}?from=saved`,
    (await offer.getAttribute("href")) ?? "no href",
  );
  check(
    "the fork is still the default",
    await page.getByRole("button", { name: /I'm a kid/i }).isVisible(),
  );
  // Whoever picks this device up next sees an offer, not somebody's verdict.
  const text = await page.evaluate(() => document.body.innerText);
  const dom = await page.evaluate(() => document.documentElement.outerHTML);
  check(
    "the offer prints no score and no verdict",
    !text.includes(REAL) && !/certified-(smart-fella|fart-smella)\.png/.test(dom),
  );
}

await page.screenshot({ path: "/tmp/results-after-send.png", fullPage: true });
await browser.close();

console.log("-".repeat(72));
console.log(
  failures === 0
    ? "\nPASS: hidden before the send, theirs after it.\n"
    : `\nFAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
