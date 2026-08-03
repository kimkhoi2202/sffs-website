/**
 * Does our own share sheet actually work, on the real page?
 *
 *   node scripts/verify-share-sheet.mjs [baseUrl] [token]
 *
 * ===========================================================================
 * THE RULE THIS FILE IS BUILT AROUND
 * ===========================================================================
 * Its predecessor, scripts/verify-share-visible.mjs, exists because a suite of
 * 36 green assertions once sat on top of a feature that was reported broken.
 * The reason is worth repeating here, because it is the reason every check
 * below is shaped the way it is: that suite asserted the menu EXISTED, using
 * `waitForSelector` and `getByRole(...).click()`, and Playwright's
 * actionability machinery SCROLLS AN ELEMENT INTO VIEW before clicking it. A
 * menu rendered somewhere no person would ever look is still clickable by a
 * test.
 *
 * So nothing here asks whether an element is in the DOM. Every visibility
 * check measures a bounding box against the viewport and hit-tests the element
 * at its own centre with `document.elementFromPoint`, which is the question a
 * reader is actually asking.
 *
 * ===========================================================================
 * THE DEFECT THIS SHEET REPLACED, IN NUMBERS
 * ===========================================================================
 * The dropdown this replaced hung off the button and landed on the card below
 * it. Measured on this page before the change:
 *
 *   390x844   menu 597..757   "Take it again" 655..711   56px of collision
 *   1440x900  menu 649..809   "Take it again" 711..767   56px of collision
 *
 * Section 2 is that defect turned into an assertion: while the sheet is open,
 * NOTHING inside <main> may be hit-testable. A sheet that shares pixels with a
 * live control below it fails, whatever its own box says.
 *
 * ===========================================================================
 * HOW THE ANALYTICS ARE READ WITHOUT SENDING ANY
 * ===========================================================================
 * PostHog deliberately does not initialize off the production hostname (see
 * instrumentation-client.ts), so on localhost `posthog.capture` is a no-op and
 * there is no network traffic to intercept. Rather than add a test seam to
 * production code, this walks up the React fiber tree from a DOM node to the
 * PostHogProvider, which is handed the `posthog-js` singleton as its `client`
 * prop, and replaces `capture` on it with a recorder.
 *
 * That is the same object every `track*` helper imports, so it sees the real
 * call sites with their real payloads, and sends nothing anywhere.
 */
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const TOKEN =
  process.argv[3] ??
  "eyJ2IjoxLCJ0IjoiZ3JhZGUtNCIsImciOjQsImEiOiJERENERENEQ0NERENDREMiLCJlIjoyMCwibyI6MCwiYyI6MTc4NTc3MzIwMSwieCI6MTgxNzMwOTIwMX0.nWmuTcl8X6NxIXbB3IwukQtJU_SulA_B-9Xdfcp5IQQ";
const URL_RESULTS = `${BASE}/results/${encodeURIComponent(TOKEN)}`;

/** The four share events, and the only four names any destination may emit. */
const SHARE_EVENTS = new Set([
  "test_result_share_initiated",
  "test_result_share_completed",
  "test_result_share_dismissed",
  "test_result_share_failed",
]);

let failures = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  ·  ${detail}` : ""}`);
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

/**
 * Everything the page needs stubbed, installed before any app code runs.
 *
 * `window.__log` is ONE ordered timeline rather than a list per concern, so
 * "the event fired before the hop" is a question about indices rather than
 * about two clocks.
 */
const instrument = () => {
  window.__log = [];

  const open = window.open.bind(window);
  window.open = (url, target, features) => {
    window.__log.push({ kind: "open", url: String(url), target, features });
    return { closed: false, focus() {} }; // truthy: "the composer was reached"
  };
  window.__realOpen = open;

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text) => {
        window.__log.push({ kind: "copy", text });
      },
    },
  });

  window.__installRecorder = () => {
    const host = document.querySelector("main") ?? document.body;
    const key = Object.keys(host).find((k) => k.startsWith("__reactFiber$"));
    if (!key) return "no react fiber on the page";
    let fiber = host[key];
    while (fiber) {
      const client = fiber.memoizedProps && fiber.memoizedProps.client;
      if (client && typeof client.capture === "function") {
        client.capture = (name, props) => {
          window.__log.push({ kind: "capture", name, props });
        };
        return null;
      }
      fiber = fiber.return;
    }
    return "no posthog client found on any ancestor fiber";
  };
};

async function openPage({ width, height, hasTouch = false, stub = () => {} }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    hasTouch,
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  await page.addInitScript(instrument);
  await page.addInitScript(stub);
  await page.goto(URL_RESULTS, { waitUntil: "networkidle" });
  // Next's dev overlay is a fixed element that would answer elementFromPoint.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(400);
  const problem = await page.evaluate(() => window.__installRecorder());
  if (problem) throw new Error(problem);
  await page.getByRole("button", { name: /share my result/i }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  return { ctx, page };
}

/**
 * Press the trigger at its own coordinates.
 *
 * `page.mouse.click(x, y)` rather than `locator.click()`, deliberately: the
 * locator version would scroll things around to make the click succeed, which
 * is the help that hid the original defect.
 */
async function clickTrigger(page) {
  const box = await page
    .getByRole("button", { name: /share my result/i })
    .boundingBox();
  if (!box) throw new Error("no share button on the page");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(350);
}

/** Press something inside the sheet, again at its own coordinates. */
async function clickItem(page, destination) {
  const box = await page.locator(`[data-destination="${destination}"]`).boundingBox();
  if (!box) throw new Error(`no sheet item for ${destination}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** Is a thing somewhere a person could see and press it? */
const seeable = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { mounted: false };
    const b = el.getBoundingClientRect();
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
      hittable: hit ? el.contains(hit) : false,
      rect: `${Math.round(b.top)}..${Math.round(b.bottom)} x ${Math.round(b.left)}..${Math.round(b.right)}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }, selector);

/**
 * The first thing the live region says, caught while it is still saying it.
 *
 * Confirmations clear themselves after CONFIRM_MS, so reading the status once
 * at the end of a wait finds an empty element and reports silence on a control
 * that spoke. Poll for the message instead, then let the caller keep waiting.
 */
async function waitForStatus(page, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const said = await page.evaluate(
      () => document.querySelector("[role=status]")?.textContent?.trim() ?? "",
    );
    if (said) return said;
    await page.waitForTimeout(120);
  }
  return "";
}

const captures = (log) => log.filter((e) => e.kind === "capture");
const named = (log, name) => captures(log).filter((e) => e.name === name);
const readLog = (page) => page.evaluate(() => window.__log);
const resetLog = (page) => page.evaluate(() => (window.__log.length = 0));

/* ===========================================================================
   1. THE SHEET IS WHERE A PERSON CAN SEE IT, AT EVERY SIZE
   =========================================================================== */
section("THE SHEET, AND EVERY DESTINATION IN IT, IS ON SCREEN");
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
  await clickTrigger(page);

  const panel = await seeable(page, "[role=dialog]");
  check(
    `${width}x${height}: the sheet is boxed, in viewport and hit-testable`,
    panel.mounted && panel.hasBox && panel.inViewport && panel.hittable,
    panel.mounted ? `${panel.rect} in ${panel.viewport}` : "never mounted",
  );

  /*
    EVERY DESTINATION, not just the panel. A sheet whose box is on screen can
    still have its last row under the fold, and it can clip a label to nothing
    at 360px. Both are measured here: the item's own box against the viewport,
    and its scroll width against its client width.
  */
  const items = await page.evaluate(() => {
    return [...document.querySelectorAll("[role=menuitem]")].map((el) => {
      const b = el.getBoundingClientRect();
      const hit = document.elementFromPoint(
        Math.round(b.left + b.width / 2),
        Math.round(b.top + b.height / 2),
      );
      return {
        label: (el.textContent ?? "").trim(),
        inViewport:
          b.top >= 0 &&
          b.left >= 0 &&
          b.bottom <= window.innerHeight &&
          b.right <= window.innerWidth,
        hittable: hit ? el.contains(hit) : false,
        clipped: el.scrollWidth - el.clientWidth > 1,
        big: b.width > 2 && b.height > 2,
      };
    });
  });
  const bad = items.filter((i) => !i.inViewport || !i.hittable || i.clipped || !i.big);
  check(
    `${width}x${height}: all ${items.length} destinations pressable and unclipped`,
    items.length === 8 && bad.length === 0,
    bad.length ? bad.map((b) => b.label).join(", ") : `${items.length} items`,
  );
  await ctx.close();
}

/* ===========================================================================
   2. IT DOES NOT LAND ON THE CARD BELOW
   =========================================================================== */
section("NOTHING ON THE PAGE IS UNDER THE SHEET AND STILL LIVE");
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [1440, 900],
]) {
  const { ctx, page } = await openPage({ width, height });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  await clickTrigger(page);

  const collisions = await page.evaluate(() => {
    const dialog = document.querySelector("[role=dialog]");
    const overlay = dialog?.parentElement;
    const style = overlay ? getComputedStyle(overlay) : null;
    const rect = overlay?.getBoundingClientRect();

    /*
      Everything on the page a person could press, plus the floating sound
      toggle, which is fixed and lives outside <main>. If any of their centres
      still answers elementFromPoint, the sheet is a panel floating over live
      content rather than a layer in front of it.
    */
    const behind = [
      ...document.querySelectorAll("main a, main button"),
      ...document.querySelectorAll("body > button, body > div > button"),
    ].filter((el) => !overlay?.contains(el));

    const live = behind
      .filter((el) => {
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return false;
        if (b.bottom < 0 || b.top > window.innerHeight) return false;
        const hit = document.elementFromPoint(
          Math.round(b.left + b.width / 2),
          Math.round(b.top + b.height / 2),
        );
        return hit ? el.contains(hit) : false;
      })
      .map((el) => (el.textContent ?? el.getAttribute("aria-label") ?? "?").trim().slice(0, 24));

    return {
      fixed: style?.position === "fixed",
      coversViewport:
        !!rect &&
        rect.top <= 0 &&
        rect.left <= 0 &&
        rect.right >= window.innerWidth &&
        rect.bottom >= window.innerHeight,
      checked: behind.length,
      live,
    };
  });

  check(
    `${width}x${height}: the sheet is pinned to the viewport, not to the card`,
    collisions.fixed && collisions.coversViewport,
    `position fixed=${collisions.fixed} covers=${collisions.coversViewport}`,
  );
  check(
    `${width}x${height}: none of the ${collisions.checked} controls behind it are reachable`,
    collisions.live.length === 0,
    collisions.live.length ? `still live: ${collisions.live.join(", ")}` : "all covered",
  );
  await ctx.close();
}

/* ===========================================================================
   3. ONE EVENT PER TAP, WITH THE DESTINATION ON IT
   =========================================================================== */
section("EVERY DESTINATION FIRES ONE PAIR, CARRYING ITS OWN NAME");
{
  const { ctx, page } = await openPage({
    width: 1024,
    height: 768,
    stub: () => {
      // "More" needs a sheet that answers. The file is only attached on a
      // coarse pointer, so this desktop context exercises the link path.
      Navigator.prototype.share = async () => {};
    },
  });
  const downloads = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));

  /** Tap one destination on a freshly opened sheet and read what it filed. */
  const tap = async (destination) => {
    await resetLog(page);
    await clickTrigger(page);
    await clickItem(page, destination);
    await page.waitForTimeout(2200); // the card render is the slow one
    return readLog(page);
  };

  const EXPECTED = [
    { d: "save", mechanism: "image_download" },
    { d: "copy_link", mechanism: "copy_link" },
    { d: "x", mechanism: "web_intent", host: "twitter.com" },
    { d: "whatsapp", mechanism: "web_intent", host: "wa.me" },
    { d: "reddit", mechanism: "web_intent", host: "www.reddit.com" },
    { d: "native_sheet", mechanism: "native_sheet" },
  ];

  const everyName = new Set();

  for (const { d, mechanism, host } of EXPECTED) {
    const log = await tap(d);
    for (const c of captures(log)) everyName.add(c.name);

    const started = named(log, "test_result_share_initiated");
    const done = named(log, "test_result_share_completed");
    check(
      `${d}: exactly one initiated and one completed`,
      started.length === 1 && done.length === 1,
      `initiated=${started.length} completed=${done.length}`,
    );
    check(
      `${d}: both carry destination="${d}"`,
      started[0]?.props?.destination === d && done[0]?.props?.destination === d,
      `initiated=${started[0]?.props?.destination} completed=${done[0]?.props?.destination}`,
    );
    check(
      `${d}: initiated carries mechanism="${mechanism}"`,
      started[0]?.props?.mechanism === mechanism,
      `got ${started[0]?.props?.mechanism}`,
    );
    check(
      `${d}: no token and no address on the event`,
      started[0] ? !JSON.stringify(started[0].props).match(/eyJ|@/) : false,
      JSON.stringify(started[0]?.props ?? {}),
    );

    if (host) {
      const hop = log.find((e) => e.kind === "open");
      const url = hop ? new URL(hop.url) : null;
      check(
        `${d}: opens ${host} in a new tab, with noopener`,
        url?.hostname === host &&
          hop.target === "_blank" &&
          String(hop.features).includes("noopener"),
        hop ? `${url?.hostname} target=${hop.target} features=${hop.features}` : "never opened",
      );
      // The link inside the composer must be the CHALLENGE, tagged for this
      // destination, so inbound traffic can be told apart per channel.
      const inner = decodeURIComponent(hop?.url ?? "");
      check(
        `${d}: the link it carries is /beat tagged utm_content=${d}`,
        inner.includes("/beat/") && inner.includes(`utm_content=${d}`),
        inner.slice(0, 120),
      );
      // Fired BEFORE the hop, because a new tab can take the thread with it.
      const iEvent = log.findIndex(
        (e) => e.kind === "capture" && e.name === "test_result_share_initiated",
      );
      const iOpen = log.findIndex((e) => e.kind === "open");
      check(
        `${d}: the event is filed before the hop`,
        iEvent >= 0 && iOpen >= 0 && iEvent < iOpen,
        `event@${iEvent} open@${iOpen}`,
      );
    }

    if (d === "copy_link") {
      const copied = log.find((e) => e.kind === "copy");
      check(
        "copy_link: puts the tagged /beat link on the clipboard",
        !!copied &&
          copied.text.includes("/beat/") &&
          copied.text.includes("utm_content=copy_link"),
        copied?.text?.slice(0, 110) ?? "nothing copied",
      );
    }
  }

  check(
    "save: the picture really reaches the device",
    downloads.includes("smart-fella-or-fart-smella.png"),
    downloads.join(", ") || "no download",
  );

  /*
    THE POINT OF THE WHOLE TAXONOMY. Eight destinations must not produce eight
    event names; if one ever does, every funnel built on these has to be
    rebuilt by hand and the destinations stop segmenting against each other.
  */
  const strays = [...everyName].filter((n) => !SHARE_EVENTS.has(n));
  check(
    "no destination invented an event name of its own",
    strays.length === 0,
    strays.length ? strays.join(", ") : [...everyName].sort().join(", "),
  );

  await ctx.close();
}

/* ===========================================================================
   4. THE TWO-STEP REPORTS BOTH HALVES
   =========================================================================== */
section("INSTAGRAM AND TIKTOK REPORT THE TAP AND THE SAVE SEPARATELY");
for (const [destination, app, host] of [
  ["instagram", "Instagram", "www.instagram.com"],
  ["tiktok", "TikTok", "www.tiktok.com"],
]) {
  const { ctx, page } = await openPage({ width: 1024, height: 768 });
  await clickTrigger(page);
  await resetLog(page);
  await clickItem(page, destination);
  await page.waitForTimeout(2500);

  const log = await readLog(page);
  const started = named(log, "test_result_share_initiated");
  const done = named(log, "test_result_share_completed");

  check(
    `${destination}: the tap is filed as step "tapped"`,
    started.length === 1 &&
      started[0].props.destination === destination &&
      started[0].props.step === "tapped",
    JSON.stringify(started[0]?.props ?? {}),
  );
  check(
    `${destination}: the save is filed separately as step "saved"`,
    done.length === 1 &&
      done[0].props.destination === destination &&
      done[0].props.step === "saved",
    JSON.stringify(done[0]?.props ?? {}),
  );

  /*
    The second half only means anything if the person can see it, so the
    second screen is measured the same way everything else here is.
  */
  const openApp = await seeable(page, "[data-open-app]");
  check(
    `${destination}: the sheet moves on to a visible "Open ${app}"`,
    openApp.mounted && openApp.hasBox && openApp.inViewport && openApp.hittable,
    openApp.mounted ? openApp.rect : "second screen never appeared",
  );
  const focused = await page.evaluate(() =>
    (document.activeElement?.textContent ?? "").trim(),
  );
  check(
    `${destination}: the keyboard lands on it`,
    focused.toLowerCase() === `open ${app}`.toLowerCase(),
    `focus is on "${focused}"`,
  );
  check(
    `${destination}: and the second screen says the picture is already saved`,
    /picture is saved/i.test(
      await page.evaluate(
        () => document.querySelector("[role=dialog]")?.textContent ?? "",
      ),
    ),
    "",
  );

  /*
    BACK, THEN OUT, THEN IN AGAIN. Going back a screen should return the
    keyboard to the destination it came from; a fresh open should not, because
    landing on Instagram because of something you did a minute ago is a menu
    that remembers the wrong thing.
  */
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  check(
    `${destination}: Escape steps back to the list rather than closing it`,
    await page.evaluate(
      () =>
        !!document.querySelector("[role=menu]") &&
        !!document.querySelector("[role=dialog]"),
    ),
    "",
  );
  check(
    `${destination}: and puts the keyboard back on ${destination}`,
    (await page.evaluate(
      () => document.activeElement?.getAttribute("data-destination") ?? "",
    )) === destination,
    await page.evaluate(
      () => document.activeElement?.getAttribute("data-destination") ?? "(none)",
    ),
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await clickTrigger(page);
  check(
    `${destination}: a fresh open starts at the top of the list again`,
    (await page.evaluate(
      () => (document.activeElement?.textContent ?? "").trim(),
    )) === "Save the picture",
    await page.evaluate(() => (document.activeElement?.textContent ?? "").trim()),
  );

  // Back to the second screen for the app hop below.
  await resetLog(page);
  await clickItem(page, destination);
  await page.waitForTimeout(2500);

  /*
    The app hop, on a fine pointer, is the upload page rather than the custom
    scheme: a desktop has no app for `instagram://` to reach. The coarse
    pointer branch takes the scheme, which is not exercised here because a
    real navigation to an unregistered scheme is the browser's business, not
    the page's.
  */
  await resetLog(page);
  const btn = await page.locator("[data-open-app]").boundingBox();
  await page.mouse.click(btn.x + btn.width / 2, btn.y + btn.height / 2);
  await page.waitForTimeout(300);
  const hop = (await readLog(page)).find((e) => e.kind === "open");
  check(
    `${destination}: opening the app on a desktop goes to ${host}`,
    !!hop && new URL(hop.url).hostname === host,
    hop?.url ?? "nothing opened",
  );

  await ctx.close();
}

/* ===========================================================================
   5. THE KEYBOARD AND THE SCREEN READER
   =========================================================================== */
section("IT KEEPS EVERY OBLIGATION THE MENU IT REPLACED HAD");
{
  const { ctx, page } = await openPage({ width: 1024, height: 768 });
  const trigger = page.getByRole("button", { name: /share my result/i });

  check(
    "the trigger says a pop-up is coming, and that it is shut",
    (await trigger.getAttribute("aria-haspopup")) === "dialog" &&
      (await trigger.getAttribute("aria-expanded")) === "false",
    `haspopup=${await trigger.getAttribute("aria-haspopup")} expanded=${await trigger.getAttribute("aria-expanded")}`,
  );

  await clickTrigger(page);
  check(
    "and says so when it is open",
    (await trigger.getAttribute("aria-expanded")) === "true",
    `expanded=${await trigger.getAttribute("aria-expanded")}`,
  );

  const shape = await page.evaluate(() => {
    const dialog = document.querySelector("[role=dialog]");
    const label = document.getElementById(dialog?.getAttribute("aria-labelledby") ?? "");
    const menu = document.querySelector("[role=menu]");
    const items = [...document.querySelectorAll("[role=menuitem]")];
    return {
      modal: dialog?.getAttribute("aria-modal") === "true",
      name: (label?.textContent ?? "").trim(),
      menuInDialog: !!menu && !!dialog?.contains(menu),
      menuLabelled: !!menu?.getAttribute("aria-label"),
      unnamed: items.filter((i) => !(i.textContent ?? "").trim()).length,
      count: items.length,
    };
  });
  check(
    "a modal dialog with a name, holding a labelled menu of named items",
    shape.modal &&
      shape.name.length > 0 &&
      shape.menuInDialog &&
      shape.menuLabelled &&
      shape.unnamed === 0,
    `name="${shape.name}" items=${shape.count} unnamed=${shape.unnamed}`,
  );

  const focusNow = () =>
    page.evaluate(() => ({
      label: (document.activeElement?.textContent ?? "").trim(),
      inDialog: !!document
        .querySelector("[role=dialog]")
        ?.contains(document.activeElement),
    }));

  check("opening it puts the keyboard on the first destination",
    (await focusNow()).label === "Save the picture",
    (await focusNow()).label);

  await page.keyboard.press("ArrowDown");
  check("ArrowDown steps to the next one", (await focusNow()).label === "Copy the link",
    (await focusNow()).label);
  await page.keyboard.press("ArrowUp");
  check("ArrowUp steps back", (await focusNow()).label === "Save the picture",
    (await focusNow()).label);
  await page.keyboard.press("End");
  check("End jumps to the last", (await focusNow()).label === "More",
    (await focusNow()).label);
  await page.keyboard.press("Home");
  check("Home jumps to the first", (await focusNow()).label === "Save the picture",
    (await focusNow()).label);
  await page.keyboard.press("ArrowRight");
  check("ArrowRight walks the grid too", (await focusNow()).label === "Copy the link",
    (await focusNow()).label);

  /*
    THE TRAP. Ten Tabs is more stops than the sheet has, so if any of them
    could escape, one of them would have.
  */
  let escaped = null;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    const f = await focusNow();
    if (!f.inDialog) escaped = f.label || "(nothing)";
  }
  check("Tab never leaves the sheet", escaped === null,
    escaped ? `landed on "${escaped}"` : "10 stops, all inside");

  let backwards = null;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Shift+Tab");
    const f = await focusNow();
    if (!f.inDialog) backwards = f.label || "(nothing)";
  }
  check("nor does Shift+Tab", backwards === null,
    backwards ? `landed on "${backwards}"` : "10 stops, all inside");

  const closer = await seeable(page, "[role=dialog] button[aria-label]");
  check("there is a close control, and it is on screen",
    closer.mounted && closer.hasBox && closer.inViewport && closer.hittable,
    closer.mounted ? closer.rect : "no close control");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const afterEscape = await page.evaluate(() => ({
    gone: !document.querySelector("[role=dialog]"),
    onTrigger: /share my result/i.test(document.activeElement?.textContent ?? ""),
    expanded: document
      .querySelector("button[aria-haspopup]")
      ?.getAttribute("aria-expanded"),
  }));
  check("Escape closes it and hands focus back to the trigger",
    afterEscape.gone && afterEscape.onTrigger && afterEscape.expanded === "false",
    `gone=${afterEscape.gone} focus-on-trigger=${afterEscape.onTrigger}`);

  // The close control, pressed rather than described.
  await clickTrigger(page);
  const x = await page.locator("[role=dialog] button[aria-label]").boundingBox();
  await page.mouse.click(x.x + x.width / 2, x.y + x.height / 2);
  await page.waitForTimeout(250);
  check("the close control closes it",
    await page.evaluate(() => !document.querySelector("[role=dialog]")), "");

  // And a press on the scrim, which is the other thing people try.
  await clickTrigger(page);
  await page.mouse.click(8, 8);
  await page.waitForTimeout(250);
  check("a press outside closes it",
    await page.evaluate(() => !document.querySelector("[role=dialog]")), "");

  await ctx.close();
}

/* ===========================================================================
   6. THE PAGE CAN MOVE BEHIND IT WITHOUT MOVING IT

   There is no scroll lock, deliberately: a fixed overlay defeats the usual
   `overflow: hidden` one in Chrome, measured on this page (see the note in
   share-results.tsx). So the property to hold is the one a pinned sheet can
   actually promise. If a future change ever anchors the sheet to the document
   instead of the viewport, this is the check that catches it.
   =========================================================================== */
section("THE PAGE MOVING BEHIND IT MOVES NOTHING ABOUT IT");
{
  const { ctx, page } = await openPage({ width: 1024, height: 768 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  await clickTrigger(page);
  const before = await seeable(page, "[role=dialog]");

  // Back to the top of a long page, which is the largest move available.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const after = await seeable(page, "[role=dialog]");

  check(
    "the sheet does not move when the page does",
    before.rect === after.rect && after.inViewport && after.hittable,
    `${before.rect} -> ${after.rect}`,
  );

  const stillCovered = await page.evaluate(() => {
    return [...document.querySelectorAll("main a, main button")]
      .filter((el) => {
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return false;
        if (b.bottom < 0 || b.top > window.innerHeight) return false;
        const hit = document.elementFromPoint(
          Math.round(b.left + b.width / 2),
          Math.round(b.top + b.height / 2),
        );
        return hit ? el.contains(hit) : false;
      })
      .map((el) => (el.textContent ?? "").trim().slice(0, 20));
  });
  check(
    "and nothing behind it becomes reachable on the way",
    stillCovered.length === 0,
    stillCovered.join(", ") || "all still covered",
  );

  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const residue = await page.evaluate(() => ({
    dialog: !!document.querySelector("[role=dialog]"),
    rootOverflow: document.documentElement.style.overflow,
    bodyOverflow: document.body.style.overflow,
    bodyPadding: document.body.style.paddingRight,
  }));
  check(
    "closing it takes the whole layer with it, and touches nothing else",
    !residue.dialog &&
      !residue.rootOverflow &&
      !residue.bodyOverflow &&
      !residue.bodyPadding,
    JSON.stringify(residue),
  );
  await ctx.close();
}

/* ===========================================================================
   7. "MORE" KEEPS EVERY FIX THE OLD ONE-BUTTON VERSION EARNED

   These three endings are the ones that cost a day of debugging when the
   control was a single button straight onto `navigator.share()`. Folding that
   button into a sheet item is exactly the kind of move that quietly drops
   them, so each is asserted here against the real page.
   =========================================================================== */
section("THE OS SHEET'S THREE BAD ENDINGS STILL END SOMEWHERE");

const NATIVE_ENDINGS = [
  {
    label: "the person backs out of it",
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async () => {
        throw new DOMException("cancelled", "AbortError");
      };
    },
    // Dismissal is not failure: the machinery worked and they changed their
    // mind. Folding the two together would make a healthy sheet look broken.
    event: "test_result_share_dismissed",
    says: /not shared/i,
    reopens: false,
  },
  {
    label: "it throws something real",
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async () => {
        throw new TypeError("nope");
      };
    },
    event: "test_result_share_failed",
    says: /link copied/i,
    reopens: false,
  },
  {
    /*
      THE ONE THAT SHIPPED BROKEN. share() resolves nothing, ever, and the page
      keeps focus because no sheet was presented. A plain timeout cannot tell
      that apart from a sheet somebody is reading, so the watchdog only fires
      when the promise is unsettled AND this document still has focus.
    */
    label: "no sheet is ever presented",
    stub: () => {
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = () => new Promise(() => {});
    },
    event: "test_result_share_failed",
    says: /did not open/i,
    reopens: true,
  },
];

for (const ending of NATIVE_ENDINGS) {
  const { ctx, page } = await openPage({
    width: 1024,
    height: 768,
    hasTouch: true,
    stub: ending.stub,
  });
  await clickTrigger(page);
  await resetLog(page);
  await clickItem(page, "native_sheet");
  // Long enough to be past the 2s watchdog, and polling rather than sleeping
  // so a confirmation that expires before the end is still seen.
  const said = await waitForStatus(page, 3400);
  await page.waitForTimeout(600);

  const log = await readLog(page);
  const filed = named(log, ending.event);
  check(
    `${ending.label}: files exactly one ${ending.event}`,
    filed.length === 1 && filed[0].props.destination === "native_sheet",
    filed.length ? JSON.stringify(filed[0].props) : "nothing filed",
  );

  const state = await page.evaluate(() => {
    const trigger = [...document.querySelectorAll("button")].find((b) =>
      /share my result|getting your picture/i.test(b.textContent ?? ""),
    );
    return {
      usable: trigger ? !trigger.disabled : false,
      reopened: !!document.querySelector("[role=dialog]"),
    };
  });
  check(
    `${ending.label}: says "${ending.says.source}" out loud`,
    ending.says.test(said),
    `status said "${said}"`,
  );
  // The original lock-up: `busy` was cleared in a finally that a non-settling
  // promise never reached, and the card stayed dead until a reload.
  check(`${ending.label}: the trigger is still alive afterwards`, state.usable, "");

  if (ending.reopens) {
    const back = await seeable(page, "[role=dialog]");
    check(
      "no sheet presented: our own is put back, visibly, so the tap ends somewhere",
      back.mounted && back.hasBox && back.inViewport && back.hittable,
      back.mounted ? back.rect : "never came back",
    );
  } else {
    check(`${ending.label}: the sheet stays shut`, !state.reopened, "");
  }
  await ctx.close();
}

/* ===========================================================================
   8. A PHONE GETS THE SAME SHEET, AND THE PICTURE GOES INTO THE OS ONE
   =========================================================================== */
section("ON A COARSE POINTER");
{
  const { ctx, page } = await openPage({
    width: 390,
    height: 844,
    hasTouch: true,
    stub: () => {
      window.__shared = null;
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async (data) => {
        window.__log.push({
          kind: "native",
          files: (data.files ?? []).map((f) => f.name),
          url: data.url,
        });
      };
    },
  });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  await clickTrigger(page);
  const panel = await seeable(page, "[role=dialog]");
  check(
    "the button opens OUR sheet, not the OS one",
    panel.mounted && panel.inViewport && panel.hittable,
    panel.mounted ? panel.rect : "no sheet",
  );

  await resetLog(page);
  await clickItem(page, "native_sheet");
  await page.waitForTimeout(2600);
  const handed = (await readLog(page)).find((e) => e.kind === "native");
  /*
    The file is attached HERE and not on a desktop. Desktop Chrome answers
    canShare({files}) with true and will take the PNG, but the macOS picker
    offers Messages and Mail, where a link is what travels. Capability is not
    sufficiency, so the test is capability AND a coarse pointer.
  */
  check(
    "and \"More\" hands the OS the picture, not just the link",
    !!handed && handed.files.includes("smart-fella-or-fart-smella.png"),
    handed ? `files=[${handed.files}]` : "share() never called",
  );
  await ctx.close();
}

await browser.close();
console.log(
  failures === 0
    ? "\nPASS: the sheet is visible, self-contained, keyboard-complete, and files one event per tap.\n"
    : `\nFAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
