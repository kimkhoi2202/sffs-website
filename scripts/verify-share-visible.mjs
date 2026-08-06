/**
 * Does the share control ever leave a tap with nothing to show for it?
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-share-visible.mjs [baseUrl] [token]
 *
 * The token is optional and is MINTED against the target when it is left out;
 * see scripts/share-result.mjs for why it is no longer a literal, and for the
 * timeout-on-"Share my result" that the literal caused.
 *
 * ===========================================================================
 * WHY THIS EXISTS, WHEN THERE WAS ALREADY A SUITE THAT PASSED
 * ===========================================================================
 * A previous suite asserted 36 things about this control and all of them were
 * green while the feature was reported broken. Two blind spots did it, and
 * this file is built around both:
 *
 *   1. IT ASSERTED THE CONTROL EXISTED, NOT THAT ANYONE COULD SEE IT. It used
 *      `waitForSelector` and `getByRole(...).click()`, and Playwright's
 *      actionability machinery SCROLLS AN ELEMENT INTO VIEW before clicking
 *      it. Something rendered where a person would never look is therefore
 *      still clickable by a test. So every check here measures a bounding box
 *      against the viewport and hit-tests the element at its own centre,
 *      which is the question a reader actually asks.
 *
 *   2. IT ASSERTED THE ABSENCE OF A BUG RATHER THAN THE PRESENCE OF FEEDBACK.
 *      There was a case for "a non-settling share sheet leaves the button
 *      enabled", and it passed, because the fix for the lock-up worked. But
 *      not-locked-up is not the same as told-something: the control could sit
 *      there, enabled, silent, having done nothing visible. That is what was
 *      reported. So the central assertion here is a POSITIVE one, applied to
 *      every branch: within a few seconds of a tap, SOMETHING a person can
 *      perceive must have changed.
 *
 * ===========================================================================
 * WHAT CHANGED WHEN OUR OWN SHEET WAS REMOVED
 * ===========================================================================
 * This used to have a third job: proving the menu that opened was somewhere
 * visible. There is no menu now — the button goes straight to the OS sheet
 * (see components/test/share-results.tsx) — so "perceivable" means the live
 * region spoke, and nothing else counts.
 *
 * THAT MAKES SECTION 2 MORE IMPORTANT, NOT LESS. Every desktop visitor now
 * takes the path that produced two dead-button reports in one day, because
 * there is no menu in front of it any more. Section 3 is the specific one:
 * `navigator.share()` returns a promise that never settles, and the button has
 * to recover from it TWICE — once for the tap that hit it, and once for the
 * next tap, which is the half the first fix missed.
 *
 * It runs against the real results page, not a mounted component, so anything
 * the surrounding layout contributes is in scope.
 */
import { chromium } from "playwright-core";

import { mintShareToken } from "./share-result.mjs";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const TOKEN =
  process.argv[3] ?? (await mintShareToken(BASE, "scripts/verify-share-visible.mjs"));
const URL_RESULTS = `${BASE}/results/${encodeURIComponent(TOKEN)}`;

let failures = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
};
const section = (title) => {
  console.log(`\n${title}`);
  console.log("-".repeat(74));
};

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

/** Open the real page and put the share button where a reader would have it. */
async function openPage({ width, height, hasTouch = false, stub = () => {} }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    hasTouch,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await ctx.newPage();
  await page.addInitScript(stub);
  await page.goto(URL_RESULTS, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /share my result/i }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  return { ctx, page };
}

/**
 * Click the trigger at its own coordinates.
 *
 * `page.mouse.click(x, y)` rather than `locator.click()`, deliberately: the
 * locator version would scroll things around to make the click succeed, which
 * is the help that hid the original defect.
 */
async function clickTrigger(page) {
  const box = await page
    .getByRole("button", { name: /share my result|getting your picture/i })
    .boundingBox();
  if (!box) throw new Error("no share button on the page");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * The first thing the live region says, caught while it is still saying it.
 *
 * Confirmations clear themselves after CONFIRM_MS, so reading once at the end
 * of a wait finds an empty element and reports silence on a control that
 * spoke. THE ONE THAT SPOKE, NOT THE FIRST IN THE DOCUMENT: the
 * hand-it-to-your-kid card below has a live region of its own.
 */
async function waitForStatus(page, ms = 6000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const said = await page.evaluate(
      () =>
        [...document.querySelectorAll("[role=status]")]
          .map((n) => n.textContent?.trim())
          .find(Boolean) ?? "",
    );
    if (said) return said;
    await page.waitForTimeout(120);
  }
  return "";
}

/** Wait for the confirmation to expire, so the next tap's message is its own. */
async function waitForSilence(page, ms = 6000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const said = await page.evaluate(
      () =>
        [...document.querySelectorAll("[role=status]")]
          .map((n) => n.textContent?.trim())
          .find(Boolean) ?? "",
    );
    if (!said) return true;
    await page.waitForTimeout(120);
  }
  return false;
}

/* ===========================================================================
   1. THE BUTTON IS WHERE A PERSON CAN SEE IT, AT EVERY SIZE
   =========================================================================== */
section("THE CONTROL IS WHERE A PERSON CAN SEE AND PRESS IT");
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1024, 600],
  [1440, 900],
]) {
  const { ctx, page } = await openPage({ width, height });
  // The realistic position: a reader who has scrolled through their results.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);

  const v = await page.evaluate(() => {
    const el = [...document.querySelectorAll("button")].find((b) =>
      /share my result/i.test(b.textContent ?? ""),
    );
    if (!el) return { mounted: false };
    const b = el.getBoundingClientRect();
    const hit = document.elementFromPoint(
      Math.round(b.left + b.width / 2),
      Math.round(b.top + b.height / 2),
    );
    return {
      mounted: true,
      hasBox: b.width > 2 && b.height > 2,
      inViewport: b.top >= 0 && b.bottom <= window.innerHeight,
      hittable: hit ? el.contains(hit) : false,
      rect: `${Math.round(b.top)}..${Math.round(b.bottom)}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  });
  check(
    `${width}x${height}: boxed, in viewport and hit-testable at the page end`,
    v.mounted && v.hasBox && v.inViewport && v.hittable,
    v.mounted ? `${v.rect} in ${v.viewport} hittable=${v.hittable}` : "never mounted",
  );
  await ctx.close();
}

/* ===========================================================================
   2. THE DEAD BAND UNDER THE BUTTON

   The owner's report was "too much space below the button", and it was: a
   16px line reserved for a confirmation that is absent almost all the time,
   on top of a full pad. Measured from the button's bottom edge to the card's,
   at rest, before and after:

     390x844    46px -> 26px
     1440x900   50px -> 28px

   The threshold is 32px rather than the measured 26/28, because the point is
   to catch the reserved line coming back (which costs 16px on its own), not
   to freeze a padding value nobody may ever adjust again.
   =========================================================================== */
section("THERE IS NO DEAD BAND UNDER THE BUTTON");
for (const [width, height] of [
  [390, 844],
  [1440, 900],
]) {
  const { ctx, page } = await openPage({ width, height });
  const m = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /share my result/i.test(b.textContent ?? ""),
    );
    const card = btn.closest("div");
    const status = card.querySelector("[role=status]");
    return {
      below: Math.round(card.getBoundingClientRect().bottom - btn.getBoundingClientRect().bottom),
      statusHeight: status ? Math.round(status.getBoundingClientRect().height) : null,
      statusPresent: Boolean(status),
    };
  });
  check(`${width}x${height}: under 32px below the button`, m.below <= 32, `${m.below}px`);
  check(
    `${width}x${height}: the idle status line reserves no height`,
    m.statusHeight === 0,
    `${m.statusHeight}px`,
  );
  /*
    AND IS STILL THERE. The cheap way to reclaim the space is `empty:hidden`,
    which is `display: none`, which takes the region out of the accessibility
    tree and puts it back already populated — the exact case screen readers
    miss. Zero-height and present is the version that still announces.
  */
  check(
    `${width}x${height}: and is still in the document to announce from`,
    m.statusPresent,
    "",
  );
  await ctx.close();
}

/* ===========================================================================
   3. NO TAP MAY BE SILENT, ON ANY BRANCH
   =========================================================================== */
section("EVERY BRANCH SAYS SOMETHING, AND SURVIVES ITSELF");

const BRANCHES = [
  {
    label: "the OS sheet opens and completes",
    hasTouch: true,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async () => {};
    },
  },
  {
    label: "the OS sheet is dismissed by the person",
    hasTouch: true,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async () => {
        throw new DOMException("cancelled", "AbortError");
      };
    },
  },
  {
    /*
      THE ONE THAT SHIPPED BROKEN, TWICE. share() resolves nothing, ever, and
      the page keeps focus because no sheet was presented. Measured on real
      desktop Chrome. Every desktop visitor is on this path now.
    */
    label: "the OS sheet NEVER OPENS (the reported failure)",
    hasTouch: false,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = () => new Promise(() => {});
    },
  },
  {
    label: "share throws a real error",
    hasTouch: true,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async () => {
        throw new TypeError("nope");
      };
    },
  },
  {
    label: "the sheet exists but will not take a file",
    hasTouch: true,
    stub: () => {
      Navigator.prototype.canShare = () => false;
      Navigator.prototype.share = async () => {};
    },
  },
  {
    label: "no Web Share API at all",
    hasTouch: false,
    stub: () => {
      delete Navigator.prototype.share;
      delete Navigator.prototype.canShare;
    },
  },
];

for (const b of BRANCHES) {
  const { ctx, page } = await openPage({
    width: 1024,
    height: 768,
    hasTouch: b.hasTouch,
    stub: b.stub,
  });
  await clickTrigger(page);
  const said = await waitForStatus(page);
  check(`${b.label}: the tap produces something perceivable`, Boolean(said),
    said ? `said "${said}"` : "NOTHING");

  /*
    AND THE CONTROL IS NOT SPENT. A real `disabled` is not how this button
    reports being busy any more (it would drop focus mid-share), so "still
    usable" is asked the only way that means anything: press it again and
    require a second answer. That is the regression guard for the re-entry ref
    being left true by a promise that never settled — the bug that made every
    later press a no-op for the life of the page.
  */
  await waitForSilence(page);
  await clickTrigger(page);
  const again = await waitForStatus(page);
  check(`${b.label}: a second press is answered too`, Boolean(again),
    again ? `said "${again}"` : "the control went dead after one press");

  const state = await page.evaluate(() => {
    const el = [...document.querySelectorAll("button")].find((x) =>
      /share my result|getting your picture/i.test(x.textContent ?? ""),
    );
    return {
      present: Boolean(el),
      hardDisabled: el?.disabled ?? null,
      label: el?.textContent?.trim(),
    };
  });
  check(
    `${b.label}: and it is still on the page, not hard-disabled`,
    state.present && state.hardDisabled === false,
    `disabled=${state.hardDisabled} label="${state.label}"`,
  );
  await ctx.close();
}

/* ===========================================================================
   4. THE HANG, IN DETAIL

   Section 3 proves the never-settling branch answers twice. This proves WHAT
   it does about it: the watchdog waits, decides no sheet was presented
   (because this document still has focus), says so, and leaves the link on
   the clipboard. A plain timeout would fire on a sheet somebody is reading,
   so the focus condition is asserted from both sides.
   =========================================================================== */
section("THE NEVER-SETTLING SHEET RECOVERS, AND ONLY WHEN IT SHOULD");
{
  const { ctx, page } = await openPage({
    width: 1024,
    height: 768,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = () => new Promise(() => {});
    },
  });
  const started = Date.now();
  await clickTrigger(page);
  const said = await waitForStatus(page, 9000);
  const took = Date.now() - started;

  check("it says the sheet did not open", /did not open/i.test(said), `said "${said}"`);
  check("and that the link was copied instead", /copied/i.test(said), `said "${said}"`);
  check("within a few seconds, not never", took < 8000, `${took}ms`);

  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(
    "the clipboard really holds the tagged challenge link",
    clip.includes("/beat/") && clip.includes("utm_content=copy_link"),
    clip.slice(0, 110) || "clipboard empty",
  );
  await ctx.close();
}
{
  /*
    THE OTHER SIDE OF THE CONDITION. A sheet a person is actually reading also
    leaves the promise pending, and the page loses focus while it is up. The
    watchdog must NOT cry wolf there. Focus is taken away here to stand in for
    the OS sheet having appeared.
  */
  const { ctx, page } = await openPage({
    width: 1024,
    height: 768,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = () => new Promise(() => {});
      // Stand in for a sheet that IS up: the document no longer has focus.
      document.hasFocus = () => false;
    },
  });
  await clickTrigger(page);
  await page.waitForTimeout(4000); // twice the watchdog
  const said = await page.evaluate(
    () =>
      [...document.querySelectorAll("[role=status]")]
        .map((n) => n.textContent?.trim())
        .find(Boolean) ?? "",
  );
  check(
    "a sheet that is genuinely up is left alone (no false alarm)",
    said === "",
    said ? `cried wolf: "${said}"` : "stayed quiet",
  );
  await ctx.close();
}

await browser.close();
console.log("-".repeat(74));
console.log(
  failures === 0
    ? "\nPASS: no tap goes unanswered, no press is the last one, and the button is where a person can see it.\n"
    : `\nFAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
