/**
 * Google Ads tag (gtag.js) — the ad-side conversion surface for the paid
 * funnel, run under the SAME rules as PostHog's ad-adjacent handling in
 * ./events.ts but with the ad platform's harder constraint:
 *
 *   PostHog   every event is kept; internal ones are stamped and filtered.
 *   Google    an event sent is an event BID ON. There is no filter to apply
 *             later and no way to retract one, so anything we would have
 *             filtered out must never be sent in the first place.
 *
 * ONE TAG. The account-level tag id below is the whole configuration: the base
 * tag boots gtag.js + registers the account, and a single `conversion` event
 * fires at form completion (trackTestEmailSubmitted). No per-action conversion
 * label is wired here — Google attributes the event at the account level, and a
 * labelled conversion action can be layered on in the Ads UI later without
 * another code change.
 *
 * PRIVACY INVARIANT: no call site passes an email, a name, a result token or
 * any other identifier to Google. The conversion carries `send_to` and nothing
 * else — the tag optimises on the event's existence, not on a payload.
 *
 * The tag id is PUBLIC BY DESIGN: gtag.js ships it in the browser bundle and it
 * is visible in the page source of every site that runs one. It is NOT a
 * secret, so it lives here as a constant rather than behind an env var.
 */

/*
 * REVIEW, recorded and not fixed: behaviour is unchanged on purpose. Each
 * finding sits at the line it applies to, with the fix named in a clause so
 * whoever picks it up is not re-deriving it.
 *
 * The PRIVACY INVARIANT above is true of what call sites PASS. It is not true
 * of what gtag SENDS. Every hit carries the page URL, and on /results/[token]
 * and /beat/[token] the URL is the result. See instrumentation-client.ts.
 *
 * /privacy is accurate today only because this has never reached production. It
 * says website analytics is not used for advertising, lists Google as a
 * subprocessor for Android sign-in and payments only, and says there is no
 * cookie banner. Shipping this makes all three wrong. Whether the policy moves
 * or the tag does is the owner's call, not this file's.
 *
 * Worth keeping exactly as written: GPC and DNT are checked before the script
 * element exists, `suppressed` starts true so an early call fails closed, the
 * prod-host gate keeps previews out of the live ad account, internal browsers
 * never load gtag.js at all, and the conversion really does send nothing but
 * `send_to`.
 */

/** Google Ads account tag id ("Google tag" / gtag.js). Public, not a secret. */
const TAG_ID = "AW-18380696275";

const SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${TAG_ID}`;

/** gtag's call shape: a command name followed by command-specific arguments. */
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/**
 * Starts TRUE so a call arriving before initGoogleTag fails closed — an event
 * we never sent costs nothing, an event we should not have sent cannot be
 * undone. Kept live by the /internal toggle via setGoogleSuppressed.
 */
let suppressed = true;
let started = false;

/**
 * Honour the same browser-level signals PostHog does. Checked BEFORE the script
 * tag is created, because loading gtag.js at all is itself the thing a DNT/GPC
 * user is asking us not to do: the request carries their IP and referrer to
 * Google before a single event fires.
 */
function browserOptedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl === true) return true;
  // `window.doNotTrack` is the legacy spelling — gone from lib.dom, but still
  // the only one some older WebKit builds set, and a DNT signal we fail to read
  // is a DNT signal we ignore.
  const legacy = (window as Window & { doNotTrack?: string }).doNotTrack;
  return nav.doNotTrack === "1" || legacy === "1";
}

/** Install Google's base snippet: the dataLayer, the gtag stub, and the loader. */
function installTag(): void {
  const dataLayer = (window.dataLayer = window.dataLayer ?? []);

  // Verbatim to Google's base snippet: gtag() forwards its live `arguments`
  // object onto dataLayer — the exact shape gtag.js reads back. A copied array
  // is not guaranteed equivalent, so the arguments object stays.
  const gtag: Gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
  window.gtag = gtag;

  gtag("js", new Date());
  // `config` with no options object inherits every Google default, including
  // conversion_linker and ad personalization signals. conversion_linker writes
  // the `_gcl_au` cookie (about 90 days) to hold click identifiers. /privacy
  // enumerates browser storage exhaustively, "four things", three ours and one
  // PostHog's, so `_gcl_au` is an undisclosed fifth and the count is wrong
  // rather than merely incomplete. Fix is an options object here with
  // conversion_linker false, at a real cost to attribution accuracy. Not
  // applied.
  gtag("config", TAG_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = SCRIPT_SRC;
  document.head.appendChild(script);
}

/**
 * Boot the Google tag.
 *
 * `enabled` gates it to the production host (passed from
 * instrumentation-client.ts, the same guard PostHog and the pixel use), so a
 * preview deploy or a localhost run cannot fire conversions into the live ad
 * account. Dormant with `enabled: false`, which is the correct state for any
 * non-prod host and any fork not running the ad account.
 */
export function initGoogleTag(opts: {
  enabled: boolean;
  isInternal: boolean;
}): void {
  if (started || typeof window === "undefined") return;
  if (!opts.enabled) return;
  if (browserOptedOut()) return;

  started = true;
  suppressed = opts.isInternal;

  // An internal browser must not even LOAD gtag.js: the request and the base
  // `config` hit are themselves conversion signals to the live ad account, and
  // Google has no "tag it and filter later" the way PostHog does. A mid-session
  // /internal -> external toggle takes effect on the next reload, which boots
  // the tag cleanly.
  if (suppressed) return;

  try {
    installTag();
  } catch {
    // A tracker must never take the page down with it (Next.js
    // instrumentation-client guidance: wrap side-effects). Roll `started` back
    // so a later attempt can retry rather than silently stay dead.
    started = false;
  }
}

/**
 * Follow the /internal toggle mid-session. Called from markInternalUser /
 * clearInternalUser in ./events.ts, which owns the durable flag; this module
 * only mirrors it, so the dependency runs one way and there is no import cycle.
 */
export function setGoogleSuppressed(value: boolean): void {
  suppressed = value;
}

/**
 * PAID FUNNEL: fire the Google Ads conversion at form completion — the email
 * gate (trackTestEmailSubmitted). Uses the account-level `send_to`, the one tag
 * with no per-action label.
 *
 * No-op when the tag never loaded (non-prod host, browser opt-out, or an
 * internal browser) or while suppressed, so it is always safe to call from the
 * event seam unconditionally.
 */
export function gtagTrackFormCompletion(): void {
  if (suppressed || !started || typeof window === "undefined") return;
  // The payload really is `send_to` and nothing else: no email, no hash, no
  // user_data. What this repo cannot enforce is that it stays that way.
  // Enhanced conversions is an Ads console setting, and with automatic
  // collection gtag scrapes the DOM for email inputs. This fires at the email
  // gate, so the address is on screen at exactly this moment. Switching it on
  // changes no line here and passes no code review. Fix is to confirm it is off
  // in the Ads account and keep it off, which is not checkable from here.
  window.gtag?.("event", "conversion", { send_to: TAG_ID });
}
