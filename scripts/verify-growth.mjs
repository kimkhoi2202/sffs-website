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
 *
 * THE AUDIENCE SPLIT IS BUILT TO BE AWKWARD ON PURPOSE. The four extra columns
 * decompose `emailed` as `adult + child − both + unknown`, and a fixture where
 * that reduced to `adult + child` would pass whether or not the two residuals
 * were plumbed through at all. So TikTok carries BOTH residuals, Reddit paid
 * carries only the overlap, and two rows carry neither — and the two channels
 * lean opposite ways, which is the comparison the split exists to make.
 *
 * Meta carries exactly one emailed adult, which is what puts it under the
 * naming threshold in the audience panel and into the pooled tail. A fixture
 * where every channel was big enough to name would never execute the pooling
 * branch at all, and that branch is the one that can silently lose people.
 *
 * THE FINISHED COLUMNS DIFFER FROM THE COMPLETED ONES ON EVERY ROW BUT ONE.
 * `finished` is the people whose test was not written by the countdown, and
 * the four `finished_*` columns decompose `emailed` a second time over just
 * those people. A fixture where `finished` equalled `completed` would pass
 * whether or not the split was plumbed through at all, so TikTok — the paid
 * channel with the timer problem in real life — loses 90 of its 250, while
 * Reddit organic loses one and Meta loses none. TikTok's `finished_unknown`
 * is 12 against an `emailed_unknown` of 3: those nine are the people who left
 * the test and gave an address anyway, and they must land in the residual
 * rather than being credited to an audience they did not sit.
 */
const CHANNELS = [
  // channel, paid, landed, started, completed, emailed,
  //   adult, child, both, unknown,
  //   finished, f_adult, f_child, f_both, f_unknown, minutes since last event
  ["TikTok", 1, 5591, 400, 250, 71, 22, 50, 4, 3, 160, 20, 42, 3, 12, 4],
  ["Reddit", 1, 641, 120, 90, 80, 77, 5, 2, 0, 78, 75, 5, 2, 2, 9],
  ["Reddit", 0, 44, 20, 14, 12, 11, 1, 0, 0, 13, 11, 1, 0, 0, 130],
  ["Google Search", 0, 70, 30, 20, 14, 10, 4, 0, 0, 18, 10, 3, 0, 1, 47],
  ["Meta", 1, 12, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 3 * 24 * 60],
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
  // Ties to the channel table's own `finished` sum, the same way `completed`
  // does, because the two panels have to keep agreeing after the split.
  finished: CHANNELS.reduce((a, c) => a + c[10], 0),
  finished_emailed: 150,
  // Higher than the line above by the finishers whose address the 9 August
  // outage swallowed. If the correction were dropped the two would collapse
  // into each other, so they are deliberately different numbers.
  finished_emailed_corrected: 168,
  outage_lost: 22,
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
    /*
      231 rows carry an address; they deduplicate to 215 people, of whom 152
      sat the adult test and 71 a child one — so eight households did both.

      The accounting columns split those 377 rows into 280 the person finished
      and 97 the countdown wrote, and then hold the 9 August outage out of
      both: 37 of the 377 landed inside it, and exactly one of them recorded an
      address, which is the whole reason the window is held out.

      Every one of these is a different number from every other, on purpose.
      Fixtures where the raw and corrected figures coincide cannot tell a
      working correction from a missing one.
    */
    return answer(
      [
        "rows_total",
        "rows_with_email",
        "addresses",
        "adult",
        "child",
        "finished",
        "abandoned",
        "finished_email",
        "abandoned_email",
        "out_finished",
        "out_abandoned",
        "out_finished_email",
        "out_abandoned_email",
        "outage_finished",
        "outage_finished_email",
        "rule_timed_out",
        "rule_sparse",
        "both_signals",
      ],
      [[377, 231, 215, 152, 71, 280, 97, 205, 26, 250, 90, 204, 26, 30, 1, 130, 115, 97]],
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
      [
        "channel",
        "paid",
        "landed",
        "started",
        "completed",
        "emailed",
        "emailed_adult",
        "emailed_child",
        "emailed_both",
        "emailed_unknown",
        "finished",
        "finished_adult",
        "finished_child",
        "finished_both",
        "finished_unknown",
        "last_activity",
      ],
      CHANNELS.map((row) => [...row.slice(0, 15), utc(row[15] * MINUTE)]),
    );
  }

  throw new Error(`verify-growth: unstubbed query\n${sql}`);
};

/* == the code under test ================================================= */

const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { fetchGrowth } = await load("lib/dashboard/growth.ts");
const { resolveRange } = await load("lib/dashboard/time-range.ts");

const RANGE = resolveRange({ preset: "since_launch" }, NOW);

/**
 * A window that actually contains the 9 August delivery outage.
 *
 * The fixture clock is noon on 9 August, five hours before the sends started
 * failing, so the default window genuinely does not reach the outage and the
 * payload is right to say so. Exercising the correction needs a LATER clock,
 * not merely a wider window: `resolveRange` clamps every window's upper bound
 * to now, so asking for one that runs past the fixture's noon just gets noon
 * back. This is the window the owner reads in practice, the morning after.
 */
const AFTER_OUTAGE = Date.parse("2026-08-10T06:00:00Z");
const SPANNING_RANGE = resolveRange({ preset: "since_launch" }, AFTER_OUTAGE);

async function run(next = {}, { filtered = true, range = RANGE, nowMs = NOW } = {}) {
  scenario = next;
  sent = [];
  return fetchGrowth(range, filtered, nowMs);
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
  check(near(p.signupRate, 152 / 6244), "paid conversion is its own number");
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
    g.funnel.completed === 375 && g.emails.finishedTests === 377,
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

/* -- 9. the adult/child split decomposes Emailed, and never reallocates --- */
/*
  The defect this guards: a per-channel audience split that "adds up" because
  the people it could not resolve were dropped, or shared out across the
  channels that could. Either makes the column tidy and wrong, and this project
  has paid for that shape of error twice.

  The identity below is the whole contract. It is asserted PER ROW rather than
  only on the totals, because a split can be wrong on two rows in opposite
  directions and still total correctly.
*/
{
  const g = await run();
  const rows = g.channels;

  for (const row of rows) {
    const side = row.paid ? "paid" : "organic";
    check(
      row.emailedAdult + row.emailedChild - row.emailedBoth + row.emailedAudienceUnknown ===
        row.emailed,
      `${row.channel} ${side}: the audience split reconciles with its own Emailed figure`,
      `${row.emailedAdult} adult + ${row.emailedChild} child − ${row.emailedBoth} both + ${row.emailedAudienceUnknown} unresolved ≠ ${row.emailed}`,
    );
  }

  const sum = (key) => rows.reduce((acc, row) => acc + row[key], 0);
  check(
    sum("emailedAdult") === 121 && sum("emailedChild") === 60,
    "the split totals across the table",
    `${sum("emailedAdult")} adult, ${sum("emailedChild")} child`,
  );
  check(
    sum("emailedAdult") + sum("emailedChild") - sum("emailedBoth") + sum("emailedAudienceUnknown") ===
      g.funnel.emailed,
    "…and the whole split reconciles with the funnel's last stage",
    String(g.funnel.emailed),
  );

  /*
    The two residuals must SURVIVE the trip. Both are the numbers a tidier
    implementation would have quietly absorbed, so each is asserted as a
    standing figure rather than inferred from the identity above — which would
    hold just as well if both were zeroed and the adult count inflated to match.
  */
  check(
    sum("emailedBoth") === 6,
    "people who sat both papers are carried, not folded into one audience",
    String(sum("emailedBoth")),
  );
  check(
    sum("emailedAudienceUnknown") === 3,
    "and emailed people with no finished test stay unresolved rather than being assigned an audience",
    String(sum("emailedAudienceUnknown")),
  );

  const tiktok = rows.find((r) => r.channel === "TikTok");
  const redditPaid = rows.find((r) => r.channel === "Reddit" && r.paid);
  check(
    tiktok.emailedBoth === 4 && tiktok.emailedAudienceUnknown === 3,
    "a channel carrying both residuals keeps them apart from each other",
  );
  check(
    redditPaid.emailedAudienceUnknown === 0 && redditPaid.emailedBoth === 2,
    "and a channel where everyone resolves reports no unresolved people rather than a share of somebody else's",
  );

  /*
    The comparison the split exists to make: two channels that convert at a
    similar rate but bring different households. A blend of the two would say
    neither, which is the same mistake the paid/organic split already guards.
  */
  check(
    redditPaid.emailedAdult > redditPaid.emailedChild * 10 &&
      tiktok.emailedChild > tiktok.emailedAdult * 2,
    "two channels leaning opposite ways stay distinguishable",
    `Reddit ${redditPaid.emailedAdult}/${redditPaid.emailedChild}, TikTok ${tiktok.emailedAdult}/${tiktok.emailedChild}`,
  );

  /*
    WHERE THE AUDIENCE COMES FROM. The mirror's own `platform` column resolves
    only reddit and instagram — 507 of 666 live rows carry no channel at all —
    so a split sourced there could not describe TikTok, Google or direct
    traffic. It is read off `test_completed.audience` in the events half
    instead, and that must stay true: sourcing it from the warehouse would also
    put two clocks in one table.
  */
  const channelQuery = sent.find((r) => r.sql.includes("last_activity"));
  check(
    /test_completed'\s+AND\s+toString\(properties\.audience\)/.test(channelQuery.sql),
    "the audience is read off the test_completed event",
  );
  check(
    !channelQuery.sql.includes("test_results"),
    "and the channel table never reaches into the warehouse mirror, which carries no usable channel",
  );
  check(
    channelQuery.sql.includes("{filters}"),
    "…so the split inherits the same exclusions as the column it decomposes",
  );
}

/* -- 10. the audience panel is the same numbers, regrouped ---------------- */
/*
  The defect this guards: a second panel answering the same question off a
  second query, which is how two figures on one page start disagreeing by three
  people and nobody can say which is right. `audiences` must be a REGROUPING of
  the channel rows — same scan, same population, same counting unit — and the
  cheapest way to keep it that way is to assert that no extra query was sent
  and that every total still ties back to the table it came from.
*/
{
  const g = await run();
  const a = g.audiences;

  const events = sent.filter((r) => !r.sql.includes("test_results") && !r.sql.includes("system."));
  check(
    events.length === 2,
    "the audience panel costs no extra query — it is the channel rows regrouped",
    `${events.length} events queries`,
  );

  const sum = (key) => g.channels.reduce((acc, row) => acc + row[key], 0);
  check(
    a.adult.people === sum("emailedAdult") && a.child.people === sum("emailedChild"),
    "each audience total ties back to the column it was grouped from",
    `${a.adult.people} adult, ${a.child.people} child`,
  );
  check(
    a.emailed === g.funnel.emailed && a.both === 6 && a.neither === 3,
    "and the residuals travel with it, so the panel can say why the columns overshoot",
    `${a.emailed} emailed, ${a.both} both, ${a.neither} neither`,
  );

  /* -- nobody is lost to the tail ---------------------------------------- */
  for (const split of [a.adult, a.child]) {
    const sliced = split.slices.reduce((acc, s) => acc + s.people, 0);
    check(
      sliced === split.people,
      `the ${split.audience} column's rows add up to its own total, tail included`,
      `${sliced} of ${split.people}`,
    );
    check(
      split.slices.every((s) => s.share === null || Math.abs(s.share - s.people / split.people) < 1e-9),
      `…and every ${split.audience} share is that row over that column`,
    );
  }

  /* -- the tail is pooled, not dropped ------------------------------------ */
  const pooled = a.adult.slices.filter((s) => s.pooled);
  check(pooled.length === 1, "small channels are pooled into one row rather than printed");
  check(
    pooled[0].people === 1 && pooled[0].channels === 1,
    "the pooled row keeps its people and says how many channels it covers",
    `${pooled[0].people} people across ${pooled[0].channels}`,
  );
  check(
    !a.adult.slices.some((s) => !s.pooled && s.channel === "Meta"),
    "a channel under the threshold does not also get a row of its own",
  );

  /* -- one row order, or the comparison cannot be read across ------------- */
  const adultOrder = a.adult.slices.map((s) => s.channel).join(" > ");
  const childOrder = a.child.slices.map((s) => s.channel).join(" > ");
  check(
    adultOrder === childOrder,
    "both columns carry the same channels in the same order, so a row can be read across",
    `${adultOrder} vs ${childOrder}`,
  );
  check(
    adultOrder === "Reddit > TikTok > Google Search > Other channels",
    "ranked by the two audiences together, largest first, tail last",
    adultOrder,
  );

  /* -- paid and organic are one channel here, which they are not above ---- */
  const reddit = a.adult.slices.find((s) => s.channel === "Reddit");
  check(
    reddit.people === 88,
    "a channel running both sides is one row here, because this counts people rather than rates",
    String(reddit.people),
  );
  check(
    g.channels.filter((r) => r.channel === "Reddit").length === 2,
    "…while the table above still keeps its two sides apart",
  );

  /* -- the finding the panel exists for ----------------------------------- */
  const share = (split, channel) =>
    split.slices.find((s) => s.channel === channel).people / split.people;
  check(
    share(a.adult, "Reddit") > 0.7 && share(a.child, "TikTok") > 0.7,
    "the two biggest channels come out inverted, which is the whole reason for the panel",
    `Reddit ${(share(a.adult, "Reddit") * 100).toFixed(0)}% of adults, TikTok ${(share(a.child, "TikTok") * 100).toFixed(0)}% of children`,
  );
}

/* -- 11. a test the clock wrote is not a test somebody finished ----------- */
/*
  The defect this guards: the countdown auto-submits an abandoned attempt,
  which writes a row, fires `test_completed` and raises the email gate on a
  screen nobody is looking at. Counted as completions, those rows were added to
  the real finishers and divided into the address count, and the page reported
  that half of all finishers decline to give an email.

  Two properties have to hold together, and they pull in opposite directions:
  the abandonments must come OUT of the completion rate, and they must STAY ON
  the page as a funnel loss. Deleting them would trade one false story for
  another — they are real people who started the test and left.
*/
{
  const g = await run({}, { range: SPANNING_RANGE, nowMs: AFTER_OUTAGE });
  const f = g.funnel;
  const a = g.emails.accounting;

  /* -- nothing that was already on the page has moved -------------------- */
  check(
    f.completed === 375 && f.emailed === 178 && near(f.emailRate, 178 / 375),
    "the original completed figure and its rate are untouched, so phase two can show the before and after side by side",
    `${f.completed} completed, ${f.emailRate}`,
  );
  check(
    g.emails.finishedTests === 377 && g.emails.rowsWithEmail === 231,
    "and so are the warehouse row counts",
  );

  /* -- the split, and the arithmetic that has to close ------------------- */
  check(
    f.finished === 270 && f.abandonedOnly === 105,
    "the completion stage splits into people who finished and people the clock wrote off",
    `${f.finished} finished, ${f.abandonedOnly} abandoned`,
  );
  check(
    f.finished + f.abandonedOnly === f.completed,
    "…and the two add back to the stage they came from, so nobody is invented or lost",
  );
  check(
    a.all.finished + a.all.abandoned === g.emails.finishedTests,
    "the warehouse split also adds back to every row in the mirror",
    `${a.all.finished} + ${a.all.abandoned}`,
  );
  check(
    a.all.finishedWithEmail + a.all.abandonedWithEmail === g.emails.rowsWithEmail,
    "…and the two address counts add back to the rows carrying an address",
  );

  /* -- the abandonments are still people, and still on the page ---------- */
  check(
    a.all.abandoned === 97 && a.all.abandonedWithEmail === 26,
    "abandonments keep their own counts rather than being dropped from the report",
    `${a.all.abandoned} abandoned, ${a.all.abandonedWithEmail} of them gave an address anyway`,
  );
  check(
    near(a.all.abandonedEmailRate, 26 / 97),
    "…including their own conversion rate, because some of them come back to the gate",
  );

  /* -- the rule is on the payload, not hidden in a constant -------------- */
  check(
    a.rule.answeredShare === 0.9,
    "the threshold travels with the numbers, so the page can say what completed means",
    String(a.rule.answeredShare),
  );
  check(
    a.rule.timedOut === 130 && a.rule.sparse === 115 && a.rule.both === 97,
    "both component measures are carried, not just the one that was chosen",
    `${a.rule.timedOut} timed out, ${a.rule.sparse} sparse, ${a.rule.both} both`,
  );
  check(
    a.rule.both === a.all.abandoned,
    "an abandonment is the CONJUNCTION: the clock ended it AND they had not worked the paper",
  );
  check(
    a.rule.timedOutOnly === 33 && a.rule.sparseOnly === 18,
    "…and the rows where the two measures disagree are counted, so the page can show where the cut is arguable",
    `${a.rule.timedOutOnly} beaten by the clock at the end, ${a.rule.sparseOnly} submitted deliberately short`,
  );
  check(
    a.rule.timedOutOnly > 0,
    "somebody who answered nearly everything and ran out of time is a finisher, which is what the Funnel tab already tells the reader",
  );

  /* -- the 9 August outage, corrected and declared ----------------------- */
  check(
    a.outage.overlaps === true && a.outage.finished === 30 && a.outage.finishedWithEmail === 1,
    "the outage window is reported with its counts rather than silently excluded",
    `${a.outage.finished} finished, ${a.outage.finishedWithEmail} recorded an address`,
  );
  check(
    a.outage.from === "2026-08-09T17:47:00Z" && a.outage.to === "2026-08-10T00:16:00Z",
    "…and it names the hours, so a reader can check the correction rather than trust it",
  );
  check(
    a.corrected.finished === 250 && a.all.finished - a.corrected.finished === a.outage.finished,
    "the corrected figure is the raw one minus exactly the held-out window",
    `${a.all.finished} − ${a.outage.finished} = ${a.corrected.finished}`,
  );
  check(
    a.corrected.finishedEmailRate > a.all.finishedEmailRate,
    "holding out six hours of total delivery failure raises the rate, because the failure was ours and not a refusal",
    `${(a.all.finishedEmailRate * 100).toFixed(1)}% → ${(a.corrected.finishedEmailRate * 100).toFixed(1)}%`,
  );

  /*
    A window that does not reach the outage must say so, or the panel would
    print a correction note over a range the outage never touched — which is
    its own kind of lie, and the more embarrassing one.
  */
  const narrow = await run({}, { range: RANGE });
  check(
    narrow.emails.accounting.outage.overlaps === false,
    "a window ending before the outage reports no overlap, so the note stays off the page",
  );

  /*
    No output alias may reuse a source column name.

    HogQL resolves a later select item against an earlier OUTPUT alias, so
    `countIf(...) AS timed_out` turns every subsequent mention of `timed_out`
    into that aggregate, and the query dies with "aggregate function is found
    inside another aggregate function" — an error naming neither the column
    nor the shadowing. It cost this file a 400 on the live panel during the
    change that added these columns, and the funnel query had already been
    bitten by the identical trap before that. A fixture cannot catch it; the
    shape of the emitted SQL can.
  */
  const warehouseSql = sent.find((r) => r.sql.includes("FROM test_results"))?.sql ?? "";
  const columns = [
    "timed_out",
    "answered",
    "max_score",
    "completed_at",
    "test_type",
    "email",
    "platform",
    "grade_band",
    "score",
    "duration_secs",
  ];
  const shadowed = columns.filter((name) => new RegExp(`AS\\s+${name}\\b`).test(warehouseSql));
  check(
    shadowed.length === 0,
    "no warehouse output alias shadows the column it is computed from",
    shadowed.join(", "),
  );

  /*
    The headline, end to end. The old reading divides every row by every
    address; the new one divides finished tests by the addresses they earned,
    outside the outage. The gap between them is the defect.
  */
  const before = g.emails.rowsWithEmail / g.emails.finishedTests;
  check(
    near(a.corrected.finishedEmailRate, 204 / 250) && before < 0.62,
    "the completed-to-email rate stops being a blend of finishers, abandoners and a broken mailer",
    `${(before * 100).toFixed(1)}% → ${(a.corrected.finishedEmailRate * 100).toFixed(1)}%`,
  );

  /* -- the events funnel carries its own correction ---------------------- */
  check(
    f.outageLostConversions === 22 && f.finishedEmailedCorrected === 168,
    "the funnel recovers the people who typed in an address while the sends were failing",
    `${f.outageLostConversions} recovered`,
  );
  check(
    f.finishedEmailRateCorrected > f.finishedEmailRate &&
      f.finishedEmailRateCorrected > f.emailRate,
    "…so the finisher rate beats both the uncorrected one and the old blended one",
    `${(f.emailRate * 100).toFixed(1)}% old, ${(f.finishedEmailRateCorrected * 100).toFixed(1)}% corrected`,
  );

  /* -- the ripple: every panel moves together ---------------------------- */
  const sum = (key) => g.channels.reduce((acc, row) => acc + row[key], 0);
  check(
    sum("finished") === f.finished && sum("abandonedOnly") === f.abandonedOnly,
    "the channel table's split adds up to the funnel's, the same way its completed column already does",
    `${sum("finished")} vs ${f.finished}`,
  );
  check(
    g.sides.reduce((acc, s) => acc + s.finished, 0) === f.finished,
    "…and so does paid against organic",
  );
  for (const row of g.channels) {
    check(
      row.finishedAdult + row.finishedChild - row.finishedBoth + row.finishedAudienceUnknown ===
        row.emailed,
      `${row.channel} ${row.paid ? "paid" : "organic"}: the finished audience split still decomposes Emailed exactly`,
      `${row.finishedAdult} + ${row.finishedChild} − ${row.finishedBoth} + ${row.finishedAudienceUnknown} ≠ ${row.emailed}`,
    );
    check(
      row.finished <= row.completed,
      `${row.channel} ${row.paid ? "paid" : "organic"}: finishers never outnumber completers`,
    );
  }
}

/* -- 12. the audience panel splits too, and costs no extra query ---------- */
{
  const g = await run();
  const any = g.audiences;
  const fin = g.audiencesFinished;

  const events = sent.filter((r) => !r.sql.includes("test_results") && !r.sql.includes("system."));
  check(
    events.length === 2,
    "the second audience panel is the same rows regrouped again, not a third query",
    `${events.length} events queries`,
  );

  check(
    any.adult.people === 121 && fin.adult.people === 117,
    "the finished-only column is smaller, because some emailed people never finished the test they are otherwise credited with",
    `${any.adult.people} → ${fin.adult.people}`,
  );
  check(
    fin.emailed === any.emailed,
    "both panels describe the same emailed population, so the two are comparable",
  );
  check(
    fin.neither > any.neither,
    "the people who left the test and gave an address anyway land in the residual rather than in an audience",
    `${any.neither} → ${fin.neither}`,
  );
  check(
    fin.adult.people + fin.child.people - fin.both + fin.neither === fin.emailed,
    "…and the identity still closes, so nobody was reallocated to make it tidy",
    `${fin.adult.people} + ${fin.child.people} − ${fin.both} + ${fin.neither} ≠ ${fin.emailed}`,
  );

  for (const split of [fin.adult, fin.child]) {
    const sliced = split.slices.reduce((acc, s) => acc + s.people, 0);
    check(
      sliced === split.people,
      `the finished ${split.audience} column's rows add up to its own total, tail included`,
      `${sliced} of ${split.people}`,
    );
  }
  check(
    fin.adult.slices.map((s) => s.channel).join(" > ") ===
      fin.child.slices.map((s) => s.channel).join(" > "),
    "both finished columns keep one shared order, so a row can still be read across",
  );
}

console.log(
  failures === 0
    ? `\nverify-growth: OK. Four stages of people over one population, finished tests kept distinct from them and from the ones the clock wrote, the 9 August outage held out and declared, Reddit split in two, the audience split reconciling per row on both bases and regrouped without a second query, and neither clock lies.`
    : `\nverify-growth: ${failures} failure(s).`,
);
if (failures > 0) process.exit(1);
