import "server-only";

import { emailStoreMode } from "../email-store-mode";

/**
 * The suppression list: who has told us to stop, and the gate that reads it.
 *
 * ===========================================================================
 * THE POINT OF THIS FILE IS THAT THE SEND PATH CANNOT SKIP IT
 * ===========================================================================
 * An unsubscribe link that records nothing, or records somewhere the sender
 * never reads, is the usual way this gets built wrong. The recording half is
 * `suppress()`. The reading half is `filterSuppressed()`, and
 * lib/email/product-email.ts will not send a single message without calling
 * it: not "should call it", cannot, because the send function takes the
 * filter's output as its input and there is no other way in.
 *
 * ===========================================================================
 * IT FAILS CLOSED, WHICH IS THE OPPOSITE OF EVERY OTHER WRITE HERE
 * ===========================================================================
 * The rest of this codebase is carefully fail-OPEN: a signup whose list write
 * hiccups still succeeds, a result whose stats row fails is still shown, and
 * that is right, because the cost is a missing statistic and the alternative is
 * punishing a visitor for our problem.
 *
 * This one inverts. If the suppression lookup cannot be completed, we do not
 * know whether the person asked us to stop, and the cost of guessing wrong is
 * mailing somebody who opted out. That is the one failure in this system with a
 * regulator attached to it. So a lookup that throws takes the whole batch off
 * the send rather than letting it through, and the caller is told why.
 *
 * ===========================================================================
 * SUPPRESSION GOVERNS PRODUCT EMAIL, NOT THE RESULTS EMAIL
 * ===========================================================================
 * Somebody who unsubscribed from product news and then goes and takes the test
 * again, types their address into the results gate and presses the button, has
 * asked for a specific message. Withholding it would be obeying a preference
 * they did not express, and it would break the only thing the site actually
 * does. CAN-SPAM draws the same line: the opt-out obligation attaches to
 * commercial messages, not to a transactional one the recipient requested.
 *
 * So app/api/test-results/send deliberately does NOT consult this, and that is
 * a decision rather than an oversight. If a results email ever grows an app
 * pitch it stops being transactional (see the note at the top of
 * lib/test/results-email.ts) and this rule has to be revisited with it.
 */

export type SuppressionReason = "unsubscribe" | "bounce" | "complaint" | "manual";

/** Matches MAX_SUPPRESSION_CHECK in infra/lambda/sffs-email-proxy. */
const MAX_BATCH = 500;

function proxyConfig(): { url: string; secret: string } {
  const url = process.env.EMAIL_PROXY_URL?.trim();
  const secret = process.env.EMAIL_PROXY_SECRET;
  if (!url || !secret) {
    throw new Error(
      "Email proxy is not configured: set EMAIL_PROXY_URL and EMAIL_PROXY_SECRET.",
    );
  }
  return { url, secret };
}

async function callProxy<T>(body: Record<string, unknown>): Promise<T> {
  const { url, secret } = proxyConfig();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shared-secret": secret },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      /* the status is enough */
    }
    throw new Error(`email proxy responded ${res.status}: ${detail}`);
  }
  return (await res.json()) as T;
}

export interface SuppressResult {
  /** False when the address was already on the list. Only used for logging. */
  created: boolean;
}

/**
 * Record that an address does not want product email.
 *
 * Safe to call repeatedly: the table's primary key turns a second call into an
 * UPDATE of the counter. That is what lets the route be hit twice by a mail
 * scanner without anything going wrong.
 *
 * THROWS on failure, and the route surfaces that as an honest error page rather
 * than a cheerful confirmation. "You have been unsubscribed" over a write that
 * did not land is the single worst outcome available here, because the person
 * stops looking for the problem and the next send goes to them anyway.
 */
export async function suppress(
  email: string,
  reason: SuppressionReason = "unsubscribe",
  meta: Record<string, unknown> = {},
): Promise<SuppressResult> {
  const address = email.trim().toLowerCase();
  if (!address) throw new Error("suppress() requires an email address");

  if (emailStoreMode() !== "proxy") {
    // Mirrors lib/email-store.ts: a laptop must not be able to write to the
    // real table, and the local branch still exercises the call shape.
    console.info(
      `[suppression] local mode: would suppress ${maskEmail(address)} (${reason}). ` +
        `Nothing sent to Aurora.`,
    );
    return { created: true };
  }

  const data = await callProxy<{ ok?: boolean; created?: boolean }>({
    kind: "unsubscribe",
    email: address,
    reason,
    meta,
  });
  if (data?.ok !== true) throw new Error("email proxy rejected the suppression");
  return { created: data.created === true };
}

export interface FilterResult {
  /** Addresses that may be mailed. */
  allowed: string[];
  /** Addresses that asked us to stop. */
  suppressed: string[];
}

/**
 * Split a list into who may be mailed and who may not.
 *
 * THIS IS THE GATE. It throws rather than returning a partial answer, because
 * every caller's correct response to "we could not check" is to send nothing,
 * and a function that can return an optimistic empty `suppressed` array on
 * failure is a function that will eventually do so at three in the morning.
 */
export async function filterSuppressed(emails: string[]): Promise<FilterResult> {
  const addresses = Array.from(
    new Set(
      emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0),
    ),
  );
  if (addresses.length === 0) return { allowed: [], suppressed: [] };
  if (addresses.length > MAX_BATCH) {
    throw new Error(
      `filterSuppressed() takes at most ${MAX_BATCH} addresses at a time; ` +
        `got ${addresses.length}. Chunk the batch.`,
    );
  }

  if (emailStoreMode() !== "proxy") {
    throw new Error(
      "Refusing to report a suppression list from local mode. A local run has " +
        "no view of the real table, and answering 'nobody is suppressed' is the " +
        "one wrong answer this function must never give.",
    );
  }

  const data = await callProxy<{ ok?: boolean; suppressed?: unknown }>({
    kind: "suppressed",
    emails: addresses,
  });
  if (data?.ok !== true || !Array.isArray(data.suppressed)) {
    throw new Error("email proxy returned no suppression list");
  }

  const blocked = new Set(
    data.suppressed
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim().toLowerCase()),
  );
  return {
    allowed: addresses.filter((a) => !blocked.has(a)),
    suppressed: addresses.filter((a) => blocked.has(a)),
  };
}

/** Enough to recognise your own address in a log, not enough to be a copy of the list. */
function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.split("@");
  return `${user.slice(0, 2)}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
