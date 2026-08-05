/**
 * Where a verification run is allowed to point, for the scripts that WRITE.
 *
 * ===========================================================================
 * THE HARNESS PUT FIFTEEN FAKE RESULTS IN THE REAL TABLE
 * ===========================================================================
 * `verify-review-nav.mjs` needs a finished attempt to have something to open,
 * and it got one by POSTing to /api/test-results. Against localhost that costs
 * nothing: `emailStoreMode()` (lib/email-store-mode.ts) has no positive signal
 * to write to production, so the row goes to a JSON file under .data/.
 *
 * The same script pointed at https://www.smartfellaorfartsmella.com is a
 * completely different act. There `VERCEL_ENV=production`, the mode is `proxy`,
 * and the attempt lands in Aurora `test_results` alongside real people's
 * scores. Fifteen of them did, against twenty-three genuine completions — a
 * quarter of the scored adult rows were the harness measuring itself. Four
 * arrived inside one five-minute window.
 *
 * They are recognisable after the fact (900 seconds with `timed_out` false,
 * which a person cannot produce, and a blank on every seventh question), but
 * recognisable after the fact is not the same as absent, and the diagnostic
 * must not become a server-side rejection rule: a phone that suspends its
 * timers while backgrounded exceeds 900 seconds honestly, and there is already
 * a genuine 35/50 at exactly 900 seconds in the data.
 *
 * ===========================================================================
 * WHY REFUSING PRODUCTION IS THE WHOLE FIX
 * ===========================================================================
 * Every other target is already safe, and safe structurally rather than by
 * convention. A preview deployment is not `VERCEL_ENV=production`, so it writes
 * locally; so does a laptop; so does CI. Production is the single target that
 * reaches Aurora, so declining that one target closes the hole without adding
 * any switch to a real visitor's request path.
 *
 * This is an exit, not a warning. A warning scrolls past.
 *
 * `verify-live-email.mjs` is the deliberate exception and does not call this:
 * its entire purpose is to exercise the live Resend and Aurora path, which
 * cannot be done anywhere else. It marks its rows instead — see SYNTHETIC.
 */

/**
 * The hosts that reach the real table. Matched on host alone, so the scheme,
 * port, path and any trailing slash cannot smuggle one past.
 */
const PRODUCTION_HOSTS = new Set([
  "smartfellaorfartsmella.com",
  "www.smartfellaorfartsmella.com",
]);

/**
 * The header that makes a row admit what wrote it. Must match
 * SYNTHETIC_HEADER in lib/test/result-stats.ts, which is what reads it.
 *
 * Spread into `fetch` headers, or handed to Playwright as `extraHTTPHeaders` so
 * that a run driving the real UI marks the POSTs the PAGE makes as well as its
 * own.
 */
export const SYNTHETIC = { "x-sffs-synthetic": "1" };

export function isProductionTarget(base) {
  try {
    return PRODUCTION_HOSTS.has(new URL(base).host.toLowerCase());
  } catch {
    // An unparseable target is not production, and the script will fail on it
    // soon enough with a better message than this file could give.
    return false;
  }
}

/**
 * Resolve the base URL for a script that creates results, refusing production.
 *
 * @param {string|undefined} raw  the CLI argument, if one was given
 * @param {string} script         name, for the message
 * @returns {string}              a target that cannot write to Aurora
 */
export function resolveWriteTarget(raw, script) {
  const base = (raw ?? "http://localhost:3000").replace(/\/+$/, "");
  if (!isProductionTarget(base)) return base;

  console.error(
    `\n${script}: refusing to run against production (${base}).\n\n` +
      `  This script creates a finished test result. On production that is a\n` +
      `  real row in Aurora test_results, next to real people's scores, and\n` +
      `  fifteen of them are already in there from runs like this one.\n\n` +
      `  Point it at localhost or a preview deployment instead — both write to\n` +
      `  a local file rather than the real table:\n\n` +
      `      node ${script} http://localhost:3000\n` +
      `      node ${script} https://<branch>.vercel.app\n`,
  );
  process.exit(2);
}
