/**
 * Prove that the Growth tab counts people, separates paid from organic, and
 * never calls a stale number current.
 *
 *   npm run verify:growth
 *
 * ===========================================================================
 * WHY THIS EXISTS
 * ===========================================================================
 * Three things about this panel are load-bearing and all three fail silently.
 *
 *   1. THE COUNTING UNIT. Mixing people at the top of a funnel with events at
 *      the bottom flatters the bottom, and it has already happened once on this
 *      dashboard. The subtler version is counting DIFFERENT PEOPLE per stage,
 *      which makes the channel table stop adding up to the funnel above it by
 *      an amount nobody can account for.
 *
 *   2. PAID AGAINST ORGANIC. Reddit runs both at once and they convert nothing
 *      alike. A blended Reddit row describes neither, and one has already been
 *      shown to the owner and drawn the wrong conclusion. The blend must not be
 *      reachable, so this suite computes it and asserts it appears nowhere.
 *
 *   3. THE BOT COHORT AND THE FRESHNESS STAMP. The crawler exclusion arrives
 *      through PostHog's `{filters}` placeholder, so a query that loses the
 *      placeholder silently re-inflates the dead channels with no error. And a
 *      freshness stamp served out of PostHog's result cache would report a
 *      frozen mirror as current, which is the exact failure the stamp exists to
 *      prevent — a six-hour cache target was measured on this project.
 *
 * ===========================================================================
 * IT DRIVES THE REAL ASSEMBLY, NOT A RESTATEMENT OF IT
 * ===========================================================================
 * `fetchGrowth` is imported and called. `fetch` is stubbed, so every statement
 * the module sends is captured and can be asserted on directly — which is how
 * the `{filters}` placeholder, the `filterTestAccounts` flag and the
 * cache-bypass are checked as facts about the outgoing request rather than as
 * intentions in a comment.
 *
 * Nothing reaches PostHog. The key is a stub and the network is a fixture.
 */
import { registerHooks } from "node:module";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

/* == the environment this runs in ======================================== */

// Present so the module gets past its own configuration guard. It is never
// sent anywhere: the fetch below answers before the network is reached.
process.env.POSTHOG_PERSONAL_API_KEY = "phx_stub_key_not_a_real_credential";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export{}", shortCircuit: true };
    }
    return next(specifier, context);
  },
});

/* == the network, which is a fixture and a recorder ====================== */

const MINUTE = 60 * 1000;
const NOW = Date.parse("2026-08-09T12:00:00Z");

/** Every request the module made, in order. */
let sent = [];
/** Flipped per case to steer the two warehouse answers. */
let scenario = {};

const utc = (msAgo) =>
  new Date(NOW - msAgo).toISOString().replace("T", " ").replace("Z", "").replace(/$/, "000");

/**
 * The channel fixture.
 *
 * Reddit appears on both sides with the rates that caused the trouble: 12.48%
 * bought against 27.27% earned. TikTok is the volume, Google is a small organic
 * tail, and Meta is a live-but-quiet paid source that has not been seen for
 * three days — the "channel going quiet" case.
 */
const CHANNELS = [
  // channel, paid, landed, started, completed, emailed, minutes since last event
  ["TikTok", 1, 5591, 400, 250, 71, 4],
  ["Reddit", 1, 641, 120, 90, 80, 9],
  ["Reddit", 0, 44, 20, 14, 12, 130],
  ["Google Search", 0, 70, 30, 20, 14, 47],
  ["Meta", 1, 12, 1, 0, 0, 3 * 24 * 60],
];

const FUNNEL = {
  landed: CHANNELS.reduce((a, c) => a + c[2], 0),
  started: CHANNELS.reduce((a, c) => a + c[3], 0),
  completed: CHANNELS.reduce((a, c) => a + c[4], 0),
  emailed: CHANNELS.reduce((a, c) => a + c[5], 0),
  seen_without_pageview: 754,
  without_pageview_emailed: 12,
  // Non-zero on purpose. Zero is the live value, and a fixture that agreed
  // with it would pass whether or not the number was plumbed through at all.
  without_pageview_completed: 3,
};

const answer = (columns, results, extra = {}) =>
  new Response(
    JSON.stringify({ columns, results, last_refresh: extra.lastRefresh ?? null, ...extra.body }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  const sql = String(body.query?.query ?? "");
  sent.push({ url: String(url), sql, filters: body.query?.filters, refresh: body.refresh });

  if (sql.includes("system.data_warehouse_tables")) {
    if (scenario.syncThrows) {
      return new Response(JSON.stringify({ detail: "warehouse source removed" }), { status: 400 });
    }
    const rows = scenario.syncMissing
      ? []
      : [["test_results", utc(scenario.mirrorAgeMs ?? 20 * MINUTE)]];
    return answer(["name", "synced_at"], rows, {
      lastRefresh: new Date(NOW).toISOString(),
    });
  }

  if (sql.includes("FROM test_results")) {
    if (scenario.emailsThrow) {
      return new Response(JSON.stringify({ detail: "table not found" }), { status: 400 });
    }
    // 231 rows carry an address; they deduplicate to 215 people, of whom 152
    // sat the adult test and 71 a child one — so eight households did both.
    return answer(
      ["rows_total", "rows_with_email", "addresses", "adult", "child"],
      [[377, 231, 215, 152, 71]],
    );
  }

  if (sql.includes("seen_without_pageview")) {
    return answer(Object.keys(FUNNEL), [Object.values(FUNNEL)], {
      lastRefresh: new Date(NOW - (scenario.posthogAgeMs ?? 2000)).toISOString(),
      body: { is_cached: scenario.posthogCached ?? false },
    });
  }

  if (sql.includes("last_activity")) {
    return answer(
      ["channel", "paid", "landed", "started", "completed", "emailed", "last_activity"],
      CHANNELS.map(([channel, paid, landed, started, completed, emailed, mins]) => [
        channel,
        paid,
        landed,
        started,
        completed,
        emailed,
        utc(mins * MINUTE),
      ]),
    );
  }

  throw new Error(`verify-growth: unstubbed query\n${sql}`);
};

/* == the code under test ================================================= */

const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { fetchGrowth } = await load("lib/dashboard/growth.ts");
const { resolveRange } = await load("lib/dashboard/time-range.ts");

const RANGE = resolveRange({ preset: "since_launch" }, NOW);

async function run(next = {}, { filtered = true } = {}) {
  scenario = next;
  sent = [];
  return fetchGrowth(RANGE, filtered, NOW);
}

/* == the cases =========================================================== */

let failures = 0;

function check(ok, label, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

const near = (a, b) => a !== null && Math.abs(a - b) < 1e-9;

/* -- 1. the counting unit, and one population ----------------------------- */
{
  const g = await run();
  const f = g.funnel;

  check(f.landed === 6358, "landed is every person who loaded a page", String(f.landed));
  check(
    near(f.startRate, f.started / f.landed),
    "the start rate is started over landed",
    `${f.startRate}`,
  );
  check(
    near(f.completionRate, f.completed / f.started),
    "the completion rate is measured against starters, not against landings",
  );
  check(near(f.emailRate, f.emailed / f.completed), "the email rate is measured against finishers");

  const sum = (key) => g.channels.reduce((acc, row) => acc + row[key], 0);
  check(sum("landed") === f.landed, "the channel table adds up to the top of the funnel");
  check(sum("started") === f.started, "…and to the second stage");
  check(sum("completed") === f.completed, "…and to the third");
  check(sum("emailed") === f.emailed, "…and to the fourth");

  const sides = g.sides.reduce((acc, s) => acc + s.landed, 0);
  check(sides === f.landed, "paid and organic together are the whole funnel", String(sides));

  /* -- the people the funnel cannot hold are named, not dropped ---------- */
  check(f.seenWithoutPageview === 754, "people seen without a pageview are reported");
  check(
    f.withoutPageviewEmailed === 12,
    "and so is how many of them converted, which is why this stage differs from the Signups tile",
  );
  check(
    f.withoutPageviewCompleted === 3,
    "and how many of them finished a test, so the pageview-only population can be ruled in or out by reading rather than by investigating",
    String(f.withoutPageviewCompleted),
  );
}

/* -- 2. Reddit is two rows, and the blend is unreachable ------------------ */
{
  const g = await run();
  const reddit = g.channels.filter((r) => r.channel === "Reddit");

  check(reddit.length === 2, "Reddit appears once for paid and once for organic");
  const paid = reddit.find((r) => r.paid);
  const organic = reddit.find((r) => !r.paid);
  check(near(paid.signupRate, 80 / 641), "Reddit paid keeps its own rate", `${paid.signupRate}`);
  check(
    near(organic.signupRate, 12 / 44),
    "Reddit organic keeps its own rate",
    `${organic.signupRate}`,
  );

  /*
    The number that must not exist anywhere on the page. 13.4% is neither of
    the two real rates and it is what a blended row would print.
  */
  const blend = (80 + 12) / (641 + 44);
  check(
    !g.channels.some((r) => near(r.signupRate, blend)),
    "no row carries the blended Reddit rate",
    `${(blend * 100).toFixed(2)}%`,
  );

  const iPaid = g.channels.indexOf(paid);
  const iOrganic = g.channels.indexOf(organic);
  check(
    Math.abs(iPaid - iOrganic) === 1,
    "a channel's two sides are adjacent, so the comparison is not a scroll apart",
    `rows ${iPaid} and ${iOrganic}`,
  );
  check(iPaid < iOrganic, "paid leads within a channel");

  /* -- the summary the spend decision turns on --------------------------- */
  const p = g.sides.find((s) => s.side === "paid");
  const o = g.sides.find((s) => s.side === "organic");
  check(p.landed === 6244 && o.landed === 114, "paid and organic visitors are separated");
  check(near(p.signupRate, 151 / 6244), "paid conversion is its own number");
  check(near(o.signupRate, 26 / 114), "organic conversion is its own number");
  check(o.signupRate > p.signupRate * 5, "the gap the owner is deciding on survives the maths");
  check(near(p.shareOfTraffic, 6244 / 6358), "share of traffic is reported for each side");
}

/* -- 3. last activity, which is how a dead channel gets noticed ----------- */
{
  const g = await run();
  const meta = g.channels.find((r) => r.channel === "Meta");
  const tiktok = g.channels.find((r) => r.channel === "TikTok");

  check(meta.lastActivityAgeSeconds === 3 * 24 * 3600, "a quiet channel reports its silence");
  check(tiktok.lastActivityAgeSeconds === 4 * 60, "a live channel reports minutes");
  check(
    meta.lastActivity.endsWith("Z"),
    "last activity is normalised to UTC rather than left ambiguous",
    meta.lastActivity,
  );
  check(
    Date.parse(meta.lastActivity) === NOW - 3 * 24 * 3600 * 1000,
    "…and it is the right instant, not the reader's local offset",
  );
}

/* -- 4. the exclusions come from PostHog, and reach every events query ---- */
{
  await run();
  const events = sent.filter((r) => !r.sql.includes("test_results") && !r.sql.includes("system."));
  check(events.length === 2, "the events half is two queries", String(events.length));
  check(
    events.every((r) => r.sql.includes("{filters}")),
    "every events query carries the {filters} placeholder, which is how the crawler cohort is applied",
  );
  check(
    events.every((r) => r.filters?.filterTestAccounts === true),
    "…and asks PostHog to substitute the project's live test-account filters",
  );
  check(
    !sent.some((r) => /NOT IN COHORT|distinct_id NOT IN/i.test(r.sql)),
    "no query hand-writes a cohort or an id list, which is what drifted last time",
  );

  const warehouse = sent.filter((r) => r.sql.includes("FROM test_results"));
  check(warehouse.length === 1, "the address count is one query");
  check(
    warehouse.every((r) => r.filters === undefined && !r.sql.includes("{filters}")),
    "the pre-filtered warehouse export is not filtered a second time",
  );

  /* -- and the raw toggle still reaches PostHog -------------------------- */
  await run({}, { filtered: false });
  const raw = sent.filter((r) => !r.sql.includes("test_results") && !r.sql.includes("system."));
  check(
    raw.every((r) => r.filters?.filterTestAccounts === false),
    "the internal-user toggle still turns the filter off, crawlers and all",
  );
}

/* -- 5. freshness, which may never overstate itself ----------------------- */
{
  /* -- a mirror inside its hourly cadence is not nagged about ------------ */
  const healthy = await run({ mirrorAgeMs: 20 * MINUTE });
  check(!healthy.freshness.warehouse.stale, "a mirror 20 minutes behind is not called stale");
  check(
    healthy.freshness.warehouse.ageSeconds === 20 * 60,
    "and its age is reported",
    `${healthy.freshness.warehouse.ageSeconds}`,
  );
  check(!healthy.freshness.posthog.stale, "a live PostHog answer is not called stale");
  check(
    healthy.freshness.posthog.at !== healthy.freshness.warehouse.at,
    "the two sources carry their own timestamps rather than one shared as-of",
  );

  /* -- the case this was built for: Aurora down, mirror frozen ----------- */
  const frozen = await run({ mirrorAgeMs: 5 * 60 * MINUTE });
  check(frozen.freshness.warehouse.stale, "a mirror five hours behind is called stale");
  check(
    /behind the visitor numbers/i.test(frozen.freshness.warehouse.note),
    "and says plainly that it is behind the live numbers",
    frozen.freshness.warehouse.note,
  );
  check(
    !frozen.freshness.posthog.stale,
    "while the PostHog half is still reported as current, because it is",
  );
  check(
    frozen.funnel.landed === 6358 && frozen.channels.length === 5,
    "a frozen mirror does not take the funnel or the channel table down with it",
  );

  /* -- and the direction of the doubt ------------------------------------ */
  const unknown = await run({ syncMissing: true });
  check(
    unknown.freshness.warehouse.stale,
    "a mirror whose age cannot be established is treated as stale, never as current",
  );

  const broken = await run({ syncThrows: true });
  check(broken.freshness.warehouse.stale, "…and so is one whose sync time cannot be read at all");

  const noEmails = await run({ emailsThrow: true });
  check(noEmails.emails === null, "a failed address count is absent rather than approximated");
  check(noEmails.warehouseError !== null, "and it says why");
  check(
    noEmails.funnel.landed === 6358,
    "while the two things the owner reads every time still render",
  );
}

/* -- 6. the freshness query refuses PostHog's cache ----------------------- */
{
  await run();
  const sync = sent.find((r) => r.sql.includes("system.data_warehouse_tables"));
  check(
    sync?.refresh === "force_blocking",
    "the sync-time query bypasses PostHog's result cache",
    String(sync?.refresh),
  );
  check(
    sent.filter((r) => r.refresh === "force_blocking").length === 1,
    "and it is the only one that pays for a cache miss",
  );
}

/* -- 7. the address count is addresses, not rows -------------------------- */
{
  const g = await run();
  check(g.emails.addresses === 215, "the headline is distinct addresses");
  check(
    g.emails.rowsWithEmail === 231 && g.emails.finishedTests === 377,
    "the rows behind it are shown too, so the deduplication is visible rather than implied",
  );
  check(g.emails.adult === 152 && g.emails.child === 71, "the adult and child split is reported");
  check(
    g.emails.both === 8,
    "and the households counted in both columns are named, so 152 + 71 > 215 is explained",
    String(g.emails.both),
  );
}

/* -- 8. the two counting units stay apart --------------------------------- */
/*
  The defect this guards: the funnel's PEOPLE figure and the warehouse's
  FINISHED TESTS figure were both called "completions" on one tab, so the page
  looked like it was reporting one number twice and disagreeing with itself.
  They are different quantities off different systems and they are allowed to
  differ — what is not allowed is for the payload to name them the same thing.
*/
{
  const g = await run();

  check(
    !("completions" in g.emails),
    "the warehouse figure is not called `completions`, the word that got it read as a headcount",
    Object.keys(g.emails).join(", "),
  );
  check(
    typeof g.emails.finishedTests === "number" && typeof g.funnel.completed === "number",
    "both units are carried, separately named",
  );
  check(
    g.funnel.completed === 374 && g.emails.finishedTests === 377,
    "and they are free to differ, because people and finished tests are not the same quantity",
    `${g.funnel.completed} people, ${g.emails.finishedTests} tests`,
  );

  /*
    The people behind the warehouse figure are a RANGE, never a number: the
    addresses are a floor and the anonymous finishers are the rest of the
    ceiling. A panel that resolved this to one figure would be guessing.
  */
  const anonymous = g.emails.finishedTests - g.emails.rowsWithEmail;
  check(
    anonymous === 146 && g.emails.addresses === 215,
    "anonymous finishers are recoverable from the payload, which is what makes the headcount a bounded range",
    `${anonymous} anonymous`,
  );
  check(
    g.emails.addresses <= g.emails.finishedTests,
    "distinct people can never exceed the finished tests they came from",
  );
}

console.log(
  failures === 0
    ? `\nverify-growth: OK. Four stages of people over one population, finished tests kept distinct from them, Reddit split in two, and neither clock lies.`
    : `\nverify-growth: ${failures} failure(s).`,
);
if (failures > 0) process.exit(1);
