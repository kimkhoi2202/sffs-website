/**
 * The dashboard's time range vocabulary — the same shape PostHog's own date
 * filter offers, so a number here can be reconciled against a number there
 * without translating between two different ideas of "last week".
 *
 * ===========================================================================
 * WHY EVERYTHING RESOLVES IN UTC
 * ===========================================================================
 * The PostHog project's timezone is UTC (project 524578, `timezone: "UTC"`),
 * and PostHog resolves "today" and "this month" in the PROJECT's timezone, not
 * the viewer's. Resolving in the viewer's local zone would mean this dashboard
 * and PostHog's UI disagreed about which events fall in "today" by up to six
 * hours, which is the kind of discrepancy that gets a dashboard distrusted and
 * then abandoned. So we do what PostHog does, and label it in the UI.
 *
 * ===========================================================================
 * WHY THE SERVER RESOLVES, NOT THE CLIENT
 * ===========================================================================
 * The client sends a preset id (plus a date or two for the custom modes) and
 * the server turns it into an absolute window. One clock, one source of truth,
 * and — the part that matters — the API never accepts a caller-supplied
 * timestamp it has not bounded itself.
 */

export type RangePresetId =
  | "today"
  | "yesterday"
  | "last_hour"
  | "last_24_hours"
  | "last_7_days"
  | "last_14_days"
  | "last_28_days"
  | "last_30_days"
  | "last_90_days"
  | "last_180_days"
  | "last_week"
  | "last_month"
  | "this_week"
  | "this_month"
  | "this_year"
  | "all_time"
  /** "In the last N days" — the stepper. `days` carries N. */
  | "last_n_days"
  /** From a chosen date until right now. `from` carries the date. */
  | "since_date"
  /** A fixed window. `from` and `to` carry the ends, both inclusive days. */
  | "custom";

export interface TimeRangeInput {
  preset: RangePresetId;
  /** For `last_n_days`. */
  days?: number;
  /** `YYYY-MM-DD` for `since_date` and `custom`. */
  from?: string;
  /** `YYYY-MM-DD` for `custom`. */
  to?: string;
}

export interface ResolvedRange {
  /** Inclusive lower bound, ISO-8601 in UTC. */
  from: string;
  /** Exclusive upper bound, ISO-8601 in UTC. */
  to: string;
  /** What to print above the tiles. */
  label: string;
  /** Bucket width the trend series should use. */
  granularity: "hour" | "day" | "week";
}

/** The picker's menu, in the order it is rendered. */
export const RANGE_PRESETS: { id: RangePresetId; label: string; group: string }[] = [
  { id: "today", label: "Today", group: "Recent" },
  { id: "yesterday", label: "Yesterday", group: "Recent" },
  { id: "last_hour", label: "Last hour", group: "Recent" },
  { id: "last_24_hours", label: "Last 24 hours", group: "Recent" },
  { id: "last_7_days", label: "Last 7 days", group: "Rolling" },
  { id: "last_14_days", label: "Last 14 days", group: "Rolling" },
  { id: "last_28_days", label: "Last 28 days", group: "Rolling" },
  { id: "last_30_days", label: "Last 30 days", group: "Rolling" },
  { id: "last_90_days", label: "Last 90 days", group: "Rolling" },
  { id: "last_180_days", label: "Last 180 days", group: "Rolling" },
  { id: "last_week", label: "Last week", group: "Calendar" },
  { id: "last_month", label: "Last month", group: "Calendar" },
  { id: "this_week", label: "This week", group: "Calendar" },
  { id: "this_month", label: "This month", group: "Calendar" },
  { id: "this_year", label: "This year", group: "Calendar" },
  { id: "all_time", label: "All time", group: "Calendar" },
];

/**
 * Nothing was captured before the project existed, so "all time" starts here
 * rather than at the epoch. Keeping the floor tight is not cosmetic: it is what
 * stops an unbounded `timestamp` predicate reaching ClickHouse.
 */
export const PROJECT_EPOCH = "2026-07-22T00:00:00Z";

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const iso = (ms: number): string => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

/** Midnight UTC at the start of the day containing `ms`. */
const startOfDay = (ms: number): number => Math.floor(ms / DAY) * DAY;

/**
 * Monday-start week, matching `toStartOfWeek(timestamp, 1)` in the HogQL we
 * write elsewhere. 1970-01-01 was a Thursday, hence the four-day shift.
 */
function startOfWeek(ms: number): number {
  const day = startOfDay(ms);
  const dow = new Date(day).getUTCDay(); // 0 = Sunday
  const back = (dow + 6) % 7; // Monday = 0
  return day - back * DAY;
}

function startOfMonth(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

function startOfYear(ms: number): number {
  return Date.UTC(new Date(ms).getUTCFullYear(), 0, 1);
}

function granularityFor(spanMs: number): ResolvedRange["granularity"] {
  if (spanMs <= 2 * DAY) return "hour";
  if (spanMs <= 70 * DAY) return "day";
  return "week";
}

/** `YYYY-MM-DD` -> midnight UTC. Returns null for anything else. */
function parseDay(value: string | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : null;
}

const prettyDay = (ms: number): string =>
  new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * Turn a preset into an absolute window.
 *
 * Every branch clamps: `to` never runs past now, `from` never runs before the
 * project epoch, and N in the stepper is bounded. An unbounded or inverted
 * window would be a full-history table scan dressed up as a date filter.
 */
/**
 * "Now", rounded down to the nearest half minute.
 *
 * Without this every request produces a window ending at a unique millisecond,
 * which makes every generated HogQL statement unique, which means PostHog's own
 * result cache never hits and neither does ours. Each dashboard load then
 * re-scans from scratch and takes a dozen seconds.
 *
 * Rounding costs at most thirty seconds of staleness on a rolling window, which
 * is nothing at any traffic volume and less than nothing at this one.
 */
const CLOCK_QUANTUM_MS = 30_000;

export function resolveRange(input: TimeRangeInput, nowMs: number = Date.now()): ResolvedRange {
  const now = Math.floor(nowMs / CLOCK_QUANTUM_MS) * CLOCK_QUANTUM_MS;
  const epoch = Date.parse(PROJECT_EPOCH);
  const today = startOfDay(now);

  let from: number;
  let to: number;
  let label: string;

  switch (input.preset) {
    case "today":
      from = today;
      to = now;
      label = "Today";
      break;
    case "yesterday":
      from = today - DAY;
      to = today;
      label = "Yesterday";
      break;
    case "last_hour":
      from = now - HOUR;
      to = now;
      label = "Last hour";
      break;
    case "last_24_hours":
      from = now - DAY;
      to = now;
      label = "Last 24 hours";
      break;
    /*
      DAY-ALIGNED, NOT A ROLLING WINDOW OF HOURS — because that is what PostHog
      means by "last 7 days" and matching it is the entire point.

      Measured against the same project on the same afternoon: PostHog's `-7d`
      reports 41 visitors, and so does an explicit window starting at midnight
      seven days back. A rolling 168 hours from the current minute reports 39,
      because it silently drops everyone who visited earlier in the day seven
      days ago. Two of the two-visitor gap were real people.

      The hour-scale presets below stay genuinely rolling, which is also what
      PostHog does with `-24h`.
    */
    case "last_7_days":
    case "last_14_days":
    case "last_28_days":
    case "last_30_days":
    case "last_90_days":
    case "last_180_days": {
      const n = Number(input.preset.split("_")[1]);
      from = startOfDay(now - n * DAY);
      to = now;
      label = `Last ${n} days`;
      break;
    }
    case "last_week": {
      const thisWeek = startOfWeek(now);
      from = thisWeek - 7 * DAY;
      to = thisWeek;
      label = "Last week";
      break;
    }
    case "last_month": {
      const thisMonth = startOfMonth(now);
      const d = new Date(thisMonth);
      from = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1);
      to = thisMonth;
      label = "Last month";
      break;
    }
    case "this_week":
      from = startOfWeek(now);
      to = now;
      label = "This week";
      break;
    case "this_month":
      from = startOfMonth(now);
      to = now;
      label = "This month";
      break;
    case "this_year":
      from = startOfYear(now);
      to = now;
      label = "This year";
      break;
    case "all_time":
      from = epoch;
      to = now;
      label = "All time";
      break;
    case "last_n_days": {
      const n = Math.min(730, Math.max(1, Math.round(Number(input.days) || 7)));
      // Day-aligned, for the same reason as the fixed presets above.
      from = startOfDay(now - n * DAY);
      to = now;
      label = `Last ${n} day${n === 1 ? "" : "s"}`;
      break;
    }
    case "since_date": {
      const start = parseDay(input.from);
      from = start ?? today;
      to = now;
      label = `${prettyDay(from)} until now`;
      break;
    }
    case "custom": {
      const start = parseDay(input.from);
      const end = parseDay(input.to);
      from = start ?? today;
      // `to` is an inclusive day in the UI, so the exclusive bound is the next
      // midnight. Without this, picking the same day twice yields an empty
      // window and the dashboard reads zero for a day that had traffic.
      to = end !== null ? end + DAY : from + DAY;
      label = `${prettyDay(from)} – ${prettyDay(Math.max(from, to - DAY))}`;
      break;
    }
    default:
      from = now - 7 * DAY;
      to = now;
      label = "Last 7 days";
  }

  from = Math.max(epoch, Math.min(from, now));
  to = Math.min(now, Math.max(to, from + 1));

  return { from: iso(from), to: iso(to), label, granularity: granularityFor(to - from) };
}

/** Narrow untrusted JSON into a `TimeRangeInput`. */
export function parseRangeInput(raw: unknown): TimeRangeInput {
  const value = (raw ?? {}) as Record<string, unknown>;
  const preset = String(value.preset ?? "last_7_days") as RangePresetId;
  const known =
    RANGE_PRESETS.some((p) => p.id === preset) ||
    preset === "last_n_days" ||
    preset === "since_date" ||
    preset === "custom";
  return {
    preset: known ? preset : "last_7_days",
    days: typeof value.days === "number" ? value.days : undefined,
    from: typeof value.from === "string" ? value.from : undefined,
    to: typeof value.to === "string" ? value.to : undefined,
  };
}
