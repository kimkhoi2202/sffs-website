/**
 * The score is hidden before a send, hidden after one, and reachable only by
 * the link — on BOTH audiences.
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
 * IT WALKS BOTH AUDIENCES, BECAUSE IT USED TO WALK ONE AND SAY NEITHER
 * ===========================================================================
 * Every run of this file used to click "I'm a kid", pick Grade 5, and stop.
 * That is one of the two ways to reach the gate, and the output never said so:
 * the headings read "BEFORE THE SEND, THE SCORE IS NOT THERE" with no mention
 * of who was being tested, so a green run looked like a statement about the
 * gate when it was a statement about the child gate.
 *
 * The adult path was therefore unasserted, and it is the path with the
 * DIFFERENT STRINGS in it: a different submit button, a different confirmation
 * headline, and a different sentence pointing at the inbox. Copy is exactly
 * what regressed last time and exactly what this file exists to pin, so the
 * half of the copy nobody was checking was the half most able to rot.
 *
 * Both audiences now run the whole suite, in their own browser context, and
 * EVERY LINE OF OUTPUT NAMES THE ONE IT BELONGS TO. A failure that does not
 * say which audience broke sends the next reader to the wrong component.
 *
 * ===========================================================================
 * IT ALSO PINS WHAT THE RESULTS SCREEN NO LONGER OFFERS
 * ===========================================================================
 * "Start over" was removed from the confirmation on 10 August. This file spent
 * the morning asserting it was still there, in the same loop as the two exits
 * that legitimately stayed, so a correct change made the suite permanently red
 * on both audiences — and a suite that always fails is one nobody reads, which
 * is exactly how six hours of email outage passed unnoticed the day before.
 *
 * The assertion is inverted rather than deleted, and part 7 adds the half that
 * nothing guarded at all: that the two places restarting was DELIBERATELY KEPT
 * still work. Removing a control is only correct if the thing it did is still
 * reachable where it belongs, and a lock-out would otherwise have shipped with
 * every suite green.
 *
 * The two are given their own context rather than their own page because the
 * recovery section in part 6 reads `localStorage`: one shared context would
 * have the second audience find the first one's token and pass section 6
 * without ever having earned it.
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

/** Nothing is actually sent to it; the route is fulfilled in the browser. */
const ADDRESS = "regression@example.com";

/**
 * The promise that regressed, in either audience's wording.
 *
 * The adult confirmation once ended "You can also see them right below" and
 * the child one "You can see your results right below". Both are false now,
 * and both are the specific failure this file was written after: a
 * confirmation that points at a score the screen does not have, so the person
 * hunts for it, does not find it, and does not open the email either.
 *
 * Matched loosely enough that a reworded version of the same lie is still
 * caught, rather than pinning the two exact sentences that happened to ship.
 */
const PROMISES_A_REVEAL = /right below|see (them|your results|your score)[^.]*below/i;

/**
 * The two ways to reach the gate.
 *
 * Only the walk in and the four strings differ; everything asserted about the
 * screen is identical, which is the claim being made — one gate, one
 * behaviour, two registers of voice.
 */
const AUDIENCES = [
  {
    id: "child",
    testId: "grade-5",
    /** "I'm a kid" straight to the grade picker. */
    enter: async (page) => {
      await page.getByRole("button", { name: /I'm a kid/i }).click();
      await page.getByRole("button", { name: "Grade 5" }).click();
    },
    submit: /send my results/i,
    sentHeadline: /sent!/i,
    /*
      The child register: it addresses the kid and points at a parent's inbox,
      rather than repeating the adult sentence at them.
    */
    pointsAtEmail: /link in it shows your results/i,
    bodyPattern: /Ask your parent[^.]*\./,
    /*
      A saved state that cannot resolve to a test, which is what the escape
      hatch in components/test/test-flow.tsx exists for. The two audiences fail
      in genuinely different ways and both are covered: a child state can name a
      grade with no bank behind it, which is the case the hatch's own comment
      cites, while `getTest("adult", …)` always resolves so the adult state has
      to lose the audience itself.
    */
    brokenState: { step: "intro", audience: "child", grade: 99 },
    brokenBecause: "a grade with no bank behind it",
  },
  {
    id: "adult",
    testId: "adult",
    /** "I'm an adult", then "Me" rather than "My kid", then the intro. */
    enter: async (page) => {
      await page.getByRole("button", { name: /^I'm an adult/i }).click();
      await page.getByRole("button", { name: /^Me\b/ }).click();
    },
    submit: /email me my results/i,
    sentHeadline: /check your email/i,
    pointsAtEmail: /open the link in the email to see them/i,
    bodyPattern: /Your results are on their way[^.]*\./,
    brokenState: { step: "results", audience: null, grade: null },
    brokenBecause: "a half-written state with no audience in it",
  },
];

let failures = 0;
/** Which audiences broke, so the last line of output can name them. */
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

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

/**
 * The whole suite, against one audience, in a context of its own.
 */
async function runAudience(spec) {
  current = spec.id;

  const test = getTestById(spec.testId);

  /** Every third one right, so the score is a number a bug could not guess. */
  const answers = {};
  test.items.forEach((item, i) => {
    answers[item.id] =
      i % 3 === 0 ? item.answer : item.options.find((o) => o.id !== item.answer).id;
  });
  const SCORE = test.items.filter((_, i) => i % 3 === 0).length;
  const REAL = `${SCORE}/${test.items.length}`;
  const MASKED = `???/${test.items.length}`;

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

  /**
   * Is any real question's own words on this page?
   *
   * NOT A SUBSTRING TEST ON THE RAW STEM, which is what this was and which
   * quietly only ever worked on one bank. A fill-in-the-blank stem holds
   * "______", and the review renders that blank as its own labelled element,
   * so the page reads "…was completely blank ." where the source says "…was
   * completely ______." The child bank's first item is an analogy with no
   * blank in it and matched literally; the adult bank's first item is a
   * sentence completion and did not — so the adult results page was reported
   * as having no question on it while a question sat in the middle of it.
   *
   * The comparison is made instead on the stem's runs of ordinary words,
   * against whitespace-normalised page text. Twelve characters is long enough
   * that only the real question satisfies it, and it no longer turns on how
   * whichever item the panel opens on happens to be punctuated.
   */
  const stemFragments = (stem) =>
    stem
      .split(/_{2,}/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter((part) => part.length >= 12);

  const showsAStem = (text) => {
    const flat = text.replace(/\s+/g, " ");
    return test.items.some(
      (i) => i.stem && stemFragments(i.stem).some((f) => flat.includes(f)),
    );
  };

  /** Everything the gate withholds, asked of the whole document at once. */
  const screenState = async () => {
    const dom = await page.evaluate(() => document.documentElement.outerHTML);
    const text = await page.evaluate(() => document.body.innerText);
    return {
      verdictSticker: /certified-(smart-fella|fart-smella)\.png/.test(dom),
      questionReview: /<article/.test(dom),
      shareControl: /Share my result/.test(dom),
      anyStem: showsAStem(text),
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

  await spec.enter(page);
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
    // `Next`, with no `Skip` alternative: the control does not move without a
    // selection now, and the click above supplies one on every question.
    await page.getByRole("button", { name: /^Next$/ }).click();
    await page.waitForTimeout(120);
  }
  // The page POSTs the finished attempt the instant the test ends; the gate
  // cannot send without the token that comes back.
  await page.waitForTimeout(2500);

  /* == 1. BEFORE: nothing earned is on the screen ========================= */
  console.log(`\nBEFORE THE SEND, THE SCORE IS NOT THERE  [${spec.id}]  ${BASE}`);
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
      await page.getByRole("button", { name: spec.submit }).isVisible(),
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
  await page.getByRole("button", { name: spec.submit }).click();
  await page.getByText(spec.sentHeadline).first().waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(900);

  /* == 3. AFTER: the screen says it went, and shows nothing ================ */
  console.log(`\nAFTER THE SEND, THE SCORE IS STILL NOT THERE  [${spec.id}]`);
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
  console.log(`\nWHAT IT SAYS INSTEAD  [${spec.id}]`);
  console.log("-".repeat(72));
  {
    const { text } = await screenState();
    check("it says the mail has gone", spec.sentHeadline.test(text));
    check("it names the address it went to", text.includes(ADDRESS));
    /*
      THE COPY HAS TO MOVE WITH THE BEHAVIOUR, IN BOTH REGISTERS. Each audience
      has its own sentence for this — the adult is told the link is in the
      email, the child is told to ask their parent to look — and each one is
      checked against its own wording rather than a shared phrase, because a
      shared phrase is how the child copy would end up being the adult copy.
    */
    check(
      "it points at the email rather than at this page",
      spec.pointsAtEmail.test(text),
      text.match(spec.bodyPattern)?.[0] ?? "(confirmation body not found)",
    );
    check(
      "and it promises no reveal on this screen",
      !PROMISES_A_REVEAL.test(text),
      text.match(PROMISES_A_REVEAL)?.[0] ?? "no such promise",
    );
    /*
      THE TWO EXITS THAT STAYED, AND THE THIRD THAT WENT.

      "Start over" was removed from this card on 10 August: restarting the test
      is not something a results screen should offer, and beside "tell us where
      to send it" it read as an equal option — a grade-3 child pressed it five
      seconds after scoring 15 out of 15. See the note at the foot of
      components/test/email-gate.tsx.

      THIS FILE ASSERTED THE OPPOSITE UNTIL NOW, and asserted it in the same
      loop as the two exits that legitimately stayed, so one stale entry made
      the suite permanently red on both audiences. A suite that always fails is
      a suite nobody reads, which is the failure mode that let six hours of
      email outage pass unnoticed on 9 August.

      The check is inverted rather than deleted. An assertion that the removal
      HELD is worth more than no assertion at all: this screen has regressed
      before, and "Start over" specifically has been added, moved and removed
      across three changes.
    */
    for (const [label, pattern] of [
      ["Send it again", /send it again/i],
      ["Wrong address? Use a different one", /use a different one/i],
    ]) {
      check(
        `"${label}" is still offered`,
        await page.getByRole("button", { name: pattern }).isVisible(),
      );
    }
    check(
      '"Start over" is gone from the confirmation, and stayed gone',
      (await page.getByRole("button", { name: /start over/i }).count()) === 0,
      `${await page.getByRole("button", { name: /start over/i }).count()} found`,
    );
  }

  /* == 5. and nothing later takes the glass off =========================== */
  console.log(`\nNOTHING ON THIS SCREEN EVER LIFTS IT  [${spec.id}]`);
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
      await page.getByRole("button", { name: spec.submit }).isVisible(),
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
  console.log(`\nTHE LINK IS THE WAY IN, AND IT STILL WORKS  [${spec.id}]`);
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

  /* == 7. restarting is still possible, just not from the results ========= */
  console.log(`\nRESTARTING STILL WORKS WHERE IT WAS KEPT  [${spec.id}]`);
  console.log("-".repeat(72));
  /*
    THE OTHER HALF OF REMOVING "Start over", AND THE HALF WITH NO GUARD.

    Taking a control away is only correct if the thing it did is still reachable
    where it belongs. `reset` in components/test/test-flow.tsx still backs two
    screens, and until now nothing asserted either of them — so the removal
    could quietly have become a lock-out and every suite would have stayed
    green.

    Both are checked per audience. The adult and child flows have drifted apart
    before: a revert once fixed the adult results screen and left the child one
    still showing the score, which is why this file walks both at all.
  */
  {
    /* -- a. mid-test, the quit control ------------------------------------ */
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await spec.enter(page);
    await page.getByRole("button", { name: /start the test/i }).click();
    await page.waitForTimeout(700);

    const quit = page.getByRole("button", { name: /^Quit the test$/i });
    check("the quit control is still offered mid-test", await quit.isVisible());

    await quit.click();
    await page.waitForTimeout(300);
    /*
      THE CONFIRMATION IS PART OF THE BEHAVIOUR, not an obstacle to click past.
      Quitting throws away answers and the clock does not stop, so a single
      stray tap must not do it.
    */
    check(
      "and it asks before throwing the attempt away",
      await page.getByText(/quit the test\?/i).first().isVisible(),
    );
    await page.getByRole("button", { name: /^Quit$/ }).click();
    await page.waitForTimeout(600);
    check(
      "confirming it lands back on the opening fork",
      await page.getByRole("button", { name: /I'm a kid/i }).isVisible(),
    );

    /* -- b. the "Something went sideways" hatch --------------------------- */
    /*
      The one screen that would otherwise be a dead end: a saved state that
      cannot resolve to a test renders neither the runner nor the gate, so
      without this it is a blank page with no way out.
    */
    await page.evaluate((broken) => {
      sessionStorage.setItem("sffs_test_v2", JSON.stringify(broken));
    }, spec.brokenState);
    await page.reload({ waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.waitForTimeout(700);

    check(
      `the dead-end screen appears for ${spec.brokenBecause}`,
      await page.getByText(/something went sideways/i).first().isVisible(),
    );
    const hatch = page.getByRole("button", { name: /start over/i });
    check("and it still offers a way out", await hatch.isVisible());

    await hatch.click();
    await page.waitForTimeout(600);
    check(
      "which returns to the opening fork rather than the blank page",
      await page.getByRole("button", { name: /I'm a kid/i }).isVisible(),
    );
    /*
      AND IT DOES NOT COME BACK. `reset` clears the stored state, but the
      persist effect immediately writes the fresh one over the top, so the
      question is not whether the key is gone — it is whether what replaced it
      still resolves. A reload is the only thing that actually answers that,
      and a hatch that reappeared here would be a loop with no exit.
    */
    await page.reload({ waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.waitForTimeout(700);
    check(
      "and the dead end does not come back on reload",
      (await page.getByText(/something went sideways/i).count()) === 0 &&
        (await page.getByRole("button", { name: /I'm a kid/i }).isVisible()),
    );
  }

  await page.screenshot({ path: `/tmp/results-after-send-${spec.id}.png`, fullPage: true });
  await ctx.close();
}

for (const spec of AUDIENCES) {
  await runAudience(spec);
}

await browser.close();

console.log("-".repeat(72));
if (failures === 0) {
  console.log(
    `\nPASS (${AUDIENCES.map((a) => a.id).join(" and ")}): hidden before the send, ` +
      `hidden after it, and reachable only by the link.\n`,
  );
} else {
  /*
    THE AUDIENCE IS THE FIRST THING THE LAST LINE SAYS. The two paths share one
    component and differ only in strings, so "which audience" is the difference
    between reading a copy table and reading a render branch.
  */
  console.log(`\nFAIL on ${[...broken].join(" and ")}: ${failures}\n`);
}
process.exit(failures === 0 ? 0 : 1);
