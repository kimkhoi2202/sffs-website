/**
 * The URLs a shared result travels on.
 *
 * ===========================================================================
 * A SHARED LINK IS NOT THE RESULTS LINK
 * ===========================================================================
 * /results/[token] is a RECEIPT. It is what the owner gets mailed, it opens on
 * their own score, and its job is to show them what they earned.
 *
 * /beat/[token] is a CHALLENGE. Same token, same signature, same score, but a
 * stranger opening it is not there to read someone else's receipt — they were
 * dared. Sending them to the receipt is a dead end: the page is about a person
 * who is not them, and the only thing they can do with it is close the tab.
 *
 * Two routes rather than one route sniffing at the visitor, because "is this
 * the owner" is not a question a stateless token can answer. The sharer's own
 * device knows which link it is handing out, so the distinction is made at
 * share time, where the answer is actually known.
 *
 * ===========================================================================
 * WHY /beat
 * ===========================================================================
 * It matches the words on the share card ("CAN YOU BEAT IT?"), and it is five
 * characters shorter than /challenge on a URL that already carries a ~216
 * character token.
 *
 * ===========================================================================
 * NO PII, HERE OR ANYWHERE DOWNSTREAM
 * ===========================================================================
 * The only variable in these URLs is the token, and the token carries a test
 * id, a grade, packed answers and two timestamps — no address and nothing else
 * identifying. See lib/test/result-token.ts. There is deliberately no name
 * parameter: a first name in a shareable URL is personal data, this flow is
 * used by children, and the parameter would be unsigned and therefore editable
 * by anyone holding the link.
 */

/**
 * The query param that drops someone straight into the grade picker.
 *
 * IT LIVES HERE, NOT IN THE COMPONENT THAT FIRST NEEDED IT. It used to be
 * exported from components/test/share-to-child.tsx, which carries "use client".
 * A plain string exported from a client module is not a string to a SERVER
 * component: the import resolves to a client-reference stub, so the challenge
 * page rendered `href="/?function() { throw ... }"` and every child challenge
 * link was quietly dead. Both sides import it from this module, which has no
 * directive and is therefore whichever kind of module its importer is.
 */
export const CHILD_ENTRY_PARAM = "for=child";

/** How a share left the device. Also the `utm_content` value. */
export type ShareMechanism = "native_sheet" | "image_download" | "copy_link";

/**
 * Matches the vanity redirects in next.config.ts, which all tag
 * `utm_medium=social`. `utm_source=share` is the honest answer for a link the
 * OS share sheet handed to an app we cannot see: it says this visit came from
 * somebody else's share, which is the thing worth counting.
 */
export const SHARE_UTM_SOURCE = "share";
export const SHARE_UTM_MEDIUM = "social";

export function beatPathFor(token: string): string {
  return `/beat/${encodeURIComponent(token)}`;
}

/** The 1080x1920 PNG for a result. Same-origin, so `download` works on it. */
export function shareCardPathFor(token: string): string {
  return `/results/${encodeURIComponent(token)}/share-card`;
}

/**
 * The absolute link to hand somebody, tagged so the loop is measurable.
 *
 * `utm_content` records which mechanism produced the link, which is the only
 * way to tell a share sheet's traffic from a pasted copy-link. The image
 * download has no URL to tag, so it is measured by its client event alone.
 */
export function beatUrlFor(
  token: string,
  origin: string,
  mechanism: Exclude<ShareMechanism, "image_download">,
): string {
  const params = new URLSearchParams({
    utm_source: SHARE_UTM_SOURCE,
    utm_medium: SHARE_UTM_MEDIUM,
    utm_content: mechanism,
  });
  return `${origin.replace(/\/+$/, "")}${beatPathFor(token)}?${params}`;
}
