/**
 * The deep entry URLs, end to end.
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-entry-links.mjs [baseUrl]
 *   npm run verify:entry-links -- https://www.smartfellaorfartsmella.com
 *
 * ===========================================================================
 * WHAT THIS IS PROTECTING
 * ===========================================================================
 * `/adult` and `/kids` exist so paid traffic skips the fork screen that 91.8%
 * of it was dying on. Two things can go wrong quietly, and both are expensive:
 *
 *   ATTRIBUTION. The URLs carry utm_source, utm_medium, utm_campaign, a
 *   per-creative utm_content, and a ttclid that TikTok appends. Lose any one of
 *   them and the ad test cannot be read at all — the spend still happens, the
 *   answer just never arrives. This project has already lost attribution once
 *   that way, when a vanity link emitted a utm_source of its own invention.
 *
 *   MEASURABILITY. A deep-linked visitor never taps the fork, so unless
 *   something equivalent is recorded they appear to skip a funnel stage and the
 *   improvement reads as a regression.
 *
 * So the assertions below are deliberately about the boring end of both: the
 * exact bytes of the query string, and the exact properties on the events.
 *
 * ===========================================================================
 * KEEPING ITS OWN TRAFFIC OUT OF THE NUMBERS IT IS CHECKING — TWO LAYERS
 * ===========================================================================
 * A verifier for the dashboard's honesty must not be the thing that puts
 * synthetic funnel steps into the dashboard. It takes two mechanisms, because
 * the obvious one has a hole in it.
 *
 *   1. INTERCEPTION. Every event POST to /ingest is caught, decoded, asserted
 *      on, and answered with a local 200. The SDK believes it delivered.
 *
 *   2. THE INTERNAL STAMP. Layer 1 is not airtight and this file learned that
 *      the expensive way: the batch the SDK queues as a tab CLOSES leaves as a
 *      `sendBeacon` during unload, which a route handler on a closing page does
 *      not reliably see. An early version of this suite leaked six synthetic
 *      people into the production project that way — six humans who "chose a
 *      branch" and never started a test, landing squarely on the funnel step
 *      this whole feature is being measured by.
 *
 *      So the browser also marks itself internal before any page script runs
 *      (the same durable flag /internal sets), which stamps `is_internal: true`
 *      on every event including the ones that escape, and the project's
 *      test-account filter excludes them from every public number.
 *
 * Neither layer alone is enough. Do not remove either.
 *
 * `/flags/` and `/static/` pass through untouched, because the SDK needs real
 * answers to those to boot at all.
 *
 * ===========================================================================
 * WHY IT PRETENDS NOT TO BE A ROBOT
 * ===========================================================================
 * posthog-js drops every capture when `navigator.webdriver` is true. Left
 * alone, this suite observes an empty event stream and passes every assertion
 * about events by never making one — the worst possible failure for a file
 * whose whole job is to prove events are correct. Masking the flag is what
 * makes the event assertions real, and the count check at the end is what makes
 * sure they ran.
 *
 * Against localhost the SDK does not boot at all (see the PROD_HOSTS guard in
 * instrumentation-client.ts), so the event section reports itself SKIPPED
 * rather than passing. Point it at production to exercise it.
 */
import { gunzipSync, inflateSync } from "node:zlib";

import { chromium } from "playwright-core";

import {
  ADULT_SEED,
  childSeedFromSegment,
  entryBranchForPath,
  entryFlowState,
  parseGradeSegment,
} from "../lib/test/entry.ts";
import { ADULT_TEST } from "../lib/test/tests/index.ts";
import { displayTestTitle, getTest } from "../lib/test/tests/index.ts";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");

/** Everything a TikTok ad click actually carries, ttclid included. */
const AD_QUERY =
  "utm_source=tiktok&utm_medium=paid_social&utm_campaign=2026-08_fork_skip" +
  "&utm_content=creative_07&utm_term=hookB&ttclid=E.C.P.TT-abc123XYZ";
const AD_PARAMS = [
  ["utm_source", "tiktok"],
  ["utm_medium", "paid_social"],
  ["utm_campaign", "2026-08_fork_skip"],
  ["utm_content", "creative_07"],
  ["utm_term", "hookB"],
  ["ttclid", "E.C.P.TT-abc123XYZ"],
];

let failures = 0;
let checks = 0;
const check = (name, pass, detail = "") => {
  checks++;
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
};
const section = (title) => console.log(`\n${title}\n${"-".repeat(72)}`);

console.log(`\nDEEP ENTRY LINKS  ${BASE}`);

/* ==========================================================================
 * 1. The URL vocabulary, with no browser in the way.
 *
 * These are the assertions that stay true on a machine with no network, and
 * they are the ones that catch a bad grade turning into a broken test.
 * ========================================================================== */
section("1. Parsing and seeding");

for (const g of [3, 4, 5, 6, 7, 8]) {
  check(`grade "${g}" parses`, parseGradeSegment(String(g)) === g);
}
for (const bad of ["9", "99", "0", "2", "12", "abc", "", "-1", "3.5", "03x", null, undefined, "٣"]) {
  check(`grade ${JSON.stringify(bad)} rejected`, parseGradeSegment(bad) === null);
}

const adultState = entryFlowState(ADULT_SEED);
check("adult seed opens the intro", adultState.step === "intro");
check("adult seed picks the adult test", adultState.audience === "adult");
check("adult seed resolves a real test", getTest(adultState.audience, adultState.grade) === ADULT_TEST);

const kidsState = entryFlowState(childSeedFromSegment(null));
check("bare /kids opens the grade picker", kidsState.step === "grade");
check("bare /kids is the child branch", kidsState.audience === "child" && kidsState.fork === "child");
check("bare /kids reports no rejected grade", childSeedFromSegment(null).gradeRejected === false);

const grade5 = childSeedFromSegment("5");
const grade5State = entryFlowState(grade5);
check("/kids/5 opens the intro", grade5State.step === "intro");
check("/kids/5 resolves the grade-5 bank", getTest("child", grade5State.grade)?.id === "grade-5");

const bad99 = childSeedFromSegment("99");
const bad99State = entryFlowState(bad99);
check("/kids/99 falls back to the grade picker", bad99State.step === "grade");
check("/kids/99 keeps the child branch", bad99State.audience === "child");
check("/kids/99 carries no grade", bad99State.grade === null);
check("/kids/99 flags the rejected grade", bad99.gradeRejected === true);
/*
  THE ONE THAT MATTERS MOST IN THIS SECTION. Every state a URL can produce must
  resolve to a real test or to a screen that asks for the missing piece. A seed
  that reached the intro with no test behind it is the "broken test" case.
*/
for (const seed of [ADULT_SEED, childSeedFromSegment(null), grade5, bad99, childSeedFromSegment("x")]) {
  const s = entryFlowState(seed);
  const resolvable = s.step === "grade" || getTest(s.audience, s.grade) !== null;
  check(`seed ${JSON.stringify(seed)} never reaches a testless intro`, resolvable);
}

check("entryBranchForPath /adult", entryBranchForPath("/adult") === "adult");
check("entryBranchForPath /grownup", entryBranchForPath("/grownup") === "adult");
check("entryBranchForPath /kids", entryBranchForPath("/kids") === "child");
check("entryBranchForPath /kids/5", entryBranchForPath("/kids/5") === "child");
check("entryBranchForPath tolerates a trailing slash", entryBranchForPath("/adult/") === "adult");
check("entryBranchForPath ignores /", entryBranchForPath("/") === null);
// The existing top-level paths must not be read as entry paths, or every
// vanity-link visit would be filed as deep-linked traffic.
for (const p of ["/tiktok", "/instagram", "/youtube", "/reddit", "/about", "/privacy", "/kidsafe"]) {
  check(`entryBranchForPath ignores ${p}`, entryBranchForPath(p) === null);
}

/* ==========================================================================
 * 2. Nothing on the way in rewrites the query string.
 *
 * THE INVARIANT IS "PATH AND QUERY ARRIVE UNCHANGED", NOT "ZERO REDIRECTS".
 * The domain legitimately answers an http -> https 308 and an apex -> www hop,
 * and those preserve everything. What must never happen is a hop that rewrites
 * the path or the query — that is the failure that took a month of Facebook
 * traffic and filed it under a channel that does not exist, and it is the
 * reason these entry paths are routes rather than redirects in the first place.
 * Asserting "must be 200" instead would have gone red on a healthy TLS upgrade,
 * which is how a suite gets ignored.
 * ========================================================================== */
section("2. Nothing rewrites the query on the way in");

const ENTRY_PATHS_UNDER_TEST = ["/adult", "/grownup", "/kids", "/kids/5", "/kids/99"];

for (const path of ENTRY_PATHS_UNDER_TEST) {
  const start = `${BASE}${path}?${AD_QUERY}`;
  const chain = [];
  let url = start;
  let status = 0;
  let rewrote = "";

  try {
    for (let hop = 0; hop < 4; hop++) {
      const res = await fetch(url, { redirect: "manual" });
      status = res.status;
      if (status < 300 || status >= 400) break;
      const location = res.headers.get("location");
      if (!location) break;
      const next = new URL(location, url);
      const from = new URL(url);
      if (next.pathname !== from.pathname || next.search !== from.search) {
        rewrote = `${from.pathname}${from.search} -> ${next.pathname}${next.search}`;
        break;
      }
      chain.push(`${status} -> ${next.origin}`);
      url = next.toString();
    }
  } catch (err) {
    check(`${path} responds`, false, String(err).slice(0, 90));
    continue;
  }

  check(`${path} arrives with its query intact`, rewrote === "", rewrote);
  check(
    `${path} ends on a page`,
    status === 200,
    `status ${status}${chain.length ? ` after ${chain.join(", ")}` : ""}`,
  );
}

/* ==========================================================================
 * 3. The browser: right screen, query string untouched, fork still intact.
 * ========================================================================== */
section("3. Screens and the address bar");

/*
  HOST_MAP EXERCISES SECTION 4 AGAINST A LOCAL BUILD.

  The SDK refuses to boot anywhere but the production hostname, so a local run
  can only ever SKIP the event assertions — which means a change to the
  instrumentation cannot be checked until after it is deployed. Mapping the
  production hostname at the resolver gives the page the hostname the guard
  wants while serving the build in front of you:

    npm start
    HOST_MAP="www.smartfellaorfartsmella.com:80 127.0.0.1:3000" \
      npm run verify:entry-links -- http://www.smartfellaorfartsmella.com

  Nothing reaches the real project either way; the interceptor still answers
  every event POST locally.
*/
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: [
    // Chrome advertises itself as automated by default and posthog-js treats
    // that as a bot. See the header note.
    "--disable-blink-features=AutomationControlled",
    ...(process.env.HOST_MAP ? [`--host-resolver-rules=MAP ${process.env.HOST_MAP}`] : []),
  ],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
});
await context.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
  // Layer 2 — see the header. Set before any page script runs, so it is already
  // there when instrumentation-client.ts reads it synchronously ahead of the
  // first capture. `sffs_ph_internal` is INTERNAL_STORAGE_KEY in
  // lib/analytics/events.ts; it is written literally here because an init
  // script is serialised into the page and cannot close over an import.
  try {
    localStorage.setItem("sffs_ph_internal", "1");
  } catch {
    /* storage blocked — interception is still in front of it */
  }
});

/* -- the interceptor ------------------------------------------------------ */
let captured = [];
function decodeBody(buf) {
  if (!buf) return null;
  const attempts = [
    () => JSON.parse(gunzipSync(buf).toString("utf8")),
    () => JSON.parse(inflateSync(buf).toString("utf8")),
    () => JSON.parse(buf.toString("utf8")),
    () => {
      const m = /(?:^|&)data=([^&]*)/.exec(buf.toString("utf8"));
      return JSON.parse(Buffer.from(decodeURIComponent(m[1]), "base64").toString("utf8"));
    },
  ];
  for (const attempt of attempts) {
    try {
      return attempt();
    } catch {
      /* next shape */
    }
  }
  return null;
}
let undecodable = 0;
await context.route("**/ingest/**", async (route) => {
  const req = route.request();
  const url = req.url();
  // The SDK needs genuine answers to these or it never starts capturing.
  if (url.includes("/static/") || url.includes("/array/") || url.includes("/flags/")) {
    return route.continue();
  }
  const decoded = decodeBody(req.postDataBuffer());
  if (decoded) {
    for (const e of Array.isArray(decoded) ? decoded : [decoded]) {
      if (e && e.event) captured.push(e);
    }
  } else if (req.postDataBuffer()) {
    undecodable++;
  }
  // Answered locally: nothing reaches the project.
  await route.fulfill({ status: 200, contentType: "application/json", body: '{"status":1}' });
});

let page = await context.newPage();

/**
 * Land on a path with the full ad query string, as a brand new visitor.
 *
 * A NEW TAB EACH TIME, because sessionStorage is per-tab and the flow's saved
 * state legitimately beats the URL — a visitor who deep-linked to /adult and is
 * now on question eleven must not be thrown back to the intro by a reload (see
 * the restore note in components/test/test-flow.tsx). That is correct product
 * behaviour and it makes the previous screen in this suite contaminate the next
 * one: /kids would restore /adult's intro and report no branch at all.
 *
 * Clearing storage in the page was the first attempt and it is a RACE — the
 * flow's persist effect can write the restored state back after the clear and
 * before the reload, so the suite failed on roughly one run in three. A fresh
 * tab has empty sessionStorage by construction, with nothing to time.
 */
async function land(path) {
  if (page) {
    // Closed BEFORE the capture buffer is reset, so the dying tab's unload
    // events cannot land in the next screen's assertions.
    await page.close();
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  page = await context.newPage();
  captured = [];
  const url = `${BASE}${path}?${AD_QUERY}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2600);
  return url;
}

/**
 * Everything PostHog would have been told, once the SDK's queue has drained.
 *
 * WAITS IN PLACE RATHER THAN NAVIGATING AWAY. Navigating looks like the obvious
 * way to force a flush, and it cost an afternoon: the queue leaves as a beacon
 * during unload, the interceptor sees some of it and not the rest, and the
 * suite reports a page that fired a pageview and no test events — which is
 * indistinguishable from the bug it exists to catch. Sitting still for longer
 * than the batch interval is slower and it is not a lie.
 */
async function settle() {
  await page.waitForTimeout(4200);
  return captured;
}

/*
  CASE-INSENSITIVE, because `innerText` returns text as RENDERED and the display
  face is `text-transform: uppercase` — "Start the test" reaches the DOM as
  "START THE TEST". A case-sensitive check here fails on a page that is
  perfectly correct, which is the kind of red that teaches people to ignore a
  suite.
*/
const says = (text, needle) => text.toLowerCase().includes(needle.toLowerCase());

const screens = [
  {
    path: "/adult",
    expect: [ADULT_TEST.title, "Here is how it works"],
    reject: ["What grade"],
    buttons: [/start the test/i],
    noButtons: [/I'm a kid/i, /I'm an adult/i],
  },
  {
    path: "/grownup",
    expect: [ADULT_TEST.title, "Here is how it works"],
    reject: ["What grade"],
    buttons: [/start the test/i],
    noButtons: [/I'm a kid/i],
  },
  {
    path: "/kids",
    expect: ["What grade are you in?"],
    reject: ["Here is how it works"],
    // The grade buttons render as a bare numeral, so they are only findable by
    // their accessible name — which is also the thing a screen reader gets.
    buttons: [/^Grade 3$/, /^Grade 8$/],
    noButtons: [/start the test/i, /I'm an adult/i],
  },
  {
    path: "/kids/5",
    expect: [displayTestTitle(getTest("child", 5), 5)],
    reject: ["What grade are you in?"],
    buttons: [/start the test/i],
    noButtons: [/^Grade 3$/],
  },
  {
    // The hand-edited case. It must land somewhere real.
    path: "/kids/99",
    expect: ["What grade are you in?"],
    reject: ["Something went sideways"],
    buttons: [/^Grade 3$/, /^Grade 8$/],
    noButtons: [/start the test/i],
  },
];

for (const screen of screens) {
  const url = await land(screen.path);
  const text = await page.evaluate(() => document.body.innerText);

  for (const want of screen.expect) {
    check(`${screen.path} shows "${want}"`, says(text, want));
  }
  for (const nope of screen.reject) {
    check(`${screen.path} does not show "${nope}"`, !says(text, nope));
  }
  for (const name of screen.buttons) {
    check(`${screen.path} offers ${name}`, (await page.getByRole("button", { name }).count()) > 0);
  }
  for (const name of screen.noButtons) {
    check(
      `${screen.path} does not offer ${name}`,
      (await page.getByRole("button", { name }).count()) === 0,
    );
  }

  /*
    BYTE FOR BYTE, not "the params are all present somewhere". A redirect that
    reordered or re-encoded the query string would still pass a looser check
    while breaking the per-creative join on utm_content.
  */
  check(`${screen.path} address bar is untouched`, page.url() === url, page.url());

  const search = await page.evaluate(() => window.location.search);
  for (const [key, value] of AD_PARAMS) {
    const got = new URLSearchParams(search).get(key);
    check(`${screen.path} keeps ${key}`, got === value, got === null ? "missing" : `got ${got}`);
  }
}

/* -- the ordinary fork, untouched ---------------------------------------- */
await land("/");
check(
  "/ still shows both fork cards",
  (await page.getByRole("button", { name: /I'm an adult/i }).count()) === 1 &&
    (await page.getByRole("button", { name: /I'm a kid/i }).count()) === 1,
);
check(
  "/ does not skip into a test",
  (await page.getByRole("button", { name: /start the test/i }).count()) === 0,
);

/* ==========================================================================
 * 4. What PostHog is actually told.
 * ========================================================================== */
section("4. Events");

await land("/adult");
const adultEvents = await settle();

if (adultEvents.length === 0) {
  console.log(
    "  SKIP  no events observed — the SDK only boots on the production host\n" +
      "        (see PROD_HOSTS in instrumentation-client.ts). Re-run against\n" +
      "        https://www.smartfellaorfartsmella.com to exercise this section.",
  );
  check("event decoding did not silently fail", undecodable === 0, `${undecodable} undecodable bodies`);
} else {
  const fork = adultEvents.find((e) => e.event === "test_fork_selected");
  check("/adult reports a branch at all", Boolean(fork), fork ? "" : "no test_fork_selected");
  check("/adult reports the parent branch", fork?.properties?.fork === "parent", String(fork?.properties?.fork));
  check("/adult marks it a deep link", fork?.properties?.method === "deep_link", String(fork?.properties?.method));
  check(
    "/adult reports the audience too",
    adultEvents.some((e) => e.event === "test_audience_selected" && e.properties?.audience === "adult"),
  );
  check(
    "/adult opens on the intro step",
    adultEvents.some((e) => e.event === "test_step_viewed" && e.properties?.step === "intro"),
  );
  check(
    "/adult never reports the fork screen",
    !adultEvents.some((e) => e.event === "test_step_viewed" && e.properties?.step === "audience"),
  );

  /*
    EVERY event, not just the pageview. `entry` is a session super-property
    precisely so a breakdown works on any event in the funnel, and one event
    missing it is one chart that silently pools the two populations.
  */
  const missingEntry = adultEvents.filter((e) => e.properties?.entry !== "adult");
  check(
    "every /adult event carries entry=adult",
    missingEntry.length === 0,
    missingEntry.map((e) => `${e.event}=${e.properties?.entry}`).join(", ").slice(0, 120),
  );

  /*
    THE ATTRIBUTION ASSERTION. $current_url is what PostHog parses the UTMs out
    of and the only place ttclid survives, so it is checked on every event that
    reports one — a $snapshot carries no URL and is not evidence either way.
  */
  const withUrl = adultEvents.filter((e) => typeof e.properties?.$current_url === "string");
  check("some events report a URL", withUrl.length > 0);
  for (const [key, value] of AD_PARAMS) {
    const bad = withUrl.filter((e) => {
      const q = new URL(e.properties.$current_url).searchParams;
      return q.get(key) !== value;
    });
    check(`every event keeps ${key}`, bad.length === 0, bad.map((e) => e.event).join(", ").slice(0, 100));
  }
  check(
    "utm_source is read as tiktok",
    adultEvents.every((e) => e.properties?.platform === "tiktok"),
  );

  /* -- the child branch ---------------------------------------------------- */
  await land("/kids");
  const kidsEvents = await settle();
  const kidsFork = kidsEvents.find((e) => e.event === "test_fork_selected");
  check("/kids reports the child branch", kidsFork?.properties?.fork === "child", String(kidsFork?.properties?.fork));
  check("/kids marks it a deep link", kidsFork?.properties?.method === "deep_link");
  check("/kids does not claim a rejected grade", kidsFork?.properties?.grade_rejected === undefined);
  check(
    "/kids opens on the grade step",
    kidsEvents.some((e) => e.event === "test_step_viewed" && e.properties?.step === "grade"),
  );
  check(
    "every /kids event carries entry=child",
    kidsEvents.every((e) => e.properties?.entry === "child"),
    [...new Set(kidsEvents.map((e) => String(e.properties?.entry)))].join(", "),
  );

  /* -- a grade in the URL -------------------------------------------------- */
  await land("/kids/5");
  const gradeEvents = await settle();
  check(
    "/kids/5 reports the grade",
    gradeEvents.some((e) => e.event === "test_grade_selected" && Number(e.properties?.grade) === 5),
  );
  check(
    "/kids/5 opens on the intro step",
    gradeEvents.some((e) => e.event === "test_step_viewed" && e.properties?.step === "intro"),
  );

  /* -- the broken ad link -------------------------------------------------- */
  await land("/kids/99");
  const badEvents = await settle();
  const badFork = badEvents.find((e) => e.event === "test_fork_selected");
  check("/kids/99 still reports a branch", badFork?.properties?.fork === "child");
  check("/kids/99 raises the broken-link flag", badFork?.properties?.grade_rejected === true);
  check(
    "/kids/99 picks no grade",
    !badEvents.some((e) => e.event === "test_grade_selected"),
  );

  /* -- and the fork itself is still a tap ---------------------------------- */
  await land("/");
  await page.getByRole("button", { name: /I'm a kid/i }).click();
  await page.waitForTimeout(600);
  const forkEvents = await settle();
  const tap = forkEvents.find((e) => e.event === "test_fork_selected");
  check("the fork still reports a tap", tap?.properties?.method === "tap", String(tap?.properties?.method));
  check("the fork reports entry=fork", tap?.properties?.entry === "fork", String(tap?.properties?.entry));
  check(
    "the fork screen is still counted as viewed",
    forkEvents.some((e) => e.event === "test_step_viewed" && e.properties?.step === "audience"),
  );

  check("every event body decoded", undecodable === 0, `${undecodable} undecodable`);

  /*
    THE SUITE CHECKING ITSELF. Layer 2 of the pollution guard (see the header)
    is invisible when it works and silent when it breaks, and what it protects
    against — synthetic branch-choosers in the funnel — is the exact number this
    feature is judged on. So it is asserted rather than assumed.
  */
  const unstamped = [...adultEvents, ...forkEvents].filter(
    (e) => e.properties?.is_internal !== true,
  );
  check(
    "this suite's own events are stamped internal",
    unstamped.length === 0,
    unstamped.map((e) => e.event).join(", ").slice(0, 100),
  );
}

await browser.close();

console.log(`\n${"-".repeat(72)}`);
console.log(`${checks} checks, ${failures} failure(s).\n`);
process.exit(failures > 0 ? 1 : 0);
