/**
 * NO QUESTION CAN BE LEFT BEHIND. On every test, and on every kind of question.
 *
 *   npm run verify:answer-required
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-answer-required.mjs [baseUrl]
 *
 * ===========================================================================
 * WHAT IS BEING CLAIMED
 * ===========================================================================
 * Skipping is gone. The forward control refuses to move until the question on
 * screen has a selection, and that has to hold on all six tests — the adult
 * paper and the five child banks — because the two audiences have drifted
 * apart repeatedly and a fix landing on one of them is the normal failure here,
 * not the exotic one.
 *
 * Going BACKWARDS is untouched, and that is asserted rather than assumed:
 * reviewing an earlier answer is not skipping, and a guard that swallowed the
 * Back button would be a regression wearing the change's clothes.
 *
 * ===========================================================================
 * WHY IT WALKS ALL 125 ITEMS INSTEAD OF SAMPLING
 * ===========================================================================
 * The guard lives on the runner and every question kind reports its selection
 * through the same option group, so in principle one question would prove it.
 * That reasoning is exactly the reasoning that shipped an invisible prompt on
 * the LOGIC items for weeks: the behaviour was set per tier while everyone
 * assumed it was per item, and every check agreed with the assumption because
 * no check ever looked at an item.
 *
 * So this looks at every item. For each one it asserts the control is locked
 * before a selection, that pressing it anyway does not advance, that a
 * selection made THROUGH THAT ITEM'S OWN INPUT unlocks it, and that the next
 * question then arrives. A kind whose selection registered somewhere the guard
 * cannot see would advance while every other kind blocked, and that is the
 * gap this exists to close.
 *
 * The per-item results are ROLLED UP PER TEST rather than printed one by one —
 * 125 items times four assertions is not a report anybody reads — but every
 * failure names its question number and its kind, and the kinds exercised are
 * printed so a green run says what it actually covered.
 *
 * ===========================================================================
 * AND A STATIC CHECK, FOR THE RENDERERS NO BANK USES YET
 * ===========================================================================
 * Five renderers have no items in any bank today: figure/analogy,
 * figure/classification, fold, dot and polygon. A browser cannot walk what no
 * test contains, so `checkOneInteractionPath` reads the source instead and
 * pins the property the walk relies on — that there is ONE selection path and
 * every kind is wired to it. If somebody adds a sixth renderer with its own
 * onChange, that check fails even though no bank has an item for it yet.
 *
 * ===========================================================================
 * IT REFUSES PRODUCTION, FOR TWO REASONS RATHER THAN ONE
 * ===========================================================================
 * The usual one first: finishing a test writes a row (see harness-target.mjs).
 * The walk below is careful never to press the finish control, so it writes
 * nothing — but the timer section deliberately lets a clock run out, and that
 * submits.
 *
 * The second reason is the one the target guard does not know about. This
 * suite views 125 questions six times over, and on a production host
 * `instrumentation-client.ts` boots PostHog and every one of those is a real
 * `question_viewed` in the funnel. Six synthetic people have already been put
 * in there once by a verification run — see
 * docs/analytics/browser-automation-and-posthog.md. Against localhost or a
 * preview the SDK never initialises at all, so there is nothing to leak; the
 * internal stamp below is belt and braces for the day somebody maps a host.
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

import { resolveWriteTarget } from "./harness-target.mjs";

const BASE = resolveWriteTarget(process.argv[2], "scripts/verify-answer-required.mjs");
const { getTestById } = await import("../lib/test/tests/index.ts");

/* ==========================================================================
 * Reporting
 * ========================================================================== */

let failures = 0;
/** Which tests broke, so the last line can name them rather than a count. */
const broken = new Set();
let current = "";

const check = (name, pass, detail = "") => {
  if (!pass) {
    failures++;
    broken.add(current);
  }
  console.log(
    `${pass ? "  ok  " : "  FAIL"} [${current}] ${name}${detail ? `  — ${detail}` : ""}`,
  );
};

/** The renderer a question actually goes through, which is kind plus layout. */
const renderKey = (item) => (item.kind === "figure" ? `figure/${item.layout}` : item.kind);

/* ==========================================================================
 * The six tests, and how a person reaches each one
 * ========================================================================== */

const asChild = (grade) => async (page) => {
  await page.getByRole("button", { name: /I'm a kid/i }).click();
  await page.getByRole("button", { name: `Grade ${grade}`, exact: true }).click();
};

const TESTS = [
  {
    id: "adult",
    testId: "adult",
    /** "I'm an adult", then "Me" rather than "My kid". */
    enter: async (page) => {
      await page.getByRole("button", { name: /^I'm an adult/i }).click();
      await page.getByRole("button", { name: /^Me\b/ }).click();
    },
  },
  { id: "grade-3", testId: "grade-3", enter: asChild(3) },
  { id: "grade-4", testId: "grade-4", enter: asChild(4) },
  { id: "grade-5", testId: "grade-5", enter: asChild(5) },
  { id: "grade-6", testId: "grade-6", enter: asChild(6) },
  /* Grades 7 and 8 share one bank; 7 is the door to it. */
  { id: "grade-7-8", testId: "grade-7-8", enter: asChild(7) },
];

/* ==========================================================================
 * Browser plumbing
 * ========================================================================== */

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

/**
 * A context that starts clean and stamped.
 *
 * NOTHING CLEARS STORAGE HERE, and that is deliberate rather than an omission.
 * A new context begins with empty storage already, so there is nothing to
 * clear — and the version of this that "helpfully" cleared anyway did it from
 * an init script, which runs on EVERY navigation, so the reload in the timer
 * section wiped the attempt it had just been handed and the flow came back on
 * the opening fork. The other suites clear because they reuse one page across
 * several walks; this one takes a fresh context per walk instead.
 */
async function freshPage() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    try {
      // INTERNAL_STORAGE_KEY. Nothing should escape from a non-production host,
      // but anything that does is stamped out of the public metrics.
      localStorage.setItem("sffs_ph_internal", "1");
    } catch {
      /* storage blocked; the stamp is belt and braces anyway */
    }
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  return { ctx, page };
}

/** The forward control, whichever of the two it is on this question. */
const forwardOn = (page, isLast) =>
  page.getByRole("button", { name: isLast ? /^See my result$/ : /^Next$/ });

/** "7 / 50" in the header, as a zero-based index. Null if it cannot be read. */
async function currentIndex(page) {
  const text = await page.locator("header").first().innerText();
  const m = /(\d+)\s*\/\s*(\d+)/.exec(text.replace(/\n/g, " "));
  return m ? Number(m[1]) - 1 : null;
}

/**
 * Press a control the guard is refusing.
 *
 * `force`, and the reason is worth knowing: Playwright's actionability check
 * treats `aria-disabled="true"` as not-enabled and will sit there until it
 * times out. That is a useful property — a suite that walks the test without
 * answering now fails loudly instead of looping — but this suite's whole job
 * is to be the finger that presses anyway, so it opts out.
 */
const pressRefused = (locator) => locator.click({ force: true });

/* ==========================================================================
 * 1. The walk: every item of every test
 * ========================================================================== */

async function walk(spec) {
  current = spec.id;
  const test = getTestById(spec.testId);
  const total = test.items.length;

  const { ctx, page } = await freshPage();
  await spec.enter(page);
  await page.getByRole("button", { name: /start the test/i }).click();
  await page.waitForTimeout(700);

  /** Per-assertion tallies, and the questions that broke each one. */
  const tally = {
    locked: [],
    heldStill: [],
    unlocked: [],
    advanced: [],
  };
  const kinds = new Map();

  for (let i = 0; i < total; i++) {
    const item = test.items[i];
    const key = renderKey(item);
    kinds.set(key, (kinds.get(key) ?? 0) + 1);
    const isLast = i === total - 1;
    const where = `q${i + 1} (${key})`;

    const forward = forwardOn(page, isLast);
    await page.locator("main label").first().waitFor({ state: "visible", timeout: 15000 });

    /* -- a. it is locked, and says so ---------------------------------- */
    if ((await forward.getAttribute("aria-disabled")) !== "true") tally.locked.push(where);

    /* -- b. pressing it anyway does not move ---------------------------- */
    await pressRefused(forward);
    await page.waitForTimeout(90);
    const stillHere = (await currentIndex(page)) === i;
    // On the last question the failure to guard would be a finished test
    // rather than a wrong number, so the runner still being on screen is the
    // thing worth asserting there.
    const stillInTest = await page.locator("[data-surface=clock]").count();
    if (!stillHere || stillInTest === 0) tally.heldStill.push(where);

    /* -- c. a selection MADE THROUGH THIS ITEM'S OWN INPUT unlocks it ---- */
    /*
      Clicked on the label, which is what a finger hits, so the path under
      test is the real one: label -> hidden radio -> onChange -> onSelect ->
      the runner's answer map. A figural option and a text row differ in every
      visible respect and share exactly this.
    */
    await page.locator("main label").nth(item.options.length - 1).click();
    await page.waitForTimeout(120);
    if ((await forward.getAttribute("aria-disabled")) !== null) tally.unlocked.push(where);

    /* -- d. and now it goes ---------------------------------------------- */
    if (isLast) {
      /*
        NOT PRESSED. Finishing writes a row and mints a token, and this suite
        has no business creating one on every run — see the header. That the
        last control unlocks is what matters here; that it then finishes is
        covered where a finished attempt is the point (verify-gate-leak,
        verify-results-after-send), and both of those now walk a test that
        cannot be skipped, so they exercise it too.
      */
      break;
    }
    await forward.click();
    await page.waitForTimeout(110);
    if ((await currentIndex(page)) !== i + 1) tally.advanced.push(where);
  }

  const listed = (misses) => (misses.length ? misses.slice(0, 4).join(", ") : `${total}/${total}`);
  check("locked on every question before an answer", tally.locked.length === 0, listed(tally.locked));
  check("a refused press never advances", tally.heldStill.length === 0, listed(tally.heldStill));
  check("a selection unlocks it, on every question", tally.unlocked.length === 0, listed(tally.unlocked));
  check(
    "and it advances once answered",
    tally.advanced.length === 0,
    tally.advanced.length ? tally.advanced.slice(0, 4).join(", ") : `${total - 1}/${total - 1}`,
  );
  check(
    "every kind in this bank was exercised",
    kinds.size > 0,
    [...kinds].map(([k, n]) => `${k}x${n}`).join(" "),
  );

  await ctx.close();
  return kinds;
}

/* ==========================================================================
 * 2. Backwards, which is not skipping
 * ========================================================================== */

async function backwards(spec) {
  current = spec.id;
  const test = getTestById(spec.testId);
  const { ctx, page } = await freshPage();
  await spec.enter(page);
  await page.getByRole("button", { name: /start the test/i }).click();
  await page.waitForTimeout(700);

  const back = page.getByRole("button", { name: /^Previous question$/ });

  if (!test.allowBack) {
    /*
      The adult test has no Back and that is deliberate, not an oversight the
      guard should have fixed: a one-way pass under a clock is part of what
      fifteen minutes measures, and the intro says so before the clock starts.
    */
    check("no Back control, as the adult test intends", (await back.count()) === 0);
    await ctx.close();
    return;
  }

  check("Back is present but inert on the first question", await back.isDisabled());

  await page.locator("main label").first().click();
  await page.waitForTimeout(120);
  await forwardOn(page, false).click();
  await page.waitForTimeout(200);
  check("moved on after answering", (await currentIndex(page)) === 1);

  /* The guard must not have eaten the way back. */
  check("Back is live on the second question", !(await back.isDisabled()));
  await back.click();
  await page.waitForTimeout(200);
  check("and it returns to the first", (await currentIndex(page)) === 0);

  const picked = await page.locator('main input[type="radio"]:checked').count();
  check("the answer given earlier is still selected", picked === 1);
  check(
    "so the forward control is open again, not re-locked",
    (await forwardOn(page, false).getAttribute("aria-disabled")) === null,
  );

  await ctx.close();
}

/* ==========================================================================
 * 3. Quitting, which must not become unreachable
 * ========================================================================== */

async function quitting(spec) {
  current = spec.id;
  const { ctx, page } = await freshPage();
  await spec.enter(page);
  await page.getByRole("button", { name: /start the test/i }).click();
  await page.waitForTimeout(700);

  /*
    Deliberately on an UNANSWERED question, which is the state the guard
    creates and therefore the state in which being unable to leave would be
    this change's fault.
  */
  const quit = page.getByRole("button", { name: /^Quit the test$/i });
  check("the quit control is reachable from a locked question", await quit.isVisible());
  await quit.click();
  await page.waitForTimeout(250);
  check("it still asks first", await page.getByText(/quit the test\?/i).first().isVisible());
  await page.getByRole("button", { name: /^Quit$/ }).click();
  await page.waitForTimeout(500);
  check(
    "and quitting lands back on the opening fork",
    await page.getByRole("button", { name: /I'm a kid/i }).isVisible(),
  );

  await ctx.close();
}

/* ==========================================================================
 * 4. The clock, which is the other way out
 * ========================================================================== */

async function clockStillEnds(spec) {
  current = spec.id;
  const { ctx, page } = await freshPage();
  await spec.enter(page);
  await page.getByRole("button", { name: /start the test/i }).click();
  await page.waitForTimeout(700);

  /*
    THE POINT OF THIS SECTION. Requiring an answer would be a trap if it could
    produce a question somebody cannot leave, so the clock is made to run out
    while the forward control is refusing, and it still has to end the test.
    Answer nothing, and let it hit zero.

    The deadline is rewritten rather than waited out — five minutes, or fifteen
    on the adult paper, is not a suite. It is stored as an ABSOLUTE timestamp
    (lib/test/session.ts) precisely so it can be reasoned about this way, and
    moving it forward exercises the REAL path: the runner's own interval sees
    zero and calls onFinish(true). A deadline already in the past would take
    the restore shortcut in test-flow.tsx instead and prove something else.
  */
  const locked = await forwardOn(page, false).getAttribute("aria-disabled");
  check("the clock is running on a locked question", locked === "true");

  /*
    A GENEROUS DEADLINE, AND THEN A WAIT ON THE EVENT RATHER THAN A SLEEP. The
    first version of this gave the clock three seconds and then asserted the
    question was still up — which the reload sometimes spent on its own, so the
    suite occasionally caught the test already over and called that a failure.
    A verification that is a race is not a verification.
  */
  await page.evaluate(() => {
    const raw = sessionStorage.getItem("sffs_test_v2");
    const state = JSON.parse(raw);
    state.deadlineAt = Date.now() + 15000;
    sessionStorage.setItem("sffs_test_v2", JSON.stringify(state));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const clock = page.locator("[data-surface=clock]");
  await page.waitForTimeout(400);
  check("the restored attempt is still a question, not yet a result", (await clock.count()) > 0);
  check(
    "and it is still refusing to move",
    (await forwardOn(page, false).getAttribute("aria-disabled")) === "true",
  );

  const ended = await clock
    .waitFor({ state: "detached", timeout: 25000 })
    .then(() => true)
    .catch(() => false);
  check("time up ends the test from an unanswered question", ended);

  /*
    The masked score, read the way verify-gate-leak reads it. `getByText` on a
    run of question marks is fussier than it looks; what a person sees on that
    screen is the string, so that is what is asked for.
  */
  await page.waitForTimeout(1200);
  const body = await page.evaluate(() => document.body.innerText);
  check(
    "and it lands on the gated results, not on a dead screen",
    body.includes("???"),
    body.slice(0, 60).replace(/\n/g, " "),
  );

  await ctx.close();
}

/* ==========================================================================
 * 5. One selection path, including for the renderers no bank uses yet
 * ========================================================================== */

function checkOneInteractionPath(kindsSeen) {
  current = "source";

  const view = readFileSync(
    new URL("../components/test/question/question-view.tsx", import.meta.url),
    "utf8",
  );
  const card = readFileSync(
    new URL("../components/test/question/option-card.tsx", import.meta.url),
    "utf8",
  );
  const types = readFileSync(new URL("../lib/test/types.ts", import.meta.url), "utf8");

  /* -- a. every kind the schema declares has a branch ------------------- */
  const declared = [...types.matchAll(/^\s*kind: "(\w+)";$/gm)].map((m) => m[1]);
  const branched = new Set([...view.matchAll(/item\.kind === "(\w+)"/g)].map((m) => m[1]));
  const unrouted = declared.filter((k) => !branched.has(k));
  check(
    "every declared item kind is drawn by the shared question view",
    unrouted.length === 0 && declared.length > 0,
    unrouted.length ? `unrouted: ${unrouted.join(", ")}` : `${declared.length} kinds`,
  );

  /* -- b. one wiring, spread into every option ---------------------------- */
  /*
    This is the property the whole guard rests on: an option reports its
    selection through `onPick`, which is the runner's answer map, and it is
    the same `shared` object in every branch. A renderer that wrote its own
    `onSelect` would be a second path, and the guard reads only the first.
  */
  const wirings = view.match(/const shared = \{ name, onSelect: onPick \};/g) ?? [];
  check("the selection is wired once", wirings.length === 1);

  const cards = [...view.matchAll(/<(TextOptionCard|VisualOptionCard)\b([\s\S]*?)\/>/g)];
  const unshared = cards.filter(([, , attrs]) => !attrs.includes("{...shared}"));
  check(
    "and every option renderer is spread from that one wiring",
    cards.length > 0 && unshared.length === 0,
    `${cards.length} option renderers`,
  );

  const strays = [...view.matchAll(/onSelect=|onChange=/g)];
  check("no branch binds a selection handler of its own", strays.length === 0);

  /* -- c. and the option cards report through a real radio ---------------- */
  const radios = [...card.matchAll(/onChange=\{\(\) => onSelect\(id\)\}/g)];
  check(
    "each option card reports through its radio",
    radios.length === 2,
    `${radios.length} of 2 (text, visual)`,
  );

  /* -- d. say plainly which renderers the walk could not reach ------------ */
  /*
    Not a failure. figure/analogy, figure/classification, fold, dot and polygon
    render fine and are wired to the same path (a and b above), but no bank
    contains an item for them, so no player can meet one and no browser can
    walk one. The day a bank gains one, the walk picks it up with no change
    here — which is why this prints rather than asserts.
  */
  const layouts = [...view.matchAll(/item\.layout === "([a-z-]+)"/g)].map((m) => m[1]);
  const drawable = new Set([
    ...declared.filter((k) => k !== "figure"),
    ...layouts.map((l) => `figure/${l}`),
    "figure/odd-one-out",
  ]);
  const unreachable = [...drawable].filter((k) => !kindsSeen.has(k)).sort();
  console.log(
    `\n  note  ${unreachable.length} renderer(s) no bank uses yet, so nothing walked them: ` +
      `${unreachable.join(", ") || "none"}`,
  );
  console.log(
    `  note  ${[...kindsSeen.keys()].sort().join(", ")} were each walked on every item that uses them.`,
  );
}

/* ==========================================================================
 * Run
 * ========================================================================== */

console.log(`\nAN ANSWER IS REQUIRED  ${BASE}\n${"=".repeat(72)}`);

const kindsSeen = new Map();
for (const spec of TESTS) {
  const test = getTestById(spec.testId);
  console.log(`\n${spec.id}  (${test.items.length} items, back ${test.allowBack ? "on" : "off"})`);
  console.log("-".repeat(72));
  const kinds = await walk(spec);
  for (const [k, n] of kinds) kindsSeen.set(k, (kindsSeen.get(k) ?? 0) + n);
  await backwards(spec);
}

/*
  The three exits are checked on one test per audience rather than on all six.
  They are runner behaviour with no per-bank content in them, and the audience
  split is the one that has actually broken before.
*/
console.log(`\nTHE WAYS OUT\n${"-".repeat(72)}`);
for (const spec of [TESTS[0], TESTS[3]]) {
  await quitting(spec);
  await clockStillEnds(spec);
}

console.log(`\nONE SELECTION PATH\n${"-".repeat(72)}`);
checkOneInteractionPath(kindsSeen);

await browser.close();

console.log("\n" + "=".repeat(72));
console.log(
  failures === 0
    ? "PASS: nothing advances unanswered, and everything still ends.\n"
    : `FAIL: ${failures} check(s), in ${[...broken].join(", ")}.\n`,
);
process.exit(failures === 0 ? 0 : 1);
