/**
 * WHICH STORE A SIGNUP GOES TO. The rule, on its own, with nothing else in it.
 *
 * Split out of lib/email-store.ts so it can be TESTED. That file is
 * `server-only`, which throws the moment plain Node imports it, so the one part
 * of the boundary worth asserting against a truth table could not be reached by
 * a test. This module holds no secrets and touches no I/O — it reads two
 * environment variables and returns a string — so it costs nothing to make it
 * importable. See scripts/verify-email-store.mjs.
 *
 * ===========================================================================
 * THE RULE
 * ===========================================================================
 * WRITING TO PRODUCTION REQUIRES A POSITIVE SIGNAL. There are exactly two:
 *
 *   EMAIL_STORE=proxy       an explicit, spelled-out opt-in. Works anywhere,
 *                           including a laptop, for the developer who wants to
 *                           exercise the real path once.
 *   VERCEL_ENV=production   the real deployment, set by Vercel itself.
 *
 * Absent, empty, misspelled, or anything else: local. That is deliberately
 * stricter than a NODE_ENV check, which gets three common cases wrong.
 * `next build && next start` on a laptop is NODE_ENV=production and is not
 * production; so is a preview deployment; so is CI. All three stay local here.
 *
 * The remaining direction, `EMAIL_STORE=local` on the real deployment, is
 * honoured — overriding into the SAFE direction should always work — and
 * lib/email-store.ts logs it as an error on every boot so it cannot sit there
 * unnoticed binning real signups.
 */

export type EmailStoreMode = "proxy" | "local";

export function emailStoreMode(): EmailStoreMode {
  const explicit = process.env.EMAIL_STORE?.trim().toLowerCase();
  if (explicit === "proxy") return "proxy";
  if (explicit === "local") return "local";
  return process.env.VERCEL_ENV === "production" ? "proxy" : "local";
}

/** Why the mode is what it is, for the boot log and the dev panel. */
export function emailStoreReason(): string {
  const explicit = process.env.EMAIL_STORE?.trim().toLowerCase();
  if (explicit === "proxy") return "EMAIL_STORE=proxy";
  if (explicit === "local") return "EMAIL_STORE=local";
  if (process.env.VERCEL_ENV === "production") return "VERCEL_ENV=production";
  return `no positive signal to write to production (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"})`;
}
