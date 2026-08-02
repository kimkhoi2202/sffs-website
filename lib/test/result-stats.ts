import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { emailStoreMode } from "../email-store-mode";
import type { Grade, GradeBand } from "./types";

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
 * THE ENDPOINT DOES NOT EXIST YET
 * ===========================================================================
 * The signup proxy Lambda validates an email address before it does anything
 * else — POST it a body without one and it answers 400 `invalid_email` — so it
 * cannot carry these rows, and making it carry them would mean attaching an
 * address to a result, which is the one thing that must not happen.
 *
 * So this writes to its own endpoint, `RESULTS_STATS_URL`, fronting a
 * `sffs.test_results` table with the same shared-secret header the signup proxy
 * uses. Until that Lambda exists the variable is unset, and on a production
 * deployment that is reported as an error on first use rather than passing
 * quietly — the whole reason this file exists is that the previous version of
 * these rows was being dropped and nobody could tell.
 */

export interface ResultStatsRow {
  /** Which bank, e.g. "adult" or "grade-5". */
  testId: string;
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

const FILE = join(process.cwd(), ".data", "test-results.local.json");

let announced = false;

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
  const url = process.env.RESULTS_STATS_URL?.trim();
  const secret = process.env.EMAIL_PROXY_SECRET;

  if (!url) {
    if (!announced) {
      announced = true;
      console.error(
        "[result-stats] RESULTS_STATS_URL is not set. Finished tests are NOT being " +
          "recorded, so per-grade-band percentiles will have no data for this period. " +
          "This needs the sffs.test_results endpoint; see lib/test/result-stats.ts.",
      );
    }
    return;
  }
  if (!secret) throw new Error("EMAIL_PROXY_SECRET is not set");

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shared-secret": secret },
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`results stats endpoint responded ${res.status}`);
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
