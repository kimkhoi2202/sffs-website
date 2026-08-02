import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { emailStoreMode, emailStoreReason, type EmailStoreMode } from "./email-store-mode";

/**
 * Server-only client for the SFFS email-signup proxy, and the boundary that
 * keeps a laptop out of the production database.
 *
 * ===========================================================================
 * THE PROXY
 * ===========================================================================
 * The website does not talk to a database directly. It POSTs validated leads to
 * a small AWS Lambda (fronted by API Gateway) that inserts them into Aurora
 * (sffs.email_signups) via the RDS Data API. This keeps ALL AWS credentials on
 * the AWS side (the Lambda's execution role); the ONLY secret this app holds is
 * a random shared secret (EMAIL_PROXY_SECRET) sent in the `x-shared-secret`
 * header. No AWS access keys ever reach Vercel.
 *
 * The `server-only` import turns any accidental client import into a build
 * error, so the shared secret is never inlined into the browser bundle (it is
 * also not NEXT_PUBLIC).
 *
 * ===========================================================================
 * WHY THERE IS A SECOND MODE
 * ===========================================================================
 * `EMAIL_PROXY_URL` in a developer's `.env.local` is the REAL one. It has to be,
 * or the proxy path could never be exercised locally. The consequence, before
 * this existed, was that every submission from localhost landed in the same
 * table as real signups: one afternoon of testing the flow put fifteen junk
 * rows into a table that held one real row, and they had to be deleted by hand.
 * That is not a mistake somebody makes once. It is the default behaviour of a
 * correctly configured laptop, and it gets worse the more the flow is tested.
 *
 * So there are two modes and the safe one is the default.
 *
 *   local   the write goes to .data/email-signups.local.json and a line is
 *           printed to the server log. Nothing leaves the machine.
 *   proxy   the real thing.
 *
 * ===========================================================================
 * HOW IT FAILS SAFE
 * ===========================================================================
 * Writing to production requires a POSITIVE signal. Everything else is local:
 *
 *   1. `EMAIL_STORE=proxy`        an explicit, spelled-out opt-in. Any
 *                                 environment, including a laptop, for the
 *                                 developer who genuinely wants to test the
 *                                 real path once.
 *   2. `VERCEL_ENV=production`    the real deployment, set by Vercel itself.
 *
 * Absent, misspelled, empty, or set to anything else, the mode is `local`.
 * That covers the cases a NODE_ENV check would get wrong: `next build && next
 * start` on a laptop is NODE_ENV=production but is not production, and neither
 * is a preview deployment or CI. All three now stay local.
 *
 * The one direction left is `EMAIL_STORE=local` on the real deployment, which
 * would bin real signups. It is honoured, because overriding into the safe
 * direction should always work, and it is logged as an error every time the
 * module loads so it cannot sit there unnoticed.
 *
 * A misconfigured proxy (mode is `proxy`, URL or secret missing) throws rather
 * than falling back, because silently writing a production lead to a JSON file
 * on an ephemeral serverless instance would lose it.
 *
 * ===========================================================================
 * THE MODE IS ANNOUNCED, NOT INFERRED
 * ===========================================================================
 * It is logged once at first use, and the dev tools panel shows it. A boundary
 * you have to reason about is a boundary somebody gets wrong.
 */

export interface EmailSignupInput {
  email: string;
  source: string;
  meta: Record<string, unknown>;
}

export interface EmailSignupResult {
  /**
   * True when this call actually created a row. False when the address was
   * already on the list and `ON CONFLICT DO NOTHING` suppressed the insert.
   *
   * The caller uses this to decide whether the submit is a real conversion. A
   * repeat submit is still a success for the visitor (same status, same body),
   * it just must not be counted twice.
   */
  inserted: boolean;
  /** Which store took the write. Returned so a route can log it in development. */
  mode: EmailStoreMode;
}

/**
 * The rule itself lives in ./email-store-mode.ts, which is not `server-only`
 * and therefore can be asserted against a truth table by
 * scripts/verify-email-store.mjs. Re-exported so callers have one import.
 */
export { emailStoreMode, emailStoreReason, type EmailStoreMode } from "./email-store-mode";

let announced = false;
function announceOnce(): void {
  if (announced) return;
  announced = true;
  const mode = emailStoreMode();
  const reason = emailStoreReason();

  if (mode === "local") {
    if (process.env.VERCEL_ENV === "production") {
      console.error(
        `[email-store] REFUSING TO WRITE TO PRODUCTION on a production deployment (${reason}). ` +
          `Real signups are being written to a local file and will be lost. Unset EMAIL_STORE.`,
      );
    } else {
      console.info(
        `[email-store] LOCAL mode (${reason}). Signups go to ${relativeFile()} and nothing reaches Aurora. ` +
          `Set EMAIL_STORE=proxy to write to the real database.`,
      );
    }
    return;
  }

  const onProdDeployment = process.env.VERCEL_ENV === "production";
  const message =
    `[email-store] PROXY mode (${reason}). Signups are written to the REAL Aurora table.`;
  if (onProdDeployment) console.info(message);
  else console.warn(`${message} This is not a production deployment.`);
}

/* ==========================================================================
 * The local store
 * ========================================================================== */

/**
 * A JSON file under .data/, which is gitignored and already where
 * lib/test/result-store.ts keeps finished results.
 *
 * It reproduces the proxy's semantics rather than just swallowing the write, so
 * the code paths that depend on them are actually exercised locally: the unique
 * constraint on (email, source) is mirrored, and `inserted` comes back false on
 * a repeat, which is what stops the conversion event double-counting. A store
 * that always said "yes, new row" would leave that branch untested.
 */
const FILE = join(process.cwd(), ".data", "email-signups.local.json");
const relativeFile = () => ".data/email-signups.local.json";

interface LocalRow extends EmailSignupInput {
  at: string;
}

function insertLocal(input: EmailSignupInput): EmailSignupResult {
  let rows: LocalRow[] = [];
  try {
    rows = JSON.parse(readFileSync(FILE, "utf8")) as LocalRow[];
    if (!Array.isArray(rows)) rows = [];
  } catch {
    rows = []; // missing or corrupt: start clean
  }

  const duplicate = rows.some(
    (r) => r.email === input.email && r.source === input.source,
  );

  if (!duplicate) {
    rows.push({ ...input, at: new Date().toISOString() });
    try {
      mkdirSync(dirname(FILE), { recursive: true });
      writeFileSync(FILE, JSON.stringify(rows, null, 2), "utf8");
    } catch {
      // Read-only filesystem. The point of this mode is that the write does
      // not matter, so losing it is fine; the log line below is the artefact
      // anyone is actually reading.
    }
  }

  console.info(
    `[email-store] local ${duplicate ? "duplicate" : "insert"}: source=${input.source} ` +
      `email=${maskEmail(input.email)} (nothing sent to Aurora)`,
  );

  return { inserted: !duplicate, mode: "local" };
}

/**
 * Enough of the address to recognise your own test submission in the log, and
 * not enough to be a copy of the list in a terminal buffer.
 */
function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.split("@");
  const head = user.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

/* ==========================================================================
 * The proxy
 * ========================================================================== */

async function insertViaProxy(input: EmailSignupInput): Promise<EmailSignupResult> {
  const url = process.env.EMAIL_PROXY_URL;
  const secret = process.env.EMAIL_PROXY_SECRET;
  if (!url || !secret) {
    throw new Error(
      "Email proxy is not configured: set EMAIL_PROXY_URL and EMAIL_PROXY_SECRET, " +
        "or set EMAIL_STORE=local to write signups to a local file instead.",
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shared-secret": secret,
    },
    body: JSON.stringify(input),
    // A signup is a mutation — never cache it.
    cache: "no-store",
  });

  if (!res.ok) {
    // Capture a short body for server logs only; never surface it to the client.
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      // ignore — the status code is enough to signal failure
    }
    throw new Error(`email proxy responded ${res.status}: ${detail}`);
  }

  /*
    Read the proxy's row-created flag. The proxy's insert uses RETURNING, so a
    row comes back only when ON CONFLICT did not fire.

    FAIL OPEN on purpose. A proxy build that predates this flag sends no such
    field, and treating "absent" as false would silently drop every conversion
    event to zero, which is far worse than the double-count this replaces. So an
    absent or unparseable flag means "count it", exactly matching the old
    behavior, and the dedupe only starts once the proxy actually reports.

    Accepts `inserted` or `created` so this does not hinge on which name the
    proxy settles on.
  */
  let inserted = true;
  try {
    const data = (await res.json()) as {
      inserted?: unknown;
      created?: unknown;
    } | null;
    if (typeof data?.inserted === "boolean") inserted = data.inserted;
    else if (typeof data?.created === "boolean") inserted = data.created;
  } catch {
    // No body, or not JSON: keep the fail-open default.
  }

  return { inserted, mode: "proxy" };
}

/* ==========================================================================
 * The one function everything above this file calls
 * ========================================================================== */

/**
 * Record a validated lead, in whichever store this environment is allowed to
 * write to. Resolves on success — including a deduped repeat submit. Throws on
 * misconfiguration, a non-2xx proxy response, or a network failure so the
 * caller can return a generic 500 without leaking details.
 */
export async function insertEmailSignup(
  input: EmailSignupInput,
): Promise<EmailSignupResult> {
  announceOnce();
  return emailStoreMode() === "proxy"
    ? insertViaProxy(input)
    : insertLocal(input);
}
