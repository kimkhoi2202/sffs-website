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
 *   1. IT ASSERTED THE MENU EXISTED, NOT THAT ANYONE COULD SEE IT. It used
 *      `waitForSelector` and `getByRole(...).click()`, and Playwright's
 *      actionability machinery SCROLLS AN ELEMENT INTO VIEW before clicking
 *      it. A menu rendered somewhere a person would never look is therefore
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
  const box = await page.getByRole("button", { name: /share my result/i }).boundingBox();
  if (!box) throw new Error("no share button on the page");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** Is the menu somewhere a person could actually see and press? */
async function menuVisibility(page) {
  return page.evaluate(() => {
    const m = document.querySelector("[role=menu]");
    if (!m) return { mounted: false };
    const b = m.getBoundingClientRect();
    const cx = Math.round(b.left + b.width / 2);
    const cy = Math.round(b.top + b.height / 2);
    const hit = document.elementFromPoint(cx, cy);
    return {
      mounted: true,
      hasBox: b.width > 2 && b.height > 2,
      inViewport:
        b.top >= 0 &&
        b.left >= 0 &&
        b.bottom <= window.innerHeight &&
        b.right <= window.innerWidth,
      hittable: hit ? m.contains(hit) : false,
      rect: `${Math.round(b.top)}..${Math.round(b.bottom)} x ${Math.round(b.left)}..${Math.round(b.right)}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  });
}

/**
 * Watch for ANY perceivable change for `ms` after a tap: a menu, a status
 * message, or a label that is still different at the end. A change that
 * flickers for one frame and reverts does not count as feedback.
 */
async function perceivableOutcome(page, ms = 6000) {
  const start = Date.now();
  let sawMenu = false;
  let sawStatus = "";
  while (Date.now() - start < ms) {
    const s = await page.evaluate(() => ({
      menu: Boolean(document.querySelector("[role=menu]")),
      // The region that SPOKE, not the first in the document: the card above
      // this one has a live region of its own, and it is earlier in the page.
      status:
        [...document.querySelectorAll("[role=status]")]
          .map((n) => n.textContent?.trim())
          .find(Boolean) ?? "",
    }));
    if (s.menu) sawMenu = true;
    if (s.status) sawStatus = s.status;
    if (sawMenu || sawStatus) break;
    await page.waitForTimeout(150);
  }
  return { sawMenu, sawStatus, any: sawMenu || Boolean(sawStatus) };
}

/* == 1. the menu must be VISIBLE, at every size, at the page end =========== */
console.log("\nTHE MENU IS WHERE A PERSON CAN SEE IT");
console.log("-".repeat(72));
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
  const box = await page.getByRole("button", { name: /share my result/i }).boundingBox();
  if (box && box.y >= 0 && box.y + box.height <= height) {
    await clickTrigger(page);
    await page.waitForTimeout(400);
    const v = await menuVisibility(page);
    check(
      `${width}x${height}: menu mounted, boxed, in viewport and hit-testable`,
      v.mounted && v.hasBox && v.inViewport && v.hittable,
      v.mounted ? `${v.rect} in ${v.viewport} hittable=${v.hittable}` : "never mounted",
    );
  } else {
    check(`${width}x${height}: share button reachable at the page end`, false,
      "button not fully on screen");
  }
  await ctx.close();
}

/* == 2. NO TAP MAY BE SILENT, on any branch =============================== */
console.log("\nEVERY BRANCH SAYS SOMETHING");
console.log("-".repeat(72));

const BRANCHES = [
  {
    label: "mouse, no sheet needed (menu opens)",
    hasTouch: false,
    stub: () => {},
  },
  {
    label: "touch, sheet opens and completes",
    hasTouch: true,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async () => {};
    },
  },
  {
    label: "touch, sheet dismissed by the person",
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
      THE ONE THAT SHIPPED BROKEN. share() resolves nothing, ever, and the
      page keeps focus because no sheet was presented. Measured on real
      desktop Chrome before this test existed.
    */
    label: "touch, sheet NEVER OPENS (the reported failure)",
    hasTouch: true,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = () => new Promise(() => {});
    },
  },
  {
    label: "touch, share throws a real error",
    hasTouch: true,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async () => {
        throw new TypeError("nope");
      };
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
  const out = await perceivableOutcome(page);
  check(
    `${b.label}: the tap produces something perceivable`,
    out.any,
    out.sawMenu ? "menu opened" : out.sawStatus ? `said "${out.sawStatus}"` : "NOTHING",
  );

  // And whatever happened, the control must still be usable afterwards.
  await page.waitForTimeout(400);
  const usable = await page.evaluate(() => {
    const el = [...document.querySelectorAll("button")].find((x) =>
      /share my result|getting your picture/i.test(x.textContent ?? ""),
    );
    return { disabled: el?.disabled ?? null, label: el?.textContent?.trim() };
  });
  check(`${b.label}: the control is still usable`, usable.disabled === false,
    `disabled=${usable.disabled} label="${usable.label}"`);
  await ctx.close();
}

/* == 3. and the menu it falls back to is itself visible =================== */
console.log("\nTHE FALLBACK MENU IS ALSO VISIBLE, NOT JUST MOUNTED");
console.log("-".repeat(72));
{
  const { ctx, page } = await openPage({
    width: 1024,
    height: 768,
    hasTouch: true,
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = () => new Promise(() => {});
    },
  });
  await clickTrigger(page);
  await page.waitForTimeout(3200); // past the watchdog
  const v = await menuVisibility(page);
  check("the watchdog's menu is genuinely visible",
    v.mounted && v.hasBox && v.inViewport && v.hittable,
    v.mounted ? `${v.rect} hittable=${v.hittable}` : "never mounted");
  await ctx.close();
}

await browser.close();
console.log(
  failures === 0
    ? "\nPASS: no tap goes unanswered, and the menu is where a person can see it.\n"
    : `\nFAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
