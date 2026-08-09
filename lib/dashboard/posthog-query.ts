import "server-only";

/**
 * The one place that talks to PostHog's Query API.
 *
 * ===========================================================================
 * THE KEY
 * ===========================================================================
 * `POSTHOG_PERSONAL_API_KEY` is a `phx_` personal API key SCOPED TO `query:read`
 * on project 524578 and nothing else — verified at creation: the Query API
 * answers 200, while `/persons/`, `/feature_flags/` and `/personal_api_keys/`
 * all answer 403. It has no `NEXT_PUBLIC_` prefix, this module is `server-only`,
 * and it is read inside a function rather than at module scope, so it cannot be
 * inlined into a bundle. It reaches the browser through no path.
 *
 * It is NOT the `phc_` project key the site already ships. That one is
 * publishable and write-only: it can send events and cannot read a thing.
 *
 * ===========================================================================
 * WHY CALLERS CANNOT PASS SQL
 * ===========================================================================
 * Every query in this dashboard is a named function in ./queries.ts that builds
 * its own HogQL from a narrow, validated input. The HTTP layer accepts a
 * section name and a time range, never a query string. An endpoint that
 * forwarded arbitrary HogQL would be an authenticated read of the whole
 * project's data — including every other table the key can see — behind one
 * shared passphrase, and the passphrase is the weakest link in the system.
 */

const HOST = "https://us.posthog.com";
const PROJECT_ID = 524578;

/**
 * The window and the internal-filter switch, passed to every query.
 *
 * `filtered` does NOT expand into hand-written SQL. It is forwarded to PostHog
 * as `filterTestAccounts`, and PostHog substitutes the project's own
 * `test_account_filters` into the `{filters}` placeholder. See the note on
 * `hogql` for why that distinction turned out to matter a great deal.
 */
export interface QueryScope {
  from: string;
  to: string;
  filtered: boolean;
}

/**
 * The status is assigned in the body rather than declared as a constructor
 * parameter property. Same class, but parameter properties are the one piece of
 * TypeScript that Node's strip-only type removal refuses outright, and the
 * verify scripts load this module through exactly that path — see
 * scripts/ts-resolve-hook.mjs.
 */
export class PostHogQueryError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PostHogQueryError";
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!key) {
    throw new PostHogQueryError(
      "POSTHOG_PERSONAL_API_KEY is not configured; the dashboard cannot query PostHog.",
      503,
    );
  }
  return key;
}

export function isQueryKeyConfigured(): boolean {
  return Boolean(process.env.POSTHOG_PERSONAL_API_KEY?.trim());
}

/* --------------------------------------------------------------------------
 * Concurrency and retries
 *
 * A dashboard load asks thirteen questions at once, and PostHog answers several
 * of them with "Queries are a little too busy right now" (503) or a 429. That
 * is not a bug in the queries — it is a shared query cluster telling us to form
 * an orderly line, and the correct response is to form one rather than to fan
 * out harder.
 *
 * Three at a time, with a short backoff on the two "come back later" statuses.
 * Three is comfortably under the limit while still overlapping the round trips,
 * and the whole page lands in a couple of seconds at this data volume.
 * ------------------------------------------------------------------------ */

const MAX_CONCURRENT = 3;
let active = 0;
const waiting: (() => void)[] = [];

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active += 1;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  active += 1;
}

function release(): void {
  active -= 1;
  waiting.shift()?.();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run one HogQL statement and hand back its rows as objects.
 *
 * ===========================================================================
 * WHY `{filters}` AND NOT HAND-WRITTEN EXCLUSION CLAUSES
 * ===========================================================================
 * This used to expand the project's internal-user rules into SQL by hand, from
 * a copy of the id list read out of project settings. It under-filtered, and
 * the dashboard reported 55 visitors where PostHog reported 41.
 *
 * The list had grown from 15 ids to 21 without the copy knowing, which is the
 * predictable failure of keeping a second copy of somebody else's
 * configuration. There are five separate mechanisms in that setting and they
 * are not interchangeable — two id lists that reach different event sources,
 * two cohorts, and an `is_internal` event-property rule that is the only thing
 * catching one identity and the only one that survives a distinct_id reset.
 * Reimplementing five interacting mechanisms correctly, forever, was never
 * going to happen.
 *
 * So we do not. `{filters}` in the query text is substituted by PostHog with
 * the project's `test_account_filters`, whatever they currently are. It cannot
 * drift, it needs no sync, and it is retroactive to changes made after this
 * code was written. Every query that touches `events` must include the
 * placeholder somewhere in its WHERE clause.
 *
 * PostHog answers with `results` (arrays) plus `columns` (names); zipping them
 * here means callers read `row.visitors` instead of `row[3]`, and a column
 * added to a SELECT cannot silently shift every downstream index.
 */
export async function hogql<T = Record<string, unknown>>(
  query: string,
  scope?: QueryScope,
): Promise<T[]> {
  return (await hogqlWithMeta<T>(query, scope)).rows;
}

/**
 * What PostHog said about the answer, alongside the answer.
 *
 * `computedAt` is PostHog's `last_refresh`: the moment the rows were actually
 * calculated, which is NOT the moment they were asked for.
 */
export interface HogqlAnswer<T> {
  rows: T[];
  /** ISO-8601, or null when PostHog did not say. */
  computedAt: string | null;
  cached: boolean;
}

/**
 * The same statement, plus the age of the answer — and the ability to refuse a
 * cached one.
 *
 * ===========================================================================
 * WHY ANYTHING WOULD EVER PASS `refresh`
 * ===========================================================================
 * PostHog serves most of these out of its own result cache, which is a good
 * deal everywhere on this page except in one place: the query that reports HOW
 * STALE THE DATA IS. Measured on this project, the warehouse-freshness
 * statement came back `is_cached: true` with a six-hour target age. A cached
 * "last refreshed at 06:37" would keep reading 06:37 long after the mirror had
 * either moved on or died, which is the exact failure this dashboard exists to
 * make impossible — an old number wearing a current number's clothes.
 *
 * So the freshness query, and only the freshness query, asks for
 * `force_blocking`. It is one row off a Postgres-backed system table, so
 * bypassing the cache costs nothing worth counting.
 */
export async function hogqlWithMeta<T = Record<string, unknown>>(
  query: string,
  scope?: QueryScope,
  options?: { refresh?: "blocking" | "force_blocking" },
): Promise<HogqlAnswer<T>> {
  const body: Record<string, unknown> = { kind: "HogQLQuery", query };
  if (scope) {
    body.filters = {
      filterTestAccounts: scope.filtered,
      dateRange: { date_from: hogDate(scope.from), date_to: hogDate(scope.to) },
    };
  }
  return withRetry(() => post<T>({ query: body, refresh: options?.refresh }));
}

/**
 * PostHog's own web-analytics overview: visitors, views, sessions, session
 * duration and bounce rate, in ONE request.
 *
 * Five tiles used to be five queries — three of them separately re-deriving the
 * clean session set — which is most of the reason the page collected 429s. More
 * importantly, these are now PostHog's definitions rather than a reimplementation
 * of them, so the tiles agree with PostHog's web analytics by construction
 * instead of by coincidence.
 */
export interface WebOverview {
  visitors: number | null;
  views: number | null;
  sessions: number | null;
  sessionDurationSeconds: number | null;
  bounceRate: number | null;
}

export async function webOverview(scope: QueryScope): Promise<WebOverview> {
  const { rows } = await withRetry(() =>
    post<{ key?: string; value?: number }>({
      query: {
        kind: "WebOverviewQuery",
        properties: [],
        dateRange: { date_from: hogDate(scope.from), date_to: hogDate(scope.to) },
        filterTestAccounts: scope.filtered,
      },
      raw: true,
    }),
  );
  const pick = (key: string): number | null => {
    const row = rows.find((r) => r.key === key);
    return row && typeof row.value === "number" ? row.value : null;
  };
  return {
    visitors: pick("visitors"),
    views: pick("views"),
    sessions: pick("sessions"),
    sessionDurationSeconds: pick("session duration"),
    // PostHog reports this as a percentage; everything else here is a fraction.
    bounceRate: pick("bounce rate") === null ? null : (pick("bounce rate") as number) / 100,
  };
}

/** ISO-8601 without the milliseconds, which the query API prefers. */
function hogDate(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, "Z").replace("Z", "");
}

async function withRetry<R>(run: () => Promise<R>): Promise<R> {
  await acquire();
  try {
    let lastError: PostHogQueryError | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await run();
      } catch (error) {
        if (!(error instanceof PostHogQueryError)) throw error;
        // 429 and 503 both mean "the cluster is busy", not "your query is
        // wrong". Anything else is ours to fix and retrying only hides it.
        if (error.status !== 429 && error.status !== 503) throw error;
        lastError = error;
        await sleep(700 * 2 ** attempt);
      }
    }
    throw lastError ?? new PostHogQueryError("PostHog query failed", 502);
  } finally {
    release();
  }
}

async function post<T>({
  query,
  raw,
  refresh,
}: {
  query: Record<string, unknown>;
  raw?: boolean;
  refresh?: string;
}): Promise<HogqlAnswer<T>> {
  const res = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    // `refresh` is a sibling of `query`, not a member of it — PostHog ignores
    // it silently in the wrong position, which reads exactly like a cache that
    // will not turn off.
    body: JSON.stringify(refresh ? { query, refresh } : { query }),
    // Analytics is read-only and this data changes by the minute at most; the
    // route sets its own caching policy, so never let fetch memoize for us.
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 500);
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      if (parsed.detail) detail = parsed.detail;
    } catch {
      // keep the raw body
    }
    throw new PostHogQueryError(`PostHog query failed (${res.status}): ${detail}`, res.status);
  }

  const body = JSON.parse(text) as {
    results?: unknown[];
    columns?: string[];
    last_refresh?: string;
    is_cached?: boolean;
  };
  const rows = body.results ?? [];
  const meta = {
    computedAt: typeof body.last_refresh === "string" ? body.last_refresh : null,
    cached: body.is_cached === true,
  };

  // HogQLQuery answers with rows-as-arrays plus a `columns` list; the typed
  // query kinds (WebOverviewQuery and friends) answer with rows-as-objects and
  // no columns at all. Zipping the second kind against an empty column list
  // silently produced empty objects, which is how five traffic tiles read zero
  // while the query itself succeeded.
  if (raw || !body.columns) return { rows: rows as T[], ...meta };

  const columns = body.columns;
  return {
    rows: (rows as unknown[][]).map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((name, i) => {
        obj[name] = row[i];
      });
      return obj as T;
    }),
    ...meta,
  };
}

/**
 * Escape a value for inline use in HogQL.
 *
 * The Query API takes `values` for placeholders, but this dashboard only ever
 * interpolates values it produced itself (resolved ISO timestamps, a person
 * UUID it just read back from PostHog, an enum). Escaping at the seam keeps
 * that true even if a future caller is careless: a quote or backslash can never
 * close the literal.
 */
export function sqlString(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

/** A UUID, or null if it is not one. Used to bound person-scoped lookups. */
export function asUuid(value: unknown): string | null {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}
