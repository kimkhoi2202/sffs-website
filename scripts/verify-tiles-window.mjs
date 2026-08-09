/**
 * Prove that the tiles ask PostHog for the window the reader chose.
 *
 *   npm run verify:tiles-window
 *
 * ===========================================================================
 * WHY THIS EXISTS
 * ===========================================================================
 * `WebOverviewQuery` discards the time of day on `date_to` and includes the
 * whole of that date. `ResolvedRange.to` is an EXCLUSIVE bound, so every preset
 * ending on a day boundary was handing over a midnight that PostHog read as
 * "and all of the following day too". A custom range of 3–7 August reported
 * 5,066 visitors against a true 366 — the four most prominent tiles on the page
 * overstating fourteen-fold on a range somebody had deliberately picked.
 *
 * The fix is a second subtracted at one call site. It is invisible in every
 * response, silent when it regresses, and would be undone by anyone who
 * "tidied" the duplicated date formatting — so it is pinned here instead of
 * trusted to survive.
 *
 * ===========================================================================
 * THE SECOND ASSERTION IS THE ONE THAT MATTERS
 * ===========================================================================
 * The tempting fix was to shift `hogDate`, which both query kinds share. That
 * would have moved every HogQL window on the dashboard by a second to work
 * around a defect in a query kind that does not use it, and would have broken
 * the agreement between the funnel and the tiles. So this checks BOTH
 * directions: the WebOverview bound moved, and the HogQL bound did not.
 *
 * Nothing reaches PostHog. `fetch` is stubbed and the outgoing requests are the
 * evidence.
 */
import { registerHooks } from "node:module";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

process.env.POSTHOG_PERSONAL_API_KEY = "phx_stub_key_not_a_real_credential";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export{}", shortCircuit: true };
    }
    return next(specifier, context);
  },
});

/* == the network, which is a recorder ==================================== */

let sent = [];

globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  const kind = body.query?.kind;
  sent.push({ kind, dateRange: body.query?.dateRange, filters: body.query?.filters });

  if (kind === "WebOverviewQuery") {
    // Rows-as-objects with no `columns`, which is how the typed query kinds answer.
    return new Response(
      JSON.stringify({
        results: [
          { key: "visitors", value: 1 },
          { key: "views", value: 2 },
          { key: "sessions", value: 3 },
          { key: "session duration", value: 4 },
          { key: "bounce rate", value: 50 },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({
      columns: ["signups", "tests_started", "tests_completed", "results_opened"],
      results: [[1, 2, 3, 4]],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

/* == the code under test ================================================= */

const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { fetchTiles } = await load("lib/dashboard/queries.ts");
const { resolveRange } = await load("lib/dashboard/time-range.ts");

/** How the module formats a bound for the query API. */
const hogDate = (iso) => iso.replace(/\.\d{3}Z$/, "Z").replace("Z", "");
/** A bare `YYYY-MM-DDTHH:MM:SS` is UTC here; say so before parsing it. */
const asUtc = (s) => Date.parse(`${s}Z`);

const NOW = Date.parse("2026-08-09T07:44:00Z");

async function askFor(input) {
  sent = [];
  const range = resolveRange(input, NOW);
  await fetchTiles(range, true);
  const web = sent.find((r) => r.kind === "WebOverviewQuery");
  const hog = sent.find((r) => r.kind === "HogQLQuery");
  return { range, web, hog };
}

/* == the cases =========================================================== */

let failures = 0;

function check(ok, label, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

/**
 * Every preset the picker offers, plus the three parameterised modes.
 * `endsAtMidnight` is the property that made the bug visible, not a preset name,
 * so it is derived rather than listed — a new preset that ends on a day
 * boundary is covered the moment somebody adds it here.
 */
const INPUTS = [
  { preset: "since_launch" },
  { preset: "today" },
  { preset: "yesterday" },
  { preset: "last_hour" },
  { preset: "last_24_hours" },
  { preset: "last_7_days" },
  { preset: "last_28_days" },
  { preset: "last_week" },
  { preset: "last_month" },
  { preset: "this_week" },
  { preset: "this_month" },
  { preset: "this_year" },
  { preset: "all_time" },
  { preset: "last_n_days", days: 3 },
  { preset: "since_date", from: "2026-08-05" },
  { preset: "custom", from: "2026-08-03", to: "2026-08-07" },
];

let midnightPresets = 0;

for (const input of INPUTS) {
  const { range, web, hog } = await askFor(input);
  const label = input.preset + (input.days ? `(${input.days})` : "");
  const webTo = asUtc(web.dateRange.date_to);
  const endsAtMidnight = /T00:00:00$/.test(hogDate(range.to));
  if (endsAtMidnight) midnightPresets += 1;

  /* -- 1. the tiles never reach past the window -------------------------- */
  check(
    webTo < Date.parse(range.to),
    `${label}: the tiles' end is inside the window, not on its exclusive bound`,
    `sent ${web.dateRange.date_to}, window ends ${range.to}`,
  );
  check(
    webTo >= Date.parse(range.from),
    `${label}: …and never before the window starts`,
    `sent ${web.dateRange.date_to}, window starts ${range.from}`,
  );

  /* -- 2. and the day it truncates to is the right one -------------------- */
  // WebOverviewQuery keeps only the date part, so THAT is what must be correct.
  const truncatedDay = web.dateRange.date_to.slice(0, 10);
  const lastDayInWindow = new Date(Date.parse(range.to) - 1000).toISOString().slice(0, 10);
  check(
    truncatedDay === lastDayInWindow,
    `${label}: the date PostHog will truncate to is the last day in the window`,
    `${truncatedDay} vs ${lastDayInWindow}`,
  );

  /* -- 3. the HogQL bound is untouched ------------------------------------ */
  check(
    hog.filters.dateRange.date_to === hogDate(range.to),
    `${label}: the HogQL window still ends on the exclusive bound`,
    `${hog.filters.dateRange.date_to} vs ${hogDate(range.to)}`,
  );
  check(
    hog.filters.dateRange.date_from === web.dateRange.date_from,
    `${label}: both queries start at the same instant`,
  );
}

/* -- 4. the presets that carried the bug are actually in the set --------- */
check(
  midnightPresets >= 4,
  "the day-boundary presets are covered, which is where the bug lived",
  `${midnightPresets} of ${INPUTS.length} end at midnight`,
);

/* -- 5. the regression, stated as the number that was wrong -------------- */
{
  const { web } = await askFor({ preset: "custom", from: "2026-08-03", to: "2026-08-07" });
  check(
    web.dateRange.date_to === "2026-08-07T23:59:59",
    "a custom range ending 7 August asks PostHog for 7 August, not 8 August",
    web.dateRange.date_to,
  );
}

/* -- 6. a degenerate window does not invert ------------------------------ */
{
  // `from` in the future is clamped forward to now, leaving `to` a millisecond
  // later; subtracting a second from that would run the range backwards.
  sent = [];
  const range = resolveRange({ preset: "since_date", from: "2099-01-01" }, NOW);
  await fetchTiles(range, true);
  const web = sent.find((r) => r.kind === "WebOverviewQuery");
  check(
    asUtc(web.dateRange.date_to) >= Date.parse(range.from),
    "a one-millisecond window is not turned inside out",
    `${web.dateRange.date_from} -> ${web.dateRange.date_to}`,
  );
}

console.log(
  failures === 0
    ? `\nverify-tiles-window: OK. ${INPUTS.length} presets, the tiles stay inside the window and HogQL is untouched.`
    : `\nverify-tiles-window: ${failures} failure(s).`,
);
if (failures > 0) process.exit(1);
