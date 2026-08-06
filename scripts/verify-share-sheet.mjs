/**
 * What actually reaches the OS share sheet, and what the loop records about it.
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-share-sheet.mjs [baseUrl] [token]
 *
 * The token is optional and is MINTED against the target when it is left out;
 * see scripts/share-result.mjs for why it is no longer a literal, and for the
 * timeout-on-"Share my result" that the literal caused. Pass one to run this
 * read-only against a deployment, which is what section 4's stray-event check
 * is written for.
 *
 * ===========================================================================
 * THIS FILE USED TO BE ABOUT A SHEET OF OUR OWN
 * ===========================================================================
 * It asserted eight destinations, a focus trap, arrow-key navigation and a
 * scrim. All of that is gone: the button hands straight to the OS sheet now
 * (see the note at the top of components/test/share-results.tsx), and a menu
 * that does not exist cannot be tested for.
 *
 * WHAT REPLACED IT IS THE PART THAT ACTUALLY TRAVELS. Two questions survive
 * the change and they are the only two that ever mattered to a person:
 *
 *   1. Does the PICTURE go with it, where the browser can take one, and does
 *      the LINK go with it everywhere? A bare link is the difference between
 *      "send it anywhere" and a URL nobody can post to a Story.
 *   2. Does every ending get recorded? The destination is unknowable through
 *      the OS sheet and that reporting is gone on purpose, but initiated,
 *      completed, dismissed and failed-with-a-reason are what made two
 *      dead-button diagnoses possible in one day, and `sheet_never_opened` is
 *      the only signal that the non-settling case is happening in the wild.
 *
 * Companion to scripts/verify-share-visible.mjs, which owns the other half:
 * that a person SEES something happen. This one owns what leaves the device.
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

import { mintShareToken } from "./share-result.mjs";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const TOKEN =
  process.argv[3] ?? (await mintShareToken(BASE, "scripts/verify-share-sheet.mjs"));
const URL_RESULTS = `${BASE}/results/${encodeURIComponent(TOKEN)}`;

const CARD_FILENAME = "smart-fella-or-fart-smella.png";

/** The four share events, and the only four names this control may emit. */
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
 * "the failure was filed before the fallback" is a question about indices
 * rather than about two clocks.
 */
const instrument = () => {
  window.__log = [];

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

/**
 * A Web Share API that records what it was given and then ends as asked.
 *
 * `hangs` is the one worth naming: it records the call and returns a promise
 * nobody will ever settle, which is the measured desktop Chrome behaviour this
 * whole control is defended against.
 */
const installShare = ({ canShare, ending }) => {
  const record = (data) => {
    window.__log.push({
      kind: "native",
      files: (data.files ?? []).map((f) => f.name),
      fileTypes: (data.files ?? []).map((f) => f.type),
      url: data.url ?? null,
      text: data.text ?? null,
      title: data.title ?? null,
      keys: Object.keys(data).sort().join(","),
    });
  };
  Navigator.prototype.canShare = () => canShare;
  Navigator.prototype.share = (data) => {
    record(data);
    if (ending === "hangs") return new Promise(() => {});
    if (ending === "abort") {
      return Promise.reject(new DOMException("cancelled", "AbortError"));
    }
    if (ending === "throws") return Promise.reject(new TypeError("nope"));
    return Promise.resolve();
  };
};

/** No Web Share API on this browser at all. */
const removeShare = () => {
  delete Navigator.prototype.share;
  delete Navigator.prototype.canShare;
};

async function openPage({
  width = 1024,
  height = 768,
  hasTouch = false,
  /** `{ canShare, ending }`, or null for a browser with no sheet. */
  share = { canShare: true, ending: "resolves" },
  blockCard = false,
} = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch });
  const page = await ctx.newPage();
  await page.addInitScript(instrument);
  if (share) await page.addInitScript(installShare, share);
  else await page.addInitScript(removeShare);
  // Installed before the page can prefetch on hover, so the card is genuinely
  // unavailable rather than already cached.
  if (blockCard) await page.route("**/share-card", (route) => route.abort());
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
    .getByRole("button", { name: /share my result|getting your picture/i })
    .boundingBox();
  if (!box) throw new Error("no share button on the page");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

const captures = (log) => log.filter((e) => e.kind === "capture");
const named = (log, name) => captures(log).filter((e) => e.name === name);
const readLog = (page) => page.evaluate(() => window.__log);

/** Press it, and wait long enough for the slowest branch (card, then watchdog). */
async function tapAndSettle(page, ms = 5200) {
  await clickTrigger(page);
  await page.waitForTimeout(ms);
  return readLog(page);
}

const everyName = new Set();
const collect = (log) => {
  for (const c of captures(log)) everyName.add(c.name);
  return log;
};

/* ===========================================================================
   1. THE PICTURE GOES WITH IT, WHERE THE BROWSER WILL TAKE ONE
   =========================================================================== */
section("WHAT IS HANDED TO THE OS");
{
  const { ctx, page } = await openPage({ width: 390, height: 844, hasTouch: true });
  const log = collect(await tapAndSettle(page));
  const handed = log.find((e) => e.kind === "native");

  check(
    "the 1080x1920 card is in the payload",
    Boolean(handed) && handed.files.includes(CARD_FILENAME),
    handed ? `files=[${handed.files}] types=[${handed.fileTypes}]` : "share() never called",
  );
  check(
    "and it is a PNG, which is what canShare was asked about",
    Boolean(handed) && handed.fileTypes.includes("image/png"),
    handed ? `types=[${handed.fileTypes}]` : "",
  );
  check(
    "the link rides along, and it is the tagged challenge",
    Boolean(handed?.url) &&
      handed.url.includes("/beat/") &&
      handed.url.includes("utm_content=native_sheet") &&
      handed.url.includes("utm_source=share"),
    handed?.url?.slice(0, 120) ?? "no url",
  );
  check(
    "with the words that travel with it",
    Boolean(handed?.text) && /beat me/i.test(handed.text),
    handed?.text ?? "no text",
  );
  await ctx.close();
}
{
  /*
    THE DEGRADE, WHICH IS THE HALF THAT THROWS IF IT IS GOT WRONG. Plenty of
    browsers have `navigator.share` and cannot take a file; handing one a
    `files` payload is a TypeError, not a polite refusal. So the capability is
    asked and the answer is obeyed.
  */
  const { ctx, page } = await openPage({
    share: { canShare: false, ending: "resolves" },
  });
  const log = collect(await tapAndSettle(page));
  const handed = log.find((e) => e.kind === "native");

  check(
    "a sheet that cannot take files is handed no files",
    Boolean(handed) && handed.files.length === 0,
    handed ? `keys=${handed.keys}` : "share() never called",
  );
  check(
    "and still gets the link, so the tap is not wasted",
    Boolean(handed?.url) && handed.url.includes("/beat/"),
    handed?.url?.slice(0, 110) ?? "no url",
  );
  check(
    "and a title, which is what names it in a mail subject",
    Boolean(handed?.title),
    handed?.title ?? "no title",
  );
  check(
    "the share completed rather than throwing",
    named(log, "test_result_share_completed").length === 1,
    JSON.stringify(named(log, "test_result_share_completed")[0]?.props ?? {}),
  );
  await ctx.close();
}
{
  /*
    THE CARD CAN ALSO SIMPLY NOT ARRIVE — a cold Satori render that times out,
    or an offline moment. That must not cost the share: the link is still worth
    sending, so the fetch failure is recorded and the payload degrades.
  */
  const { ctx, page } = await openPage({ blockCard: true });
  const log = collect(await tapAndSettle(page, 14000));
  const handed = log.find((e) => e.kind === "native");
  const failed = named(log, "test_result_share_failed");

  check(
    "a card that never arrives is filed as card_fetch",
    failed.length === 1 && failed[0].props.reason === "card_fetch",
    failed.length ? JSON.stringify(failed[0].props) : "nothing filed",
  );
  check(
    "and the share still goes, link-only",
    Boolean(handed) && handed.files.length === 0 && handed.url.includes("/beat/"),
    handed ? `files=[${handed.files}]` : "share() never called",
  );
  check(
    "and still completes",
    named(log, "test_result_share_completed").length === 1,
    "",
  );
  await ctx.close();
}

/* ===========================================================================
   2. ONE INITIATED PER TAP, AND AN HONEST ENDING
   =========================================================================== */
section("EVERY ENDING IS FILED, AND FILED AS ITSELF");

const ENDINGS = [
  {
    label: "it works",
    ending: "resolves",
    event: "test_result_share_completed",
    mechanism: "native_sheet",
  },
  {
    /*
      Dismissal is not failure: the machinery worked and they changed their
      mind. Folding the two together would make a healthy sheet look broken.
    */
    label: "the person backs out of it",
    ending: "abort",
    event: "test_result_share_dismissed",
    mechanism: "native_sheet",
  },
  {
    label: "it throws something real",
    ending: "throws",
    event: "test_result_share_failed",
    mechanism: "native_sheet",
    reason: "share_api",
    fallsBackToClipboard: true,
  },
  {
    /*
      THE ONE THAT SHIPPED BROKEN, TWICE. share() resolves nothing, ever, and
      the page keeps focus because no sheet was presented. A plain timeout
      cannot tell that apart from a sheet somebody is reading, so the watchdog
      only fires when the promise is unsettled AND this document still has
      focus. This reason is the only evidence the case exists in the wild.
    */
    label: "no sheet is ever presented",
    ending: "hangs",
    event: "test_result_share_failed",
    mechanism: "native_sheet",
    reason: "sheet_never_opened",
    fallsBackToClipboard: true,
  },
];

for (const e of ENDINGS) {
  const { ctx, page } = await openPage({
    share: { canShare: true, ending: e.ending },
  });
  const log = collect(await tapAndSettle(page));

  const started = named(log, "test_result_share_initiated");
  check(
    `${e.label}: exactly one initiated, on the native mechanism`,
    started.length === 1 && started[0].props.mechanism === "native_sheet",
    `initiated=${started.length} mechanism=${started[0]?.props?.mechanism}`,
  );

  const filed = named(log, e.event);
  check(
    `${e.label}: files exactly one ${e.event}`,
    filed.length === 1 && filed[0].props.mechanism === e.mechanism,
    filed.length ? JSON.stringify(filed[0].props) : "nothing filed",
  );
  if (e.reason) {
    check(
      `${e.label}: with reason "${e.reason}"`,
      filed[0]?.props?.reason === e.reason,
      `got ${filed[0]?.props?.reason}`,
    );
  }

  /*
    THE FALLBACK IS A SECOND, DIFFERENT EVENT, and the order is the story: the
    native attempt failed, and then the clipboard finished the job. They do not
    pair off by mechanism and are not supposed to.
  */
  if (e.fallsBackToClipboard) {
    const done = named(log, "test_result_share_completed");
    check(
      `${e.label}: the clipboard files the completion, as copy_link`,
      done.length === 1 && done[0].props.mechanism === "copy_link",
      done.length ? JSON.stringify(done[0].props) : "no completion",
    );
    const iFail = log.findIndex((x) => x.kind === "capture" && x.name === e.event);
    const iDone = log.findIndex(
      (x) => x.kind === "capture" && x.name === "test_result_share_completed",
    );
    check(
      `${e.label}: the failure is filed before the fallback`,
      iFail >= 0 && iDone >= 0 && iFail < iDone,
      `failed@${iFail} completed@${iDone}`,
    );
    const copied = log.find((x) => x.kind === "copy");
    check(
      `${e.label}: and the tagged link really goes to the clipboard`,
      Boolean(copied) &&
        copied.text.includes("/beat/") &&
        copied.text.includes("utm_content=copy_link"),
      copied?.text?.slice(0, 110) ?? "nothing copied",
    );
  } else {
    check(
      `${e.label}: nothing is copied behind the person's back`,
      !log.some((x) => x.kind === "copy"),
      "",
    );
  }

  check(
    `${e.label}: no token and no address on any of it`,
    captures(log).every((c) => !JSON.stringify(c.props).match(/eyJ|@/)),
    JSON.stringify(started[0]?.props ?? {}),
  );
  await ctx.close();
}

/* ===========================================================================
   3. NO WEB SHARE API AT ALL
   =========================================================================== */
section("A BROWSER WITH NO SHEET STILL SHARES");
{
  const { ctx, page } = await openPage({ share: null });
  const log = collect(await tapAndSettle(page, 2000));

  const started = named(log, "test_result_share_initiated");
  const done = named(log, "test_result_share_completed");
  check(
    "it files one initiated, on the copy mechanism rather than the native one",
    started.length === 1 && started[0].props.mechanism === "copy_link",
    JSON.stringify(started[0]?.props ?? {}),
  );
  check(
    "and one completion to match it",
    done.length === 1 && done[0].props.mechanism === "copy_link",
    JSON.stringify(done[0]?.props ?? {}),
  );
  const copied = log.find((x) => x.kind === "copy");
  check(
    "the tagged link is on the clipboard",
    Boolean(copied) &&
      copied.text.includes("/beat/") &&
      copied.text.includes("utm_content=copy_link"),
    copied?.text?.slice(0, 110) ?? "nothing copied",
  );
  check("and no native failure was invented for it", named(log, "test_result_share_failed").length === 0, "");
  await ctx.close();
}

/* ===========================================================================
   4. THE TAXONOMY HOLDS
   =========================================================================== */
section("THE FOUR NAMES, AND ONLY THE FOUR NAMES");
{
  /*
    Four outcomes must not become an event name per outcome per transport. If
    one ever does, every funnel built on these has to be rebuilt by hand.

    PostHog's OWN events are not in scope and are filtered out by their `$`
    prefix, which is reserved for them. This suite defaults to localhost, where
    the SDK never boots (see the prod-host guard in instrumentation-client.ts)
    and the question never comes up — but pointed at the real site it does, and
    $autocapture, $web_vitals, $snapshot, $$heatmap and $dead_click are not the
    share control inventing a name.
  */
  const strays = [...everyName].filter((n) => !SHARE_EVENTS.has(n) && !n.startsWith("$"));
  check(
    "no branch invented an event name of its own",
    strays.length === 0,
    strays.length ? strays.join(", ") : [...everyName].sort().join(", "),
  );
  /*
    AND ALL FOUR ARE REACHABLE. A taxonomy with an unreachable name is a
    breakdown with a permanently empty row, and the two dead-button reports
    were diagnosed from exactly the rows this asserts are wired up.
  */
  const missing = [...SHARE_EVENTS].filter((n) => !everyName.has(n));
  check(
    "and all four were reached by the branches above",
    missing.length === 0,
    missing.length ? `never fired: ${missing.join(", ")}` : [...everyName].sort().join(", "),
  );
}

await browser.close();
console.log("-".repeat(74));
console.log(
  failures === 0
    ? "\nPASS: the picture and the link reach the OS, and every ending is recorded.\n"
    : `\nFAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
