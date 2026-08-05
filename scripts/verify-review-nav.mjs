/**
 * Does clicking a question actually put THAT question on the screen?
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-review-nav.mjs [baseUrl] [token]
 *
 * ===========================================================================
 * WHY THIS EXISTS, WHEN THERE WAS ALREADY A SUITE THAT PASSED
 * ===========================================================================
 * The review pane was reported dead twice: the list showed all fifty items with
 * their marks, the panel read "1 OF 50", PREV was disabled and NEXT was not, and
 * clicking a row changed nothing. Every existing check was green throughout,
 * because every existing check reads DATA — the bank validates, the token
 * round-trips, the scoring is right — and none of them ask what a person ends up
 * looking at. A pane wired to the wrong index, and a pane wired to nothing at
 * all, both pass a data suite.
 *
 * So the assertion here is deliberately end-to-end and deliberately visual:
 * click item N, and item N must be IN THE PANEL — its number, its tier, and real
 * question content. Not "the handler is attached", which is true of a component
 * that has been given the wrong array; not "the state changed", which is true of
 * a panel that never re-reads it.
 *
 * ===========================================================================
 * IT NEVER USES locator.click(), AND THAT IS THE POINT
 * ===========================================================================
 * Playwright scrolls an element into view before clicking it, so a row a person
 * could never land a click on is still clickable by a test — the same blind spot
 * that let a share menu pass 36 assertions while it was rendered off-screen (see
 * scripts/verify-share-visible.mjs). This drives the real mouse at the row's own
 * on-screen coordinates and hit-tests that point first, so an overlay, a
 * stacking-context slip or a pane that clips its own rows fails here instead of
 * passing.
 *
 * The list is also scrolled with a REAL WHEEL rather than by setting scrollTop,
 * because the site runs Lenis and Lenis swallowed wheel events over this exact
 * pane once already (see the note in components/test/review/question-review.tsx).
 * A synthetic scroll would not have caught that and does not prove this.
 *
 * ===========================================================================
 * THE HYDRATION CHECK IS NOT A FORMALITY
 * ===========================================================================
 * A results page whose client JS never ran renders this screen EXACTLY: fifty
 * rows with the right marks, "1 OF 50", PREV disabled, NEXT enabled, a list that
 * still scrolls because that part is CSS — and all three navigation paths dead.
 * It is indistinguishable from a broken component by eye, so the first thing
 * asserted is that the pane is actually hydrated, which names that cause instead
 * of leaving it to be rediscovered.
 *
 * THE TOKEN IS MINTED, NOT HARD-CODED. A literal token in a script expires
 * against whatever secret signed it and then the suite has to be edited to stay
 * green, which is how assertions get loosened. This asks the running server for
 * a fresh one.
 */
import { chromium } from "playwright-core";

import { ADULT_TEST } from "../lib/test/tests/adult.ts";

const BASE = process.argv[2] ?? "http://localhost:3000";

let failures = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
};

/**
 * A result with all three marks on it, so the list renders correct, wrong and
 * skipped rows rather than fifty of one kind.
 */
async function mintToken() {
  const answers = {};
  ADULT_TEST.items.forEach((item, i) => {
    if (i % 7 === 6) return; // left blank
    if (i % 3 === 0) {
      answers[item.id] = item.answer;
      return;
    }
    const wrong = item.options.find((o) => o.id !== item.answer);
    if (wrong) answers[item.id] = wrong.id;
  });
  const res = await fetch(`${BASE}/api/test-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      testId: ADULT_TEST.id,
      answers,
      elapsedSeconds: 900,
      timedOut: false,
    }),
  });
  const body = await res.json();
  if (!body?.ok || !body.token) throw new Error(`could not mint a result: ${JSON.stringify(body)}`);
  return body.token;
}

const TOKEN = process.argv[3] ?? (await mintToken());
const URL_RESULTS = `${BASE}/results/${encodeURIComponent(TOKEN)}`;

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e?.message ?? e)));

await page.goto(URL_RESULTS, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForTimeout(800);

const LIST = "ol[data-lenis-prevent] li button";

/** What the detail panel is actually showing right now. */
const panel = () =>
  page.evaluate(() => {
    const article = document.querySelector("article");
    if (!article) return null;
    const spans = article.querySelectorAll("header span");
    const stimulus = article.children[1];
    return {
      index: spans[0]?.textContent?.trim() ?? null,
      tier: spans[1]?.textContent?.trim() ?? null,
      questionChars: stimulus ? stimulus.innerText.replace(/\s+/g, " ").trim().length : 0,
      figures: stimulus ? stimulus.querySelectorAll("svg").length : 0,
    };
  });

/**
 * Where row `i` sits, relative to the viewport AND to the list's own scroll box,
 * plus whether a click at its centre would actually land on it.
 */
const rowPoint = (i) =>
  page.evaluate(
    ([sel, idx]) => {
      const ol = document.querySelector("ol[data-lenis-prevent]");
      const b = document.querySelectorAll(sel)[idx];
      if (!ol || !b) return null;
      const box = ol.getBoundingClientRect();
      const r = b.getBoundingClientRect();
      const visibleTop = Math.max(box.top, 0);
      const visibleBottom = Math.min(box.bottom, window.innerHeight);
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const inViewport = cy > 0 && cy < window.innerHeight;
      const hit = inViewport ? document.elementFromPoint(cx, cy) : null;
      return {
        cx: Math.round(cx),
        cy: Math.round(cy),
        reaches: hit ? b.contains(hit) || b === hit : false,
        blockedBy: hit ? hit.tagName.toLowerCase() : "off the bottom of the window",
        inViewport,
        // the list box needs enough of itself on screen to be wheeled usefully
        listUsable: visibleBottom - visibleTop > 120,
        listAbove: box.bottom < window.innerHeight * 0.5,
        listCx: Math.round(box.left + box.width / 2),
        listCy: Math.round((visibleTop + visibleBottom) / 2),
        rowAbove: r.top < box.top,
        rowBelow: r.bottom > box.bottom,
      };
    },
    [LIST, i],
  );

/**
 * Put row `i` somewhere a person could click it, using REAL wheel gestures in
 * whichever direction it actually lies — first scrolling the page so the list is
 * on screen, then scrolling the list itself. Never sets scrollTop: see the note
 * about Lenis at the top of this file.
 */
async function revealRow(i) {
  const { height } = page.viewportSize();
  // A wheel from the margin OUTSIDE the card moves the page: a wheel over the
  // list moves the list, and `overscroll-behavior: contain` stops that chaining
  // out to the document once the list hits an end.
  const pageWheel = async (dy) => {
    await page.mouse.move(20, Math.round(height / 2));
    await page.mouse.wheel(0, dy);
  };
  let blockedRunning = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    const p = await rowPoint(i);
    if (!p) return null;
    if (p.reaches) return p;

    if (p.rowAbove || p.rowBelow) {
      // Scrolled out of the list's OWN box: wheel the list towards it.
      if (p.listUsable) {
        await page.mouse.move(p.listCx, p.listCy);
        await page.mouse.wheel(0, p.rowAbove ? -200 : 200);
      } else {
        await pageWheel(p.listAbove ? -260 : 260);
      }
    } else if (!p.inViewport) {
      // Inside the list, but the list is hanging off the window: move the page.
      await pageWheel(p.cy <= 0 ? -240 : 240);
    } else {
      // On screen, inside its own box, and a click at its centre still lands on
      // something else. That is an overlay, and it is the finding — but let the
      // smooth scroll settle first so a mid-animation frame is not mistaken for
      // one.
      if (++blockedRunning >= 3) return p;
      await page.waitForTimeout(250);
      continue;
    }
    blockedRunning = 0;
    await page.waitForTimeout(45);
  }
  return rowPoint(i);
}

/**
 * Wait up to `ms` for a press to produce ANYTHING a person could notice: a
 * sheet, a spoken status line, or a label that changed. Returns what it was,
 * or null if the control stayed silent.
 */
async function perceivable(target, ms = 8000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const seen = await target.evaluate(() => {
      const said = [...document.querySelectorAll("[role=status]")]
        .map((n) => n.textContent?.trim())
        .find(Boolean);
      if (said) return `said "${said}"`;
      if (document.querySelector("[role=dialog], [role=menu]")) return "a sheet opened";
      return [...document.querySelectorAll("button")].some((b) =>
        /link copied|picture saved/i.test(b.textContent ?? ""),
      )
        ? "the label changed"
        : null;
    });
    if (seen) return seen;
    await target.waitForTimeout(200);
  }
  return null;
}

/** PREV / NEXT, measured the same way the rows are. */
const controlState = (which) =>
  page.evaluate(
    (name) => {
      const b = [...document.querySelectorAll("button")].find((x) =>
        new RegExp(`${name} question`, "i").test(x.getAttribute("aria-label") ?? ""),
      );
      if (!b) return null;
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const inViewport = r.top > 0 && r.bottom < window.innerHeight;
      const hit = inViewport ? document.elementFromPoint(cx, cy) : null;
      return {
        disabled: b.disabled,
        inViewport,
        cx: Math.round(cx),
        cy: Math.round(cy),
        // Room is reserved around these for hover displacement; they were
        // clipped at the column edge once. A centre that lands on something
        // else is that bug coming back.
        reaches: hit ? b.contains(hit) || b === hit : false,
        blockedBy: hit ? hit.tagName.toLowerCase() : "nothing",
      };
    },
    which,
  );

/** Scroll the control into the viewport with a real wheel, then really click it. */
async function clickControl(which) {
  const { height } = page.viewportSize();
  for (let attempt = 0; attempt < 60; attempt++) {
    const s = await controlState(which);
    if (!s) return { clicked: false, detail: `no ${which} button` };
    if (s.inViewport && s.reaches) {
      await page.mouse.click(s.cx, s.cy);
      await page.waitForTimeout(200);
      return { clicked: true, detail: "" };
    }
    await page.mouse.move(20, Math.round(height / 2));
    await page.mouse.wheel(0, s.cy > height ? 200 : -200);
    await page.waitForTimeout(45);
  }
  const s = await controlState(which);
  return { clicked: false, detail: `unreachable (behind ${s?.blockedBy ?? "?"})` };
}

/* == 1. the pane is alive at all ========================================== */
console.log("\nTHE REVIEW PANE IS HYDRATED (a dead page renders this screen too)");
console.log("-".repeat(72));
{
  const live = await page.evaluate((sel) => {
    const b = document.querySelector(sel);
    if (!b) return { found: false };
    const props = Object.keys(b).find((k) => k.startsWith("__reactProps$"));
    return { found: true, wired: Boolean(props && typeof b[props].onClick === "function") };
  }, LIST);
  check("the list rows carry a live click handler", live.found && live.wired,
    live.found ? `wired=${live.wired}` : "no rows rendered");
  check("nothing threw on the way in", pageErrors.length === 0, pageErrors.join(" | "));
}

/* == 2. every row puts ITS question in the panel =========================== */
console.log("\nCLICKING ITEM N PUTS ITEM N IN THE PANEL");
console.log("-".repeat(72));
const total = await page.locator(LIST).count();
check(`the list holds every item`, total === ADULT_TEST.items.length, `${total} rows`);

const wrongPanel = [];
const unreachable = [];
const empty = [];
for (let i = 0; i < total; i++) {
  const p = await revealRow(i);
  if (!p?.reaches) {
    unreachable.push(`${i + 1}${p?.blockedBy ? ` (behind ${p.blockedBy})` : ""}`);
    continue;
  }
  await page.mouse.click(p.cx, p.cy);
  await page.waitForTimeout(90);
  const shown = await panel();
  const item = ADULT_TEST.items[i];
  if (shown?.index !== `${i + 1} of ${total}` || shown?.tier !== item.tier) {
    wrongPanel.push(`${i + 1}: panel says "${shown?.index} / ${shown?.tier}"`);
  } else if (shown.questionChars < 12 && shown.figures === 0) {
    // The pane moved but arrived empty — the other way this screen lies.
    empty.push(String(i + 1));
  }
}
check("every row can actually be clicked where it sits", unreachable.length === 0,
  unreachable.slice(0, 5).join(", "));
check("every row puts its own question in the panel", wrongPanel.length === 0,
  wrongPanel.slice(0, 5).join(" | "));
check("no question arrives with nothing on it", empty.length === 0, empty.slice(0, 10).join(", "));

/* == 3. PREV and NEXT move, and stop at the ends ========================== */
console.log("\nPREV AND NEXT MOVE THE PANEL");
console.log("-".repeat(72));
{
  const first = await revealRow(0);
  if (first?.reaches) await page.mouse.click(first.cx, first.cy);
  await page.waitForTimeout(150);

  check("PREV is disabled on the first question", await controlState("previous").then((s) => s?.disabled));

  const next = await clickControl("next");
  check("NEXT is reachable where it sits", next.clicked, next.detail);
  check("NEXT advances the panel", (await panel())?.index === `2 of ${total}`,
    `panel says "${(await panel())?.index}"`);

  const prev = await clickControl("previous");
  check("PREV is reachable where it sits", prev.clicked, prev.detail);
  check("PREV goes back", (await panel())?.index === `1 of ${total}`,
    `panel says "${(await panel())?.index}"`);
}

/* == 4. the arrow keys, which are a designed feature here ================= */
console.log("\nTHE ARROW KEYS MOVE THE PANEL");
console.log("-".repeat(72));
{
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  check("ArrowRight advances", (await panel())?.index === `2 of ${total}`,
    `panel says "${(await panel())?.index}"`);
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(200);
  check("ArrowLeft goes back", (await panel())?.index === `1 of ${total}`,
    `panel says "${(await panel())?.index}"`);
}

/* == 5. the rest of the page, which is not this component's job and is ====
   exactly why it belongs here ============================================= */
console.log("\nTHE PAGE-LEVEL BUTTONS ARE ON TOP AND THEY ANSWER");
console.log("-".repeat(72));
/*
  These two live in cards well below the review card, so nothing this
  component does can break them — and that is the point. When the review pane
  was reported dead, so were both of these, and three unrelated components
  failing at once is one shared cause: either something covering the page, or
  a page that never came alive. Both of those are invisible from inside any
  one component, and both are caught by asking these two the same question the
  rows are asked.

  The hit test is the half that names an overlay. A transparent full-page
  layer — a decorative field, a modal left mounted at opacity 0, a fixed
  element mispositioned by an ancestor transform — leaves every one of these
  buttons looking perfect and reachable by `locator.click()`, and fails here.
*/
for (const [name, re] of [
  ["SHARE MY RESULT", /share my result|getting your picture/i],
  ["SEND IT TO YOUR KID", /send it to your kid|link copied/i],
]) {
  const probe = await page.evaluate(
    (src) => {
      const rx = new RegExp(src.source, src.flags);
      const b = [...document.querySelectorAll("button")].find((x) => rx.test(x.textContent ?? ""));
      if (!b) return null;
      b.scrollIntoView({ block: "center", behavior: "instant" });
      const r = b.getBoundingClientRect();
      const cx = Math.round(r.left + r.width / 2);
      const cy = Math.round(r.top + r.height / 2);
      const hit = document.elementFromPoint(cx, cy);
      const key = Object.keys(b).find((k) => k.startsWith("__reactProps$"));
      return {
        cx,
        cy,
        reaches: hit ? b.contains(hit) || b === hit : false,
        blockedBy: hit
          ? `<${hit.tagName.toLowerCase()}${hit.id ? `#${hit.id}` : ""} class="${(hit.getAttribute("class") ?? "").slice(0, 60)}">`
          : "nothing",
        wired: Boolean(key && typeof b[key].onClick === "function"),
      };
    },
    { source: re.source, flags: re.flags },
  );
  check(`${name}: a click at its own centre lands on it`, Boolean(probe?.reaches),
    probe ? `topmost element is ${probe.blockedBy}` : "button not on the page");
  check(`${name}: it carries a live handler`, Boolean(probe?.wired));

  if (probe?.reaches) {
    // And it must actually DO something. A hit-testable button on a page whose
    // JS never ran passes the test above and nothing else.
    //
    // POLLED, NOT SLEPT. One of these hands the press to the OS and waits two
    // seconds for a sheet before giving up on it, so a fixed pause short of
    // that reports a working control as silent — which is what the first
    // version of this check did.
    await page.mouse.click(probe.cx, probe.cy);
    const spoke = await perceivable(page);
    check(`${name}: pressing it changes something a person can see`, Boolean(spoke),
      spoke ?? "NOTHING HAPPENED");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
}

await ctx.close();

/* == 5b. and the branch that actually killed one of them ================== */
console.log("\nA SHEET THAT NEVER OPENS STILL ENDS SOMEWHERE");
console.log("-".repeat(72));
/*
  The check above only catches this when the harness happens to reproduce it,
  and a guard that depends on ambient browser behaviour is not a guard. So the
  failure is induced: `navigator.share` resolves nothing, EVER, which is
  measured desktop-Chrome behaviour and is what left "Send it to your kid"
  hanging on an await with the clipboard fallback unreachable behind it. The
  clipboard is denied too, because by the time a watchdog gives up on a sheet
  the gesture's activation is spent and the real browser refuses that write.

  With both exits gone there is exactly one acceptable outcome, and it is not
  "no crash": within a few seconds the card must have SAID something.
*/
{
  const hostile = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: [], // no clipboard-write: writeText rejects, as it does live
  });
  const hp = await hostile.newPage();
  await hp.addInitScript(() => {
    Navigator.prototype.canShare = () => true;
    Navigator.prototype.share = () => new Promise(() => {}); // never settles
  });
  await hp.goto(URL_RESULTS, { waitUntil: "networkidle" });
  await hp.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await hp.waitForTimeout(800);

  for (const [name, re] of [
    ["SHARE MY RESULT", /share my result|getting your picture/i],
    ["SEND IT TO YOUR KID", /send it to your kid|link copied/i],
  ]) {
    const box = await hp.evaluate(
      (src) => {
        const rx = new RegExp(src.source, src.flags);
        const b = [...document.querySelectorAll("button")].find((x) => rx.test(x.textContent ?? ""));
        if (!b) return null;
        b.scrollIntoView({ block: "center", behavior: "instant" });
        const r = b.getBoundingClientRect();
        return { cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) };
      },
      { source: re.source, flags: re.flags },
    );
    if (!box) {
      check(`${name}: on the page`, false);
      continue;
    }
    await hp.mouse.click(box.cx, box.cy);
    // Generously past the 2s watchdog, so a slow give-up is not read as silence.
    const outcome = await perceivable(hp);
    check(`${name}: the press ends somewhere instead of nowhere`, Boolean(outcome),
      outcome ?? "SILENT — no sheet, no status, no label change");
    await hp.keyboard.press("Escape");
    await hp.waitForTimeout(300);
  }

  /*
    AND THE SHEET SURVIVES BEING TOLD TO PICK ANOTHER WAY.

    The watchdog's whole promise is that a sheet which never opens leaves you
    somewhere you can act — it says "Pick another way" and puts our own sheet
    back. It was saying that while holding the re-entry guard the OS promise
    was supposed to release, so every destination behind that message was dead:
    Save, Copy, all of them, for the life of the page. A press, an apology, and
    nothing works afterwards is worse than the silence it replaced, and every
    check above passed through it — they all stop at the first press.

    So this one presses twice. Copy the link must still copy AFTER More has
    failed.
  */
  const press = async (re) => {
    const b = await hp.evaluate(
      (s) => {
        const rx = new RegExp(s.source, s.flags);
        const el = [...document.querySelectorAll("button")].find((x) =>
          rx.test((x.textContent ?? "").trim()),
        );
        if (!el) return null;
        el.scrollIntoView({ block: "center", behavior: "instant" });
        const r = el.getBoundingClientRect();
        return { cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) };
      },
      { source: re.source, flags: re.flags },
    );
    if (!b) return false;
    await hp.mouse.click(b.cx, b.cy);
    return true;
  };
  const clearStatus = () => hp.waitForTimeout(2800); // confirmations self-clear

  await press(/^Share my result$/);
  await hp.waitForTimeout(600);
  const hadMore = await press(/^More$/);
  if (!hadMore) {
    console.log("  ..    no \"More\" entry at this pointer type — nothing to brick");
  } else {
    await hp.waitForTimeout(3200); // let the watchdog give up and say so
    await clearStatus();
    const reopened = await hp.evaluate(() =>
      Boolean(document.querySelector("[role=dialog]")),
    );
    if (!reopened) await press(/^Share my result$/);
    await hp.waitForTimeout(600);
    await press(/^Copy the link$/);
    const still = await perceivable(hp, 4000);
    /*
      EITHER ANSWER FROM THE CLIPBOARD COUNTS, and only those two: what
      regressed was the destination never being REACHED. "Link copied" is what
      a real browser gives; this context denies clipboard-write on purpose, so
      here it is the honest refusal — and both prove `choose()` dispatched to
      `copyCore` instead of returning on a guard that was never released.
      Silence is the failure, and matching the copy path specifically is what
      stops that from being satisfied by any stray message on the page.
    */
    check("after a sheet that never opened, the destinations still work",
      Boolean(still) && /copied|could not copy/i.test(still),
      still ?? "DEAD — every destination silently ignored");
  }
  await hostile.close();
}

/* == 6. and the same journey on a phone, where it is a different one ====== */
console.log("\nON A PHONE, THE QUESTION YOU TAPPED IS ON THE SCREEN");
console.log("-".repeat(72));
/*
  Below `lg` the detail REPLACES the list instead of sitting beside it, so
  opening a question removes fifty rows' worth of height from the document in
  one commit. The browser clamps the scroll to the new maximum, and for any row
  far enough down the list the card lands ABOVE the window: the state changed,
  the panel is correct, and the reader is looking at a different part of the
  page entirely. Every data assertion passes through that.

  So this asks the only question that catches it — after the tap, is the
  question ON SCREEN — and it asks it of a row deep in the list, because the
  first few rows sit above the fold where the collapse cannot reach them.
*/
{
  const mob = await browser.newContext({
    viewport: { width: 393, height: 720 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
  });
  const mp = await mob.newPage();
  await mp.goto(URL_RESULTS, { waitUntil: "networkidle" });
  await mp.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await mp.waitForTimeout(800);

  for (const row of [Math.floor(total / 2), total - 1]) {
    const pt = await mp.evaluate(
      ([sel, i]) => {
        const b = document.querySelectorAll(sel)[i];
        if (!b) return null;
        b.scrollIntoView({ block: "center", behavior: "instant" });
        const r = b.getBoundingClientRect();
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
      },
      ["ol li button", row],
    );
    if (!pt) {
      check(`row ${row + 1}: reachable on a phone`, false, "no such row");
      continue;
    }
    await mp.mouse.click(pt.x, pt.y);
    await mp.waitForTimeout(700);
    const shown = await mp.evaluate(() => {
      const art = document.querySelector("article");
      const r = art?.getBoundingClientRect();
      return {
        index: art?.querySelector("header span")?.textContent?.trim() ?? null,
        top: r ? Math.round(r.top) : null,
        bottom: r ? Math.round(r.bottom) : null,
        // Not merely intersecting: enough of it to read.
        onScreen: r ? r.top < window.innerHeight - 80 && r.bottom > 80 : false,
      };
    });
    check(`row ${row + 1}: the panel moves to it`, shown.index === `${row + 1} of ${total}`,
      `panel says "${shown.index}"`);
    check(`row ${row + 1}: and it is where the reader is looking`, shown.onScreen,
      `question box spans y ${shown.top}..${shown.bottom} in a 720px window`);

    // Back to the list for the next one.
    const back = mp.getByRole("button", { name: /all questions/i });
    if (await back.count()) {
      await back.first().click();
      await mp.waitForTimeout(400);
    }
  }
  await mob.close();
}

await browser.close();
console.log(
  failures === 0
    ? "\nPASS: every question is one click away, and the panel follows.\n"
    : `\nFAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
