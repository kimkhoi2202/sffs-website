import "server-only";

/**
 * What counts as "the website", and who counts as a real visitor.
 *
 * ===========================================================================
 * THE INTERNAL-USER FILTER IS NOT HERE, DELIBERATELY
 * ===========================================================================
 * This file used to reimplement the project's internal-user exclusions as
 * hand-written SQL, from a copy of the distinct_id list read out of project
 * settings. It reported 55 visitors where PostHog reported 41.
 *
 * The list had grown from 15 ids to 21 without the copy knowing. Worse, there
 * are FIVE mechanisms in that setting and they are not interchangeable: two
 * cohorts, two distinct_id lists that reach different event sources (one only
 * covers browser events, the other also reaches server-side and mobile), and an
 * `is_internal` event-property rule that is the only thing catching one
 * identity and the only mechanism that survives a distinct_id reset inside a
 * browser profile. Any reimplementation has to get all five right and then stay
 * right forever, against a setting somebody else edits.
 *
 * So the exclusions now come from PostHog itself: every query that touches
 * `events` carries a `{filters}` placeholder, and the Query API substitutes the
 * project's live `test_account_filters` into it. It cannot drift, and it is
 * retroactive to changes made after this code was written. See
 * lib/dashboard/posthog-query.ts.
 */

/**
 * The website surface, for the queries that need to separate it from the app.
 *
 * The same PostHog project also receives `posthog-react-native` events from the
 * mobile app — hundreds of sessions with no pathname, no referrer and no
 * channel. `posthog-node` is deliberately INCLUDED alongside the browser SDK:
 * /api/access-signup fires `email_captured` from the server precisely so a
 * blocked client library cannot hide a signup, and excluding it would drop the
 * one person whose entire footprint is that single event.
 *
 * Pageview-based queries do not need this at all — the mobile app never sends a
 * `$pageview` — and they deliberately omit it so they stay byte-identical to
 * the queries the numbers were verified against.
 */
export const WEBSITE_SURFACE = `properties.$lib IN ('web', 'posthog-node')`;
