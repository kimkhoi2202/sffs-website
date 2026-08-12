/**
 * What the dashboard means by "signed up", written down once.
 *
 * ===========================================================================
 * THE CONVERSION IS THE ADDRESS, NOT THE DELIVERY
 * ===========================================================================
 * Every signup figure on this dashboard used to be gated on a successful send.
 * `email_captured` fires server-side only when Aurora genuinely inserted a
 * row, and until now that insert happened AFTER Resend accepted the message —
 * so a person who typed a valid address and was told their results were coming
 * counted as a non-converter whenever the mail did not leave.
 *
 * That is a delivery fact wearing a conversion's clothes, and it fails in the
 * worst possible direction: it is silent, it only fires when something is
 * already wrong, and the harder the outage the more people it erases. On
 * 11 August the daily quota went at 11:33 UTC and did not come back until
 * midnight; 148 people gave us an address in those twelve and a half hours and
 * every single one of them was recorded as having refused.
 *
 * So the line moves to where the person actually is. A signup is somebody
 * handing over their address. Whether our mail server then succeeded is a
 * question about our infrastructure, and infrastructure does not get a vote on
 * whether a person converted.
 *
 * ===========================================================================
 * THE BOUNDARY: VALIDATED AND STORED
 * ===========================================================================
 * Not every keystroke in the box is an address. The cut is the point where the
 * product itself decided it had one:
 *
 *   PASSES VALIDATION   `components/test/email-gate.tsx` checks the shape and
 *                       returns early on a failure, firing
 *                       `email_capture_validation_failed` instead. Only a
 *                       well-formed address reaches the submit path, and the
 *                       regex there is the same one the API route re-applies.
 *   GETS STORED         `app/api/test-results/send/route.ts` writes the
 *                       address to Aurora before it calls the provider — the
 *                       `pending` row, added after 9 August precisely so an
 *                       outage ends with a list instead of a hole.
 *
 * Everything upstream of that (a typo, a blank box, a bare domain) is not an
 * address and is not counted. Everything downstream of it (a quota refusal, a
 * hard bounce, a provider incident) is not the person's doing and does not
 * un-count them.
 *
 * ===========================================================================
 * WHY TWO EVENTS AND NOT ONE
 * ===========================================================================
 * `email_captured` NOW means "submitted", because the write it is fired
 * alongside now happens before the send rather than after it. From the deploy
 * that shipped this, one event would be enough.
 *
 * `test_email_submitted` is here for the HISTORY. For everything recorded
 * before that deploy, `email_captured` still means "delivered", and the people
 * the old definition dropped are recoverable only through the client-side
 * attempt event. It carries no address and is not a conversion in its own
 * right; it is the only surviving witness that somebody typed one.
 *
 * The union is per PERSON and idempotent, which is what makes it safe to leave
 * in place forever. Somebody who submits once and is captured once is counted
 * once. Somebody who retried eight times through an outage is counted once.
 * And a drain that later delivers their mail adds no event at all, so a
 * recovered send cannot count a second time — see the drain route, which
 * deliberately fires no conversion for exactly this reason.
 *
 * ===========================================================================
 * AN ADDRESS THE PROVIDER WILL NOT ACCEPT IS STILL A SIGNUP. THIS WAS CHOSEN.
 * ===========================================================================
 * At least one stored address is malformed in a way our validation does not
 * catch and Resend does not forgive — a semicolon before the `@`, which passes
 * a shape check and is refused as invalid on send. It can never be delivered
 * to. Does it belong in a signup count?
 *
 * It is counted. Three reasons, in the order they matter:
 *
 *   1. THE ALTERNATIVE IS SEND-GATING AGAIN. The only way to know the address
 *      is undeliverable is to ask the provider. Excluding it would put Resend
 *      back in charge of the conversion number through a side door, which is
 *      the exact thing this file exists to stop.
 *   2. DELIVERABILITY IS NOT A PROPERTY OF THE MOMENT. Addresses go dead,
 *      mailboxes fill, domains lapse. A conversion that can be revoked months
 *      later by somebody else's mail server is not a conversion, it is a
 *      lease.
 *   3. THE PERSON DID THE THING. They finished the test and gave us what we
 *      asked for. That they fat-fingered it is a data-quality problem for the
 *      mailing list, not a reason to say they never signed up.
 *
 * The honest cost of that choice is that the signup count is very slightly
 * larger than the number of people who can ever be reached — one row, at the
 * time of writing. `emailedUndelivered` on the funnel carries the general
 * version of that gap and the panel prints it, so the reader sees the size of
 * what they are being asked to accept rather than being told it is nothing.
 */

/**
 * A person gave us their address.
 *
 * An event-level predicate, so it goes inside a `maxIf` / `uniqIf` and rolls
 * up to the person. Exported as one string rather than pasted into four
 * queries because the Signups tile, the funnel, the channel table and the
 * audience split all have to answer this question the same way — the last time
 * two of them disagreed about a definition it took an evening to find.
 */
export const GAVE_ADDRESS = `event IN ('email_captured', 'test_email_submitted')`;

/**
 * The old, send-gated reading of the same population.
 *
 * Kept and reported ALONGSIDE the corrected figure rather than replaced by it.
 * The owner has been reading the gated number all week and is presenting from
 * it; a headline that silently grows by a third is a headline nobody can
 * trust. The page shows both and names the difference — the same posture the
 * completion rule takes with its own correction.
 */
export const ADDRESS_DELIVERED = `event = 'email_captured'`;

/**
 * What the page says the number means, in one sentence.
 *
 * Lives here, next to the rule, so the definition on screen and the definition
 * in the WHERE clause cannot drift apart. The panel imports it; nobody retypes
 * it.
 */
export const SIGNUP_BASIS_NOTE =
  "A signup is an address that passed validation and was stored, counted when the " +
  "person submitted it. Whether the results email then reached them is a delivery " +
  "question and does not change this number.";
