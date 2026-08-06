/**
 * The score is hidden before a send, hidden after one, and reachable only by
 * the link.
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-results-after-send.mjs [baseUrl]
 *
 * ===========================================================================
 * THIS FILE ASSERTED THE OPPOSITE THIS MORNING, AND THAT IS THE POINT
 * ===========================================================================
 * For part of one afternoon a confirmed send unblurred this screen in place,
 * and this suite existed to prove it: "???/15" before an address was handed
 * over and a readable "5/15" after. The reveal was taken back out on purpose —
 * a score on the screen leaves the email with no job, and the inbox is what
 * the whole flow is built to reach.
 *
 * So the pair is inverted rather than deleted, and the inverted pair is a
 * stronger statement than the original: THE SAME ELEMENT ON THE SAME SCREEN
 * READS "???/15" BEFORE THE SEND AND STILL READS IT AFTER. A suite that only
 * checked the before would pass on a build that reveals a second later.
 *
 * scripts/verify-gate-leak.mjs still owns the BEFORE side in depth — every
 * stem, every option, every explanation, in the rendered text, the hydrated
 * DOM and the server HTML. This does not duplicate that. It asserts what that
 * suite cannot see, because it never types an address: that handing one over
 * changes what the screen SAYS and not what it SHOWS.
 *
 * ===========================================================================
 * AND THAT THE LINK STILL WORKS, WHICH IS NOW LOAD-BEARING
 * ===========================================================================
 * With the reveal gone there is exactly one route to a score: /results/[token].
 * A suite that proved only the hiding would be green on a build where nobody
 * can ever see their result at all. So section 6 walks the recovery path end
 * to end — the browser remembers the emailed link, offers it back on a return
 * visit, and that page shows the real score, the question review and the share
 * control. That page is where sharing lives now.
 *
 * ===========================================================================
 * "VISIBLE" IS MEASURED, NOT ASSUMED
 * ===========================================================================
 * The house rule from scripts/verify-share-visible.mjs applies here more than
 * anywhere: an element being in the document is not the question a reader is
 * asking. A score can be present and inert, present and aria-hidden, present
 * behind a 5px blur, or present with no box at all — and the masked shape is
 * deliberately in the first three of those states. So the check reads the
 * computed filter chain, the inert/aria-hidden ancestry and the bounding box,
 * and only counts a score a person could actually read.
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
 *   3. What is under test is the CLIENT's contract: on a confirmed send the
 *      screen says so and reveals nothing. The server's send path has its own
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

/** Everything the gate withholds, asked of the whole document at once. */
const screenState = async () => {
  const dom = await page.evaluate(() => document.documentElement.outerHTML);
  const text = await page.evaluate(() => document.body.innerText);
  return {
    verdictSticker: /certified-(smart-fella|fart-smella)\.png/.test(dom),
    questionReview: /<article/.test(dom),
    shareControl: /Share my result/.test(dom),
    anyStem: test.items.some((i) => i.stem && text.includes(i.stem)),
    text,
  };
};

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
  const s = await screenState();
  check("the mask is what is on the card", masked.present, `looking for "${MASKED}"`);
  check("the real score is nowhere on the page", !real.present, `would be "${REAL}"`);
  check("no verdict sticker", !s.verdictSticker);
  check("no question review", !s.questionReview);
  check("no share control", !s.shareControl);
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
await page.waitForTimeout(900);

/* == 3. AFTER: the screen says it went, and shows nothing ================ */
console.log("\nAFTER THE SEND, THE SCORE IS STILL NOT THERE");
console.log("-".repeat(72));
{
  const real = await scoreState(REAL);
  const masked = await scoreState(MASKED);
  const s = await screenState();

  check(
    "the real score is still nowhere on the page",
    !real.present,
    real.present ? `"${REAL}" appeared` : `"${REAL}" absent`,
  );
  check("the mask is still the only number", masked.present, `looking for "${MASKED}"`);
  /*
    STILL BEHIND THE GLASS, not merely still present. A mask that stayed in the
    DOM while the blur came off it would pass a presence check and fail a
    person, and a mask that lost its `inert` would be readable to a screen
    reader whatever it looked like.
  */
  check(
    "and it is still blurred and still out of the accessibility tree",
    masked.blurred && masked.withheld,
    `blurred=${masked.blurred} withheld=${masked.withheld}`,
  );
  check("no verdict sticker arrived", !s.verdictSticker);
  check("no question review opened", !s.questionReview);
  check("no question stem is readable", !s.anyStem);
  check("no share control appeared on this screen", !s.shareControl);
}

/* == 4. and the confirmation is a real confirmation ===================== */
console.log("\nWHAT IT SAYS INSTEAD");
console.log("-".repeat(72));
{
  const { text } = await screenState();
  check("it says the mail has gone", /Sent!/i.test(text));
  check("it names the address it went to", text.includes(ADDRESS));
  /*
    THE COPY HAS TO MOVE WITH THE BEHAVIOUR. While the reveal existed this
    line read "You can see your results right below", which is now false. A
    confirmation that points at a score this screen does not have is the
    worst of both: the person hunts for it, does not find it, and does not
    open the email either.
  */
  check(
    "it points at the email rather than at this page",
    /link in it shows your results/i.test(text) && !/right below/i.test(text),
    text.match(/Ask your parent[^.]*\./)?.[0] ?? "(confirmation body not found)",
  );
  for (const label of [/send it again/i, /use a different one/i, /start over/i]) {
    check(
      `"${String(label).slice(1, -2)}" is still offered`,
      await page.getByRole("button", { name: label }).isVisible(),
    );
  }
}

/* == 5. and nothing later takes the glass off =========================== */
console.log("\nNOTHING ON THIS SCREEN EVER LIFTS IT");
console.log("-".repeat(72));
{
  /*
    THE TWO WAYS A REVEAL COULD SNEAK BACK. "Wrong address? Use a different
    one" returns the card to an empty form, and a refresh remounts the whole
    flow from persisted state. Both used to be the interesting cases for the
    opposite reason — they had to NOT re-blur — and both are now the cases
    where a leftover latch would show itself.
  */
  await page.getByRole("button", { name: /use a different one/i }).click();
  await page.waitForTimeout(400);
  check(
    "the address form comes back",
    await page.getByRole("button", { name: /send my results/i }).isVisible(),
  );
  check("and the score is still not on the page", !(await scoreState(REAL)).present);

  await page.reload({ waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(900);
  check("a refresh does not reveal it either", !(await scoreState(REAL)).present);
  check("and the mask is what comes back", (await scoreState(MASKED)).present);
  check("still no share control", !(await screenState()).shareControl);
}

/* == 6. the one route that does show it ================================= */
console.log("\nTHE LINK IS THE WAY IN, AND IT STILL WORKS");
console.log("-".repeat(72));
{
  const stored = await page.evaluate(() => localStorage.getItem("sffs_result_v1"));
  const saved = stored ? JSON.parse(stored) : null;
  check("the emailed link was kept in this browser", Boolean(saved?.token));
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
  {
    const s = await screenState();
    check(
      "the offer prints no score and no verdict",
      !s.text.includes(REAL) && !s.verdictSticker,
    );
  }

  /*
    AND THROUGH IT. This is the half that stops the whole change from being a
    lock-out: the link the email carries, which is the link this offer hands
    back, opens the real thing.
  */
  await offer.click();
  await page.waitForURL(/\/results\//, { timeout: 15000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(600);

  const real = await scoreState(REAL);
  const s = await screenState();
  check(
    "the results page shows the real score, readable",
    readable(real),
    real.present
      ? `"${REAL}" boxed=${real.boxed} onScreen=${real.onScreen} blurred=${real.blurred} withheld=${real.withheld}`
      : `"${REAL}" is not on the page at all`,
  );
  check("no mask on it", !(await scoreState(MASKED)).present);
  check("the verdict is there", s.verdictSticker);
  check("the question review is there", s.questionReview);
  check("a real question is in it", s.anyStem);
  /*
    THE SHARE CONTROL LIVES HERE AND NOWHERE ELSE. It was briefly on the
    in-flow screen too, while that screen revealed results; with the reveal
    gone this is the only page it appears on, and the only page it should.
  */
  check(
    "and the share control is on this page",
    await page.getByRole("button", { name: /share my result/i }).isVisible(),
  );
}

await page.screenshot({ path: "/tmp/results-after-send.png", fullPage: true });
await browser.close();

console.log("-".repeat(72));
console.log(
  failures === 0
    ? "\nPASS: hidden before the send, hidden after it, and reachable only by the link.\n"
    : `\nFAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
