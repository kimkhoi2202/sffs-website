import "server-only";

import { CANONICAL_ORIGIN } from "../site-url";
import { POSTAL_ADDRESS } from "../postal-address";
import { sendEmail, type SendEmailResult } from "./resend";
import { filterSuppressed } from "./suppression";
import { encodeUnsubscribeToken } from "./unsubscribe-token";

/**
 * The ONLY way a product email may leave this codebase.
 *
 * ===========================================================================
 * WHAT "PRODUCT EMAIL" MEANS, AND WHY IT NEEDS ITS OWN DOOR
 * ===========================================================================
 * A results email is transactional: somebody typed an address and asked for a
 * specific thing, once. A product email is not. Nobody asked for it on the day
 * it arrives, which is what puts it under CAN-SPAM's opt-out and
 * physical-address requirements and under the suppression list. The two cannot
 * share a sender, because everything below would then be optional for the
 * message that needs it most.
 *
 * ===========================================================================
 * THREE GATES, AND NONE OF THEM CAN BE FORGOTTEN
 * ===========================================================================
 * They are checks inside this function rather than a checklist in a comment,
 * because a checklist is only as good as the next person's attention.
 *
 *   1. THE KILL SWITCH. `PRODUCT_EMAIL_ENABLED` must be exactly "1". Unset,
 *      empty, "true", "yes" and "0" all refuse. Nothing here can send until
 *      somebody deliberately sets it, which is the mechanical version of the
 *      owner's "do not send these yet".
 *   2. THE SUPPRESSION CHECK. Every address goes through filterSuppressed()
 *      inside this function. It is not a parameter and there is no flag to skip
 *      it, so no call site can be written that misses it, and the check throws
 *      rather than guessing if the lookup fails.
 *   3. THE FOOTER. The message is rejected unless the rendered HTML and text
 *      both contain the unsubscribe URL, and the postal address when one is
 *      configured. Losing either from a template is easy and silent, and far
 *      easier to assert here than to remember.
 *
 * ===========================================================================
 * ONE RECIPIENT PER CALL, NEVER A BCC LIST
 * ===========================================================================
 * The unsubscribe link is per-recipient, so a single message addressed to many
 * people cannot carry a correct one. Batching also breaks the provider's own
 * accounting: Resend counts each To, Cc and Bcc separately against the quota,
 * so a bcc of 600 is 600 emails with one wrong unsubscribe link rather than a
 * clever saving.
 */

/** Re-exported for the existing renderer and verification scripts. */
export { POSTAL_ADDRESS };

/** Where an unsubscribe link points. Absolute: an inbox has no page to resolve against. */
export function unsubscribeUrlFor(email: string): string {
  return `${CANONICAL_ORIGIN}/unsubscribe?t=${encodeUnsubscribeToken(email)}`;
}

export type ProductSendResult =
  | { ok: true; id: string }
  | { ok: false; reason: "disabled" | "suppressed" | "missing_footer" | "send_failed"; detail: string };

export interface ProductEmailInput {
  to: string;
  subject: string;
  /** Must already contain the unsubscribe URL and the postal address. */
  html: string;
  text: string;
  /**
   * Provider tags for the bounded launch experiment. These are deliberately
   * opaque: recipientId is not an email address and cannot be reversed to one.
   */
  campaignTracking?: {
    campaign: string;
    variant: "a" | "b";
    recipientId: string;
  };
}

function enabled(): boolean {
  return process.env.PRODUCT_EMAIL_ENABLED === "1";
}

/**
 * Send one product email, or explain why it was not sent.
 *
 * Returns rather than throws on a refusal, so a batch runner can record a
 * per-recipient reason and carry on. The one thing it will not do is return
 * `ok: true` for a message that did not leave.
 */
export async function sendProductEmail(
  input: ProductEmailInput,
): Promise<ProductSendResult> {
  if (!enabled()) {
    return {
      ok: false,
      reason: "disabled",
      detail:
        "PRODUCT_EMAIL_ENABLED is not \"1\". Product email is switched off at the " +
        "environment, which is the intended resting state. Nothing was sent.",
    };
  }

  const address = input.to.trim().toLowerCase();
  const url = unsubscribeUrlFor(address);

  /*
    GATE 3 BEFORE GATE 2, deliberately: a malformed message is our bug and
    costs nothing to discover, whereas the suppression check is a network round
    trip. Checking the cheap invariant first keeps a template mistake from
    burning a lookup per recipient across a whole batch.
  */
  for (const [label, body] of [["html", input.html], ["text", input.text]] as const) {
    if (!body.includes(POSTAL_ADDRESS)) {
      return {
        ok: false,
        reason: "missing_footer",
        detail: `The ${label} body does not contain the postal address.`,
      };
    }
    if (!body.includes(url)) {
      return {
        ok: false,
        reason: "missing_footer",
        detail: `The ${label} body does not contain this recipient's unsubscribe URL.`,
      };
    }
  }

  // GATE 2. Throws if the lookup cannot be completed, and that is the point:
  // the caller gets an exception rather than a send to an unknown status.
  const { suppressed } = await filterSuppressed([address]);
  if (suppressed.length > 0) {
    return {
      ok: false,
      reason: "suppressed",
      detail: "This address has unsubscribed.",
    };
  }

  const sent: SendEmailResult = await sendEmail({
    to: address,
    subject: input.subject,
    html: input.html,
    text: input.text,
    /*
      RFC 8058 one-click. Both headers are required together: the URL alone
      tells a client where to go, and `List-Unsubscribe-Post` is what tells it
      that a POST to that URL is a complete unsubscribe needing no page and no
      human. Gmail and Yahoo look for the pair.

      The URL is https rather than mailto because a mailto asks the provider to
      trust that somebody reads that inbox. This one writes to the database.
    */
    headers: {
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    tags: input.campaignTracking
      ? [
          { name: "campaign", value: input.campaignTracking.campaign },
          { name: "variant", value: input.campaignTracking.variant },
          { name: "recipient_id", value: input.campaignTracking.recipientId },
        ]
      : undefined,
  });

  if (!sent.ok) {
    return { ok: false, reason: "send_failed", detail: sent.detail };
  }
  return { ok: true, id: sent.id };
}
