/**
 * What a RECIPIENT of a shared link sees, and what they must not see.
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-shared-view.mjs [baseUrl] [token]
 *
 * The token is optional and is MINTED against the target when it is left out,
 * so this runs from a plain `npm run`. See scripts/share-result.mjs, which
 * refuses to mint against production.
 *
 * ===========================================================================
 * WHAT THIS IS FOR
 * ===========================================================================
 * One token, two presentations. /results/[token] is the OWNER's receipt: score,
 * verdict and the full question-by-question review. /beat/[token] is what a
 * SHARED link opens: the same score and verdict as a dare, and no review.
 *
 * Hiding the review is a CONVERSION measure, not a privacy one, and the
 * distinction is the whole reason this file is worded carefully. A recipient
 * who can read the questions and the correct answers has been handed the
 * answer key to a test they are about to sit, so there is no reason left to
 * sit it. That is the thing being protected: the reason to take the test.
 *
 * ===========================================================================
 * WHAT THIS DOES *NOT* PROVE, AND MUST NOT BE READ AS PROVING
 * ===========================================================================
 * The token is SIGNED, NOT ENCRYPTED, and its payload carries the answers. A
 * recipient who base64-decodes the middle segment of the URL can read them —
 * see lib/test/result-token.ts, and the privacy policy, which already says
 * "encoded rather than encrypted" in as many words.
 *
 * So this suite asserts exactly one thing about leakage: the RENDERED PAGE
 * hands nothing over. It is not a security boundary, no assertion below should
 * be quoted as one, and if this file ever grows a check that implies the
 * answers are unreachable, that check is wrong.
 *
 * ===========================================================================
 * WHY IT ALSO ASSERTS THE OWNER'S VIEW
 * ===========================================================================
 * A suite that only proves ABSENCE goes green on a build where the review is
 * broken for everybody, including the person who earned it. So the same token
 * is opened both ways in section 1 and the two are compared: the review has to
 * be missing HERE and present THERE, and the scores have to agree. That is the
 * same lesson scripts/verify-results-after-send.mjs already learned about
 * proving a hiding.
 */
import { chromium } from "playwright-core";

import { mintShareToken } from "./share-result.mjs";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const TOKEN =
  process.argv[3] ?? (await mintShareToken(BASE, "scripts/verify-shared-view.mjs"));

const { GRADE_4_TEST: test } = await import("../lib/test/tests/grade-4.ts");

/** Exactly what the share control puts on the clipboard / into the OS sheet. */
const SHARED_URL =
  `${BASE}/beat/${encodeURIComponent(TOKEN)}` +
  `?utm_source=share&utm_medium=social&utm_content=native_sheet`;
const OWNER_URL = `${BASE}/results/${encodeURIComponent(TOKEN)}`;

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

async function open(url, { width = 1440, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(400);
  return { ctx, page };
}

/** "5/15" wherever it is written, so the two pages can be compared by score. */
const readScore = (text) => text.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/)?.[0] ?? null;

console.log(`\nSHARED VIEW  ${BASE}/beat/…`);

/* ===========================================================================
   1. THE SAME TOKEN, TWO PRESENTATIONS
   =========================================================================== */
section("ONE RESULT, TWO READERS");

const owner = await open(OWNER_URL);
const ownerText = await owner.page.evaluate(() => document.body.innerText);
const ownerDom = await owner.page.evaluate(() => document.documentElement.outerHTML);
const ownerScore = readScore(ownerText);
await owner.ctx.close();

const shared = await open(SHARED_URL);
const sharedText = await shared.page.evaluate(() => document.body.innerText);
const sharedDom = await shared.page.evaluate(() => document.documentElement.outerHTML);
const sharedSsr = await (await fetch(SHARED_URL)).text();
const sharedScore = readScore(sharedText);

check(
  "the owner's page shows a real score",
  Boolean(ownerScore) && !ownerText.includes("???"),
  ownerScore ?? "no score found",
);
check(
  "and the owner's page has the review on it",
  /<article/.test(ownerDom),
  "detail panel present",
);
check("the shared page shows a score too", Boolean(sharedScore), sharedScore ?? "none");
check(
  "and it is the SAME score, from the same token",
  Boolean(sharedScore) && sharedScore === ownerScore,
  `owner ${ownerScore} · shared ${sharedScore}`,
);
/*
  THE VERDICT IS A STICKER, SO ITS TEXT IS AN `alt`. Both this page and the
  owner's render the band as `certified-*.png` with the title as alternative
  text, and `innerText` does not include alt text — asking `sharedText` for it
  reports the verdict missing on a page that is showing it in 10rem of artwork.
  Asked here the way a screen reader would ask, which is also the only way that
  is true for both the image branch and the text fallback the page keeps for
  bands with no sticker.
*/
const verdictShown = await shared.page.evaluate(() => {
  const wanted = /smart fella|fart smella/i;
  const named = [...document.querySelectorAll("img[alt]")].some((n) =>
    wanted.test(n.getAttribute("alt") ?? ""),
  );
  return named || wanted.test(document.body.innerText);
});
check("the shared page shows the verdict", verdictShown, "as the certified sticker");

/* ===========================================================================
   2. NOTHING FROM THE BANK IS ON THE SHARED PAGE

   Three haystacks because they fail differently: the text a person reads, the
   serialized DOM after hydration, and the HTML off the server before any
   JavaScript ran. The RSC payload lives in a script tag inside that last one
   and is exactly where a real leak would sit.
   =========================================================================== */
section("THE RECIPIENT IS HANDED NO PART OF THE TEST");

const stems = test.items.map((i) => i.stem).filter(Boolean);
const explanations = test.items.map((i) => i.explanation).filter(Boolean);
/*
  Word options only, and the reasoning is copied from scripts/verify-gate-leak.mjs
  because the trap is the same one: a number-analogy option is "9" or "17", and a
  bare number matches a class name, a pixel value or a count in any page of
  markup. Those are false positives, and they are not a leak worth the name.
*/
const optionTexts = test.items
  .flatMap((i) => i.options.map((o) => o.text))
  .filter((t) => typeof t === "string" && t.length >= 4 && !/^[\d\s.,-]+$/.test(t));
const whys = test.items.flatMap((i) => i.options.map((o) => o.why).filter(Boolean));
/** The correct answers specifically — the part that spoils the test outright. */
const correctTexts = test.items
  .map((i) => i.options.find((o) => o.id === i.answer)?.text)
  .filter((t) => typeof t === "string" && t.length >= 4 && !/^[\d\s.,-]+$/.test(t));

/* Attribute values are stripped: our own class names and aria labels are our
   vocabulary colliding with the bank's, not content anybody can read. Script
   contents are deliberately left in. */
const stripAttrs = (html) =>
  html.replace(/=\s*"[^"]*"/g, "=''").replace(/=\s*'[^']*'/g, "=''");

const scan = (label, haystack, { skipSingleWords = false } = {}) => {
  for (const [what, list] of [
    ["question stems", stems],
    ["explanations", explanations],
    ["option text", optionTexts],
    ["correct answers", correctTexts],
    ["distractor notes", whys],
  ]) {
    const candidates =
      skipSingleWords && (what === "option text" || what === "correct answers")
        ? list.filter((v) => /\s/.test(v))
        : list;
    const hit = candidates.find((v) => haystack.includes(v));
    check(
      `${label}: no ${what}`,
      !hit,
      hit ? `found "${String(hit).slice(0, 46)}…"` : `${candidates.length} checked`,
    );
  }
};

scan("visible text", sharedText);
scan("hydrated DOM", stripAttrs(sharedDom), { skipSingleWords: true });
scan("server HTML", stripAttrs(sharedSsr), { skipSingleWords: true });

/*
  Structural, and stronger than the substring scan: the review is not styled
  out or blurred on this page, it is NOT RENDERED. If these hold there is
  nothing for a single word to have leaked from.
*/
for (const [name, pass] of [
  ["no detail panel element", !/<article/.test(sharedDom)],
  [
    "no option state labels",
    !/The right answer|You picked this|Your answer, and it is right/.test(sharedDom),
  ],
  ["no distractor heading", !/Why that one is tempting/.test(sharedDom)],
  ["no explanation heading", !/How it works|Why that is right/.test(sharedDom)],
  ["no prev/next controls", !/Previous question|Next question/.test(sharedDom)],
  ["no rendered question figures", !/data-surface="stem"/.test(sharedDom)],
  ["no per-question outcome markers", !/Correct<|Wrong<|Skipped</.test(sharedDom)],
]) {
  check(`structure: ${name}`, pass);
}

/* ===========================================================================
   3. THE POINT OF THE PAGE IS THE CALL TO ACTION
   =========================================================================== */
section("AND IS GIVEN A REASON TO TAKE IT");

const cta = await shared.page.evaluate(() => {
  const el = [...document.querySelectorAll("a")].find((a) =>
    /take the test/i.test(a.textContent ?? ""),
  );
  if (!el) return { present: false };
  const b = el.getBoundingClientRect();
  return {
    present: true,
    href: el.getAttribute("href"),
    inViewport: b.top >= 0 && b.bottom <= window.innerHeight,
    hittable: (() => {
      const hit = document.elementFromPoint(
        Math.round(b.left + b.width / 2),
        Math.round(b.top + b.height / 2),
      );
      return hit ? el.contains(hit) : false;
    })(),
  };
});
check("there is a 'take the test' control", cta.present, cta.href ?? "");
check("it is on screen and pressable", Boolean(cta.inViewport && cta.hittable));
check(
  "it points into the flow rather than back at this result",
  Boolean(cta.href) && !cta.href.includes("/beat/") && !cta.href.includes("/results/"),
  cta.href ?? "",
);
check(
  "the page frames the score as something to beat",
  /beat/i.test(sharedText),
  "the dare is on the page",
);
check(
  "and names nobody",
  /somebody/i.test(sharedText),
  "no name where a name would go",
);

/* ===========================================================================
   4. THE ARRIVAL SURVIVES INTO THE TEST

   The loop's last question is whether a recipient who goes on to take the test
   can be told apart from any other visitor. That rides on the `platform` super
   property, which is registered ONCE per page load from `utm_source` (see
   derivePlatform in lib/analytics/events.ts) and then rides every later event.

   Which makes the navigation type load-bearing, and invisible: a full page load
   on the way into the flow re-runs that registration on a URL with no
   `utm_source` and a same-origin referrer, which re-registers `platform` as
   "direct" and silently unattributes the visit. A client-side navigation does
   not, so the tag set on arrival is still the tag on `test_started`.

   Asserted by leaving a mark on `window` and requiring it to survive the trip.
   =========================================================================== */
section("A RECIPIENT WHO STARTS THE TEST IS STILL ATTRIBUTABLE");

check(
  "the shared link is tagged as a share",
  new globalThis.URL(SHARED_URL).searchParams.get("utm_source") === "share",
  "utm_source=share",
);

await shared.page.evaluate(() => {
  window.__survivedTheTrip = true;
});
await shared.page.getByRole("link", { name: /take the test/i }).click();
await shared.page.waitForURL((u) => !u.pathname.startsWith("/beat/"), { timeout: 15000 });
await shared.page.waitForTimeout(900);

const survived = await shared.page.evaluate(() => window.__survivedTheTrip === true);
/*
  IF THIS IS THE ASSERTION THAT JUST WENT RED, READ THIS BEFORE "FIXING" IT.

  It looks like a routing test. It is not. It is the only thing standing
  between this codebase and silently losing every share it ever converts.

  You have probably just changed a `<Link>` into an `<a>`, or added a
  `router.refresh()`, or moved the challenge page's CTA onto a redirect. Any
  of those turns the trip from /beat into the flow into a FULL PAGE LOAD, and
  a full load re-runs registerLaunchSuperProperties() on a URL that has no
  `utm_source` and a same-origin referrer — so `platform` is re-registered as
  "direct" and every event after it, INCLUDING test_started and
  test_completed, is filed as though the person arrived from nowhere.

  Nothing breaks. No error appears. The share loop simply stops being
  measurable, the recipients keep converting, and the numbers say the channel
  is dead. That is the failure this exists to prevent, and it is invisible in
  code review, which is why it is asserted here instead.

  The fix is to keep the navigation client-side, not to relax this check.
*/
check(
  "a recipient who starts the test is still attributed to the share",
  survived,
  survived
    ? "client-side nav — the arrival tag survives onto test_started"
    : "SHARE ATTRIBUTION SEVERED: a full page load re-registers platform as " +
      "'direct', so this recipient — and every future one — is counted as " +
      "organic. See the note above this check.",
);
check(
  "and it lands somewhere the test can actually be started",
  await shared.page
    .getByRole("button", { name: /start the test|i'm a kid|grade \d/i })
    .first()
    .isVisible()
    .catch(() => false),
);

await shared.ctx.close();
await browser.close();

console.log("-".repeat(74));
console.log(
  failures === 0
    ? "\nPASS: the recipient gets the score, the dare and no part of the test.\n"
    : `\nFAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
