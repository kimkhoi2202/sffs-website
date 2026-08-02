/**
 * WHERE AN EMAIL ADDRESS CAME FROM. The single vocabulary, shared by the
 * browser and the server.
 *
 * ===========================================================================
 * WHY THIS IS ITS OWN FILE
 * ===========================================================================
 * These values used to live in lib/analytics/events.ts, which begins with
 * `import posthog from "posthog-js"`. Two server routes imported them, which
 * pulled a browser SDK into a Node bundle for the sake of three string
 * constants. Worse, it made the vocabulary feel like an analytics concern when
 * it is really a DATA concern: `source` is a column in Aurora, and the PostHog
 * property is the copy of it.
 *
 * ===========================================================================
 * WHY THE TEST HAS ITS OWN VALUES, AND TWO OF THEM
 * ===========================================================================
 * The site can serve three different front doors (see app/page.tsx). If every
 * one of them files its signups under the same tag, the version switch cannot
 * answer the only question it exists to answer: does the test convert better
 * than a plain email box? So v3 gets its own values, and the old homepage keeps
 * `pricing-get-access` so its historical rows keep meaning what they meant.
 *
 * The test then splits into TWO values rather than one, because the two
 * branches are different funnels and different records:
 *
 *   testParent  an adult took the test and gave their own address.
 *   testChild   a child took the test and a grown-up's address was given on
 *               their behalf, asked for as such.
 *
 * That distinction has to be in the data from the first row, not bolted on
 * later. It is how the two conversion rates get compared, and it is what a
 * deletion request or a question about who these addresses belong to would be
 * answered from.
 */

export const EMAIL_SOURCES = {
  /** The archived early-access homepage form (v1 and v2). */
  homepage: "pricing-get-access",
  /** The adult test's results gate: a parent giving their own address. */
  testParent: "smart-fella-test-parent",
  /** A child test's results gate: a grown-up's address, asked for as such. */
  testChild: "smart-fella-test-child",
} as const;

export type EmailSource = (typeof EMAIL_SOURCES)[keyof typeof EMAIL_SOURCES];

const KNOWN: ReadonlySet<string> = new Set(Object.values(EMAIL_SOURCES));

/**
 * Is this a value we recognise?
 *
 * The API route uses this to decide whether to file a signup under the value it
 * was given or under the default. It does NOT reject an unknown value, because
 * failing a real person's signup over a bookkeeping mistake is the wrong trade
 * — but it does log, so a source that was added to one side and not the other
 * shows up in the server log rather than being misfiled in silence forever.
 */
export function isKnownEmailSource(value: string): value is EmailSource {
  return KNOWN.has(value);
}
