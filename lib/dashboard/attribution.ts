/**
 * Where a visit came from, resolved down a ladder rather than looked up in one
 * place.
 *
 * ===========================================================================
 * WHY A LADDER
 * ===========================================================================
 * A UTM-only report is wrong here, and provably so. On 4 August a real visitor
 * arrived from the Reddit Android app with NO UTM at all — the only surviving
 * evidence was the referrer `android-app://com.reddit.frontpage/`. On that same
 * day roughly half of the Reddit arrivals were in that state. A report keyed on
 * `utm_source` would have filed every one of them under "direct", which is not
 * a small inaccuracy: it is the difference between "Reddit is working" and
 * "nothing is working".
 *
 * So each visit is resolved on the first rung that has evidence, and THE RUNG
 * IS REPORTED ALONGSIDE THE ANSWER. "Reddit, from a UTM tag" and "Reddit,
 * inferred from the referrer" are both Reddit, and a reader deserves to know
 * which one they are looking at.
 *
 *   1  utm      an explicit utm_source on the landing URL
 *   1½ returner the entry path is /results/<token>. See below — this is the one
 *               landing signal that outranks the referrer.
 *   2  referrer the HTTP referrer, including app referrers that look nothing
 *               like a web one (`android-app://com.reddit.frontpage/`)
 *   3  landing  the rest of the entry path — /beat/<token> means a friend
 *               shared a challenge, /go/<id> is a per-post short link
 *   4  survey   the post-signup "how did you find us?" answer: self-reported,
 *               but a real human's real answer
 *   5  unknown  and only now
 *
 * Rungs 2, 3 and 4 must never be quietly folded into rung 5. Making a weak but
 * real signal visible is the entire point.
 *
 * ===========================================================================
 * WHY /results/ AND ONLY /results/ JUMPS THE REFERRER
 * ===========================================================================
 * The referrer sits above the landing path because for almost every entry the
 * referrer is the stronger fact: it names the surface that sent the visit, and
 * a path can be reached from anywhere. A `/beat/<token>` forwarded through
 * WhatsApp really was acquired through WhatsApp, and `/go/<id>` really was
 * clicked on whichever platform carried the post. Those stay below the
 * referrer, deliberately.
 *
 * `/results/<token>` is the exception, because it is not evidence about a
 * surface at all — it is evidence about the PERSON. You cannot hold a results
 * token unless you already took the test and were already emailed the link, so
 * the visit is a re-entry no matter which app happened to open it. Ranked
 * below the referrer it was being filed as acquisition by whatever surface the
 * link was tapped in, which on 10 August 2026 was 88 of 280 such sessions:
 *
 *   www.google.com          25  →  "Google Search", 40% of all organic search
 *   com.google.android.gm   53  →  "Email"    (the Gmail Android app)
 *   mail.google.com          6  →  "Email"
 *   outlook.live.com         1  →  "Email"
 *   temp-mail.org            1  →  "Email"
 *   10minutemail.com         2  →  "10minutemail.com"
 *
 * Every one of them had already completed the test, so they were inflating
 * every stage of an acquisition funnel, not merely mislabelling its first row.
 * The whole "Email" channel turned out to be this and nothing else.
 */

export type AttributionRung = "utm" | "referrer" | "landing" | "survey" | "unknown";

/**
 * Title-case an unrecognised value so it sits next to the named channels.
 *
 * HogQL's `substring` insists on all three arguments — the two-argument
 * "to the end" form that ClickHouse accepts is rejected outright — so the
 * length is passed explicitly.
 */
function titleCase(expr: string): string {
  return `concat(upper(substring(${expr}, 1, 1)), substring(${expr}, 2, length(${expr})))`;
}

export const RUNG_LABEL: Record<AttributionRung, string> = {
  utm: "UTM tag",
  referrer: "Referrer",
  landing: "Landing path",
  survey: "Survey answer",
  unknown: "No signal",
};

/** Short forms for the list rows, where the full label does not fit. */
export const RUNG_SHORT: Record<AttributionRung, string> = {
  utm: "UTM",
  referrer: "Referrer",
  landing: "Landing",
  survey: "Survey",
  unknown: "No signal",
};

/** How confident the rung is, for the UI to shade. */
export const RUNG_STRENGTH: Record<AttributionRung, "strong" | "medium" | "weak" | "none"> = {
  utm: "strong",
  referrer: "medium",
  landing: "medium",
  survey: "weak",
  unknown: "none",
};

/** Tailwind background token per channel, so a channel looks the same everywhere. */
export const CHANNEL_TINT: Record<string, string> = {
  Reddit: "bg-coral",
  Instagram: "bg-blue",
  TikTok: "bg-mint",
  YouTube: "bg-coral",
  Facebook: "bg-blue",
  X: "bg-cream",
  Threads: "bg-cream",
  WhatsApp: "bg-mint",
  "Google Search": "bg-yellow",
  Search: "bg-yellow",
  Email: "bg-mint",
  "Results email link": "bg-mint",
  "Shared challenge link": "bg-yellow",
  "Short link": "bg-yellow",
  "Internal navigation": "bg-gray-100",
  "Dev / preview": "bg-gray-100",
  "Direct or unknown": "bg-gray-100",
};

export function channelTint(channel: string): string {
  return CHANNEL_TINT[channel] ?? "bg-cream";
}

/* --------------------------------------------------------------------------
 * The HogQL side
 *
 * These are plain strings, safe to import anywhere, but only ever consumed by
 * server-side query builders. Each takes the NAME of a column or expression and
 * returns an expression, so the same ladder can run over the `sessions` table
 * and over raw `events` without being written twice and drifting.
 * ------------------------------------------------------------------------ */

/**
 * A referring domain, mapped to a channel.
 *
 * The Reddit clause is the one worth reading twice. `com.reddit.frontpage` is
 * how the Android app's `android-app://com.reddit.frontpage/` referrer reaches
 * PostHog after domain extraction; it shares no substring with `reddit.com`
 * beyond the word itself, so a naive `LIKE '%reddit.com%'` misses exactly the
 * visitors this ladder was built for.
 */
export function channelFromDomain(expr: string): string {
  const d = `lower(coalesce(toString(${expr}), ''))`;
  return `multiIf(
    ${d} = '' OR ${d} = '$direct', '',
    ${d} LIKE '%reddit%', 'Reddit',
    ${d} LIKE '%instagram%', 'Instagram',
    ${d} LIKE '%tiktok%' OR ${d} LIKE '%musically%', 'TikTok',
    ${d} LIKE '%youtube%' OR ${d} LIKE '%youtu.be%', 'YouTube',
    ${d} LIKE '%facebook%' OR ${d} LIKE '%fb.com%', 'Facebook',
    ${d} LIKE '%threads%', 'Threads',
    ${d} IN ('t.co') OR ${d} LIKE '%twitter%' OR ${d} LIKE 'x.com' OR ${d} LIKE '%.x.com', 'X',
    ${d} LIKE '%whatsapp%' OR ${d} LIKE '%wa.me%', 'WhatsApp',
    ${d} LIKE '%linkedin%' OR ${d} LIKE '%lnkd.in%', 'LinkedIn',
    ${d} LIKE '%discord%', 'Discord',
    ${d} LIKE '%t.me%' OR ${d} LIKE '%telegram%', 'Telegram',
    ${d} LIKE '%google.%' AND ${d} NOT LIKE '%mail.google%' AND ${d} NOT LIKE '%android.gm%', 'Google Search',
    ${d} LIKE '%bing.%' OR ${d} LIKE '%duckduckgo%' OR ${d} LIKE '%ecosia%' OR ${d} LIKE '%search.yahoo%', 'Search',
    ${d} LIKE '%mail.google%' OR ${d} LIKE '%android.gm%' OR ${d} LIKE '%outlook%'
      OR ${d} LIKE '%mail.yahoo%' OR ${d} LIKE '%proton%' OR ${d} LIKE '%temp-mail%'
      OR ${d} LIKE '%mailinator%' OR ${d} LIKE '%hotmail%' OR ${d} LIKE 'mail.%', 'Email',
    ${d} LIKE '%smartfellaorfartsmella%', 'Internal navigation',
    ${d} LIKE '%vercel.%' OR ${d} LIKE 'localhost%' OR ${d} LIKE '127.0.0.1%', 'Dev / preview',
    ${titleCase(d)}
  )`;
}

/** A `utm_source` value, mapped to the same channel vocabulary. */
export function channelFromUtm(expr: string): string {
  const s = `lower(coalesce(toString(${expr}), ''))`;
  return `multiIf(
    ${s} = '', '',
    ${s} LIKE '%reddit%', 'Reddit',
    ${s} LIKE '%instagram%', 'Instagram',
    ${s} LIKE '%tiktok%', 'TikTok',
    ${s} LIKE '%youtube%', 'YouTube',
    ${s} LIKE '%facebook%', 'Facebook',
    ${s} LIKE '%threads%', 'Threads',
    ${s} = 'x' OR ${s} LIKE '%twitter%', 'X',
    ${s} LIKE '%whatsapp%', 'WhatsApp',
    ${s} = 'share', 'Shared challenge link',
    ${s} = 'email', 'Email',
    ${titleCase(s)}
  )`;
}

/**
 * A results token on the entry path — the returner signal, and the only
 * landing-path clause that is allowed above the referrer.
 *
 * Split out of `channelFromLanding` so that the predicate and the label exist
 * once. It is still the first clause of that function, so the landing rung on
 * its own remains complete; the ladder just consults this half of it earlier.
 * See the note at the top of this file for why only this one is promoted.
 */
export function channelFromResultsToken(expr: string): string {
  const p = `lower(coalesce(toString(${expr}), ''))`;
  return `if(${p} LIKE '/results/%', 'Results email link', '')`;
}

/**
 * The entry path, mapped to a channel.
 *
 * The vanity routes (`/reddit`, `/x`, …) 307 to a UTM-tagged URL server-side,
 * so in practice they are resolved on rung 1 and never reach here — they are
 * listed anyway because a redirect can be changed and a rung that silently
 * stops matching is worse than a redundant clause.
 *
 * What DOES land here routinely is `/results/<token>`: someone opening the link
 * from their inbox. A UTM-only report calls that direct traffic. It is the
 * single most engaged visit the site gets.
 */
export function channelFromLanding(expr: string): string {
  const p = `lower(coalesce(toString(${expr}), ''))`;
  const returner = channelFromResultsToken(expr);
  return `multiIf(
    ${p} = '', '',
    ${returner} != '', ${returner},
    ${p} LIKE '/beat/%', 'Shared challenge link',
    ${p} LIKE '/go/%', 'Short link',
    ${p} = '/reddit', 'Reddit',
    ${p} = '/instagram', 'Instagram',
    ${p} = '/tiktok', 'TikTok',
    ${p} = '/youtube', 'YouTube',
    ${p} = '/threads', 'Threads',
    ${p} = '/x', 'X',
    ''
  )`;
}

/** The survey's self-reported answer, mapped to the same vocabulary. */
export function channelFromSurvey(expr: string): string {
  const s = `lower(coalesce(toString(${expr}), ''))`;
  return `multiIf(
    ${s} = '', '',
    ${s} = 'reddit', 'Reddit',
    ${s} = 'instagram', 'Instagram',
    ${s} = 'tiktok', 'TikTok',
    ${s} = 'youtube', 'YouTube',
    ${s} = 'threads', 'Threads',
    ${s} = 'x', 'X',
    ${s} = 'search', 'Search',
    ${s} = 'friend', 'Word of mouth',
    ${s} = 'other', 'Other (self-reported)',
    ${titleCase(s)}
  )`;
}

export interface LadderColumns {
  /** utm_source */
  utmSource: string;
  /** referring domain */
  refDomain: string;
  /** entry pathname */
  entryPath: string;
  /** the person's survey answer, or a literal '' when not joined in */
  surveySource: string;
}

/**
 * A rung name.
 *
 * The returner clause reports as `landing`, because that is what it is — the
 * entry path resolved it. It is not a sixth rung: adding one would change the
 * `AttributionRung` vocabulary, the strength shading and every panel that reads
 * them, to say something the existing name already says truthfully.
 */
export function rungExpr(c: LadderColumns): string {
  return `multiIf(
    ${channelFromUtm(c.utmSource)} != '', 'utm',
    ${channelFromResultsToken(c.entryPath)} != '', 'landing',
    ${channelFromDomain(c.refDomain)} != '', 'referrer',
    ${channelFromLanding(c.entryPath)} != '', 'landing',
    ${channelFromSurvey(c.surveySource)} != '', 'survey',
    'unknown'
  )`;
}

/** The resolved channel, or "Direct or unknown" at the bottom of the ladder. */
export function channelExpr(c: LadderColumns): string {
  return `multiIf(
    ${channelFromUtm(c.utmSource)} != '', ${channelFromUtm(c.utmSource)},
    ${channelFromResultsToken(c.entryPath)} != '', ${channelFromResultsToken(c.entryPath)},
    ${channelFromDomain(c.refDomain)} != '', ${channelFromDomain(c.refDomain)},
    ${channelFromLanding(c.entryPath)} != '', ${channelFromLanding(c.entryPath)},
    ${channelFromSurvey(c.surveySource)} != '', ${channelFromSurvey(c.surveySource)},
    'Direct or unknown'
  )`;
}

/**
 * The raw evidence the rung fired on, so a reader can audit the inference.
 *
 * The returner clause names the referrer it outranked rather than hiding it.
 * These are the rows most likely to be queried by someone who remembers the
 * channel table before the fix, and "landed on /results/… (over referrer
 * www.google.com)" answers that question where a bare path would prompt it.
 */
export function evidenceExpr(c: LadderColumns): string {
  const overReferrer = `if(
    ${channelFromDomain(c.refDomain)} != '',
    concat(' (over referrer ', toString(${c.refDomain}), ')'),
    ''
  )`;
  return `multiIf(
    ${channelFromUtm(c.utmSource)} != '', concat('utm_source=', toString(${c.utmSource})),
    ${channelFromResultsToken(c.entryPath)} != '',
      concat('landed on ', toString(${c.entryPath}), ${overReferrer}),
    ${channelFromDomain(c.refDomain)} != '', concat('referrer ', toString(${c.refDomain})),
    ${channelFromLanding(c.entryPath)} != '', concat('landed on ', toString(${c.entryPath})),
    ${channelFromSurvey(c.surveySource)} != '', concat('survey answer: ', toString(${c.surveySource})),
    'no utm, no referrer, no landing signal, no survey answer'
  )`;
}
