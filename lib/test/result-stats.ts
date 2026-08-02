import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { EMAIL_SOURCES } from "../email-sources";
import { emailStoreMode } from "../email-store-mode";
import type { Audience, Grade, GradeBand } from "./types";

/**
 * The durable record of a finished attempt, kept so a per-grade-band percentile
 * becomes possible later.
 *
 * ===========================================================================
 * THIS IS A SEPARATE THING FROM THE RESULTS LINK, ON PURPOSE
 * ===========================================================================
 * The link is stateless and carries its own result (see ./result-token.ts).
 * That fixes the emailed link but stores nothing, and "how did this score
 * compare to other grade 5s" needs rows that outlive the request.
 *
 * These are the rows. They are written once, never read back by the app, and
 * never updated. Nothing in the user-facing flow depends on this succeeding, so
 * a failure here is logged and swallowed rather than surfaced: losing a
 * statistic is not worth failing a request the visitor cannot retry.
 *
 * ===========================================================================
 * NO EMAIL ADDRESS. NOT OPTIONALLY, NOT IN A META FIELD.
 * ===========================================================================
 * The privacy page states that the address and the result are never stored
 * together, so the separation has to be real rather than a convention. A row
 * here is a test id, a band, a grade, a score and a timestamp. There is no
 * column for an address, this module is never handed one, and the function
 * signature below has nowhere to put one.
 *
 * The consequence is deliberate: these rows can never be joined back to a
 * person, which also means they can only ever answer aggregate questions. That
 * is the only question they exist to answer.
 *
 * ===========================================================================
 * THE ENDPOINT
 * ===========================================================================
 * The same Lambda, URL and shared secret as the signup path, discriminated by
 * `kind: "result"`. It writes a table with NO EMAIL COLUMN, which is what makes
 * the separation above structural: there is nowhere to put an address even if
 * some future caller tried to pass one.
 *
 * `RESULTS_STATS_URL` overrides the endpoint if the two ever need to diverge;
 * absent, this uses EMAIL_PROXY_URL, so there are no second credentials to
 * manage and nothing to forget to set.
 *
 * The Lambda validates rather than trusting us — a score above its max, a score
 * above 200, a grade outside 3 to 8 and an unknown test type are all rejected —
 * so a bug on this side becomes a 4xx in the log instead of a nonsense row.
 */

export interface ResultStatsRow {
  /** Which bank, e.g. "adult" or "grade-5". */
  testId: string;
  audience: Audience;
  band: GradeBand;
  /** The grade they said they were in, where that is narrower than the band. */
  grade: Grade | null;
  score: number;
  maxScore: number;
  /** How many of the questions they actually answered. */
  answered: number;
  elapsedSeconds: number;
  timedOut: boolean;
  /** ISO 8601. */
  completedAt: string;
}

/**
 * The Lambda's shape, which is not ours.
 *
 * `answered` and `timedOut` have no columns, so they go in `meta` rather than
 * being dropped: "22 out of 50, and they only reached 31 of them" is a
 * different result from "22 out of 50 with time to spare", and a percentile
 * that cannot tell those apart is measuring the clock as much as the person.
 *
 * `grade_band` is the comparison group, so it is the band with our internal
 * "grade-" prefix removed: the Lambda's vocabulary is "7-8", not "grade-7-8".
 */
function toWireFormat(row: ResultStatsRow): Record<string, unknown> {
  return {
    kind: "result",
    test_type: row.audience,
    grade: row.grade,
    grade_band: row.band === "adult" ? "adult" : row.band.replace(/^grade-/, ""),
    score: row.score,
    max_score: row.maxScore,
    duration_secs: Math.max(0, Math.round(row.elapsedSeconds)),
    source: row.audience === "child" ? EMAIL_SOURCES.testChild : EMAIL_SOURCES.testParent,
    meta: {
      test_id: row.testId,
      answered: row.answered,
      timed_out: row.timedOut,
      completed_at: row.completedAt,
    },
  };
}

const FILE = join(process.cwd(), ".data", "test-results.local.json");

/**
 * File a finished attempt. Never throws: every caller is on a path where the
 * visitor is about to be shown their score and can do nothing about a failure
 * here.
 */
export async function recordResultStats(row: ResultStatsRow): Promise<void> {
  try {
    if (emailStoreMode() === "proxy") await writeRemote(row);
    else writeLocal(row);
  } catch (err) {
    console.error(
      "[result-stats] failed to file a result:",
      err instanceof Error ? err.message : err,
    );
  }
}

async function writeRemote(row: ResultStatsRow): Promise<void> {
  // The results endpoint IS the signup endpoint, discriminated by `kind`.
  // RESULTS_STATS_URL exists only for the case where they need to diverge.
  const url = (process.env.RESULTS_STATS_URL || process.env.EMAIL_PROXY_URL)?.trim();
  const secret = process.env.EMAIL_PROXY_SECRET;
  if (!url || !secret) {
    throw new Error("EMAIL_PROXY_URL and EMAIL_PROXY_SECRET are required to file a result");
  }

  const body = JSON.stringify(toWireFormat(row));

  /*
    ONE RETRY, AND ONLY ON A 5xx.

    A cold invocation of the Lambda answers `server_error` and then works on
    every call after it, which was reproducible: the first two probes after a
    deploy failed and a dozen identical ones straight afterwards all passed. On
    a fire-and-forget write that swallows its errors, that means the first
    result after an idle period disappears with nothing to show for it — the
    same silent-loss shape as the bug this whole file exists to close.

    A 4xx is not retried. That is the Lambda telling us the row is wrong, and
    sending it again would just be wrong twice.
  */
  let last = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400));
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-shared-secret": secret },
      body,
      cache: "no-store",
    });
    if (res.ok) return;

    let detail = "";
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      /* the status is enough */
    }
    last = `${res.status}: ${detail}`;
    if (res.status < 500) break;
  }
  throw new Error(`results endpoint responded ${last}`);
}

/**
 * Mirrors the signup path's local mode: a laptop must not be able to put test
 * rows into the real table, and the shape still gets exercised.
 */
function writeLocal(row: ResultStatsRow): void {
  let rows: ResultStatsRow[] = [];
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as ResultStatsRow[];
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    rows = [];
  }
  rows.push(row);
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch {
    // Read-only filesystem. Local mode's output is the log line below.
  }
  console.info(
    `[result-stats] local: ${row.testId} ${row.score}/${row.maxScore} ` +
      `(nothing sent to Aurora)`,
  );
}
