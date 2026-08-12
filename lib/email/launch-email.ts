/**
 * The launch announcement. DRAFT: nothing sends this yet.
 *
 * ===========================================================================
 * THIS IS NOT A RESULTS EMAIL, AND THE DIFFERENCE IS LEGAL, NOT STYLISTIC
 * ===========================================================================
 * lib/test/results-email.ts is transactional: somebody asked for a specific
 * thing and it delivers exactly that, once, which is why it carries no
 * unsubscribe footer and no postal address. The note at the top of that file
 * says, in as many words, that the moment a message carries an app pitch it
 * stops being transactional and both have to come back.
 *
 * This is that message. So it has both, and lib/email/product-email.ts refuses
 * to send it if either is missing from the rendered body.
 *
 * ===========================================================================
 * THE LAYOUT IS DELIBERATELY THE RESULTS EMAIL'S
 * ===========================================================================
 * Same yellow field, same flattened logo, same white card with a 3px ink border
 * and a hard shadow where the client allows one, same green button. Somebody
 * who got their results in August should recognise this as the same product
 * before they have read a word, because the alternative is an unexpected email
 * about an app they have to work out the provenance of.
 *
 * The constraints are the results email's too, and the reasoning is all in that
 * file rather than repeated here: no web fonts, no flexbox or grid, no CSS
 * variables, everything inline, tables for layout, and a real plain-text
 * alternative rather than a stripped copy.
 *
 * ===========================================================================
 * WHAT THE COPY MAY NOT DO
 * ===========================================================================
 * video/brand/brand-voice.md 3.1 forbids product and outcome claims outright:
 * nothing may say the app makes anybody smarter, sharper, better at school, or
 * anything else about what it does FOR the reader. The tell is whether the
 * sentence would still be true if the app did not exist. Puffery about a PUZZLE
 * is fine; there are no puzzles in here, so there is no puffery in here either.
 *
 * House rules that also apply: no em dashes, kid-safe language, at most one
 * emoji, warm rather than corporate.
 */
import { CANONICAL_ORIGIN } from "@/lib/site-url";
import { POSTAL_ADDRESS } from "./product-email";

/** The live listing. */
export const APP_STORE_URL =
  "https://apps.apple.com/us/app/smart-fella-or-fart-smella/id6794045991";

const LOGO_ORIGIN = CANONICAL_ORIGIN;

const INK = "#000000";
const PAPER = "#ffffff";
const YELLOW = "#fce552";
const GREEN = "#63c088";

const DISPLAY_FONT =
  "'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * A: THE ANNOUNCEMENT. Leads with the thing that happened.
 * B: THE ASK. Leads with wanting their verdict, and mentions the app second.
 *
 * They are not two tones of the same email. They make a different opening
 * claim on the reader's attention, which is the only part of an email most
 * people ever read.
 */
export type LaunchVariant = "a" | "b";

export interface LaunchEmailInput {
  variant: LaunchVariant;
  /** Absolute, per-recipient. Required: the footer will not render without it. */
  unsubscribeUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface Copy {
  subject: string;
  /** The grey line an inbox shows next to the subject. */
  preheader: string;
  headline: string;
  paragraphs: string[];
  cta: string;
  /** The beat after the button. This is where the feedback ask lands. */
  closing: string[];
}

const COPY: Record<LaunchVariant, Copy> = {
  /*
    VARIANT A. The news first.

    "We made the rest of it" is doing the work: it ties the app to the one
    thing this reader actually did, which was sit the test. An announcement
    that opens with the product rather than with their connection to it reads
    like a mailing list they do not remember joining, which for most of this
    audience would be a fair description.
  */
  a: {
    subject: "We turned the test into a whole app",
    preheader: "It is on the App Store today, and we want your verdict.",
    headline: "The app is out",
    paragraphs: [
      "You sat the Official Smart Fella Test. We went and built the rest of it.",
      "Smart Fella or Fart Smella is on the App Store now. Quick logic, memory, focus and word games. Same stupid name, a lot more to do.",
    ],
    cta: "Get the app",
    closing: [
      "One favour, and it is the reason we are writing. We are still building this out, and we would much rather hear from someone who has actually played it than guess.",
      "Have a go, then hit reply and tell us what you think. Brutally honest is fine. We named the whole thing after being called a fart smella, so we can take it.",
    ],
  },
  /*
    VARIANT B. The ask first.

    Opens by asking for something rather than announcing something, which is
    both the more honest description of why this email exists and the better
    match for the relationship: this reader took a free test, they did not sign
    up for product news. It also gives the send a purpose the recipient can
    act on in ten seconds, which an announcement does not.
  */
  b: {
    subject: "Would you tell us what you think?",
    preheader: "We built the app. You are the person we want to hear from.",
    headline: "We want your verdict",
    paragraphs: [
      "You sat the Official Smart Fella Test, which makes you exactly the person we want to hear from.",
      "We turned it into an app. It is on the App Store now, with quick logic, memory, focus and word games in it.",
    ],
    cta: "Try it and tell us",
    closing: [
      "We are still building this out, and what you say shapes what goes in next. Play a couple of rounds, then hit reply and tell us what you actually think.",
      "Good, bad, or a thing you wish it did. Brutally honest is fine. We named the whole thing after being called a fart smella, so we can take it.",
    ],
  },
};

export function renderLaunchEmail(input: LaunchEmailInput): RenderedEmail {
  const copy = COPY[input.variant];
  const { unsubscribeUrl } = input;

  const bodyParagraphs = copy.paragraphs
    .map(
      (text) =>
        `<tr><td style="padding:0 24px 16px 24px;font-family:${BODY_FONT};font-size:16px;line-height:1.5;color:${INK};">${escapeHtml(text)}</td></tr>`,
    )
    .join("\n        ");

  const closingParagraphs = copy.closing
    .map(
      (text) =>
        `<tr><td style="padding:0 24px 16px 24px;font-family:${BODY_FONT};font-size:15px;line-height:1.55;color:${INK};">${escapeHtml(text)}</td></tr>`,
    )
    .join("\n        ");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!--
  DARK MODE IS THE REAL RISK FOR THIS BRAND, NOT A POLISH ITEM.

  The look is near-black ink and hard black shadows on cream and yellow. A
  client that "helpfully" inverts it produces black-on-black: the borders, the
  shadows and the text all disappear together, because they are all the same
  ink. This is the same failure the transparent slide assets hit on a dark
  ground, and the same cause.

  Three defences, in the order clients honour them:

    1. color-scheme: light only    Apple Mail, iOS Mail and Outlook for Mac
                                   read this and leave the message alone. It is
                                   the single highest-value line here.
    2. supported-color-schemes     The older spelling, still what some Apple
                                   builds look for. Cheap, so both ship.
    3. EXPLICIT BACKGROUNDS ON EVERY CELL, below. Gmail's dark mode ignores
       both meta tags and recolours anything it thinks is unset. A td with a
       stated background-color is left alone; a td relying on inheritance is
       fair game. That is why no cell in this template is transparent.

  The LOGO needs no defence and that is not luck: scripts/build-email-logo.mjs
  flattens it onto the header's own yellow, so it is an opaque rectangle rather
  than a transparent PNG. An inverting client has nothing to invert. Any image
  added here later must be flattened the same way.
-->
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(copy.subject)}</title>
<style>
  :root { color-scheme: light only; supported-color-schemes: light; }
  /*
    Outlook on Windows renders through Word and ignores max-width on tables, so
    the card would run the full window width on a maximised desktop client.
    This conditional caps it. Everything else here is inline, because Word also
    drops most of a <style> block.
  */
  @media only screen and (max-width: 480px) {
    .sffs-card { width: 100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${YELLOW};">
<!-- Preheader: hidden in the body, shown by the inbox next to the subject. -->
<span style="display:none;font-size:1px;color:${YELLOW};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(copy.preheader)}</span>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${YELLOW};">
<tr><td align="center" style="padding:28px 16px;">

    <table role="presentation" class="sffs-card" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

    <!-- The same flattened logo the results email uses, for the same reasons:
         one image with the overlap baked in, absolute URL, alt text styled so a
         blocked image still reads as the brand, and width/height on the tag so
         the box is reserved before it loads. -->
    <tr><td align="center" style="padding-bottom:18px;">
      <!--
        NO FIXED HEIGHT, WHICH IS THE ONE PLACE THIS DIVERGES FROM THE RESULTS
        EMAIL. That template pins width AND height so the box is reserved and
        the button underneath cannot reflow as the image loads. Correct there.

        Here it looked broken. With images blocked, a reserved 176px box holds
        a 176px void of yellow above the card with two words of alt text
        floating at the top of it, and images-off is not an edge case for a
        promotional send: a good share of recipients will never see this image.
        Dropping the height lets the box collapse to the alt text, so the
        blocked state reads as a wordmark rather than as a failed asset. The
        cost is a small reflow on load, which is the cheaper of the two.
      -->
      <img src="${escapeAttr(`${LOGO_ORIGIN}/email-logo.png`)}"
           alt="Smart Fella or Fart Smella"
           width="230"
           style="display:block;width:230px;height:auto;max-width:100%;border:0;outline:none;text-decoration:none;font-family:${BODY_FONT};font-size:15px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${INK};">
    </td></tr>

    <tr><td style="background-color:${PAPER};border:3px solid ${INK};box-shadow:6px 6px 0 0 ${INK};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

        <tr><td style="padding:28px 24px 14px 24px;font-family:${DISPLAY_FONT};font-size:30px;line-height:1.05;letter-spacing:-0.5px;text-transform:uppercase;color:${INK};">
          ${escapeHtml(copy.headline)}
        </td></tr>

        ${bodyParagraphs}

        <!-- ONE button, and it is a real link so it works with images off. -->
        <tr><td align="center" style="padding:8px 24px 24px 24px;">
          <a href="${escapeAttr(APP_STORE_URL)}"
             style="display:inline-block;background-color:${GREEN};border:3px solid ${INK};box-shadow:4px 4px 0 0 ${INK};color:${INK};font-family:${BODY_FONT};font-size:16px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;text-decoration:none;padding:16px 30px;">
            ${escapeHtml(copy.cta)}
          </a>
        </td></tr>

        ${closingParagraphs}

        <tr><td style="padding:0 24px 26px 24px;font-family:${BODY_FONT};font-size:12px;line-height:1.6;color:#5a5a5a;word-break:break-all;">
          Button not working? Paste this in:<br>
          <a href="${escapeAttr(APP_STORE_URL)}" style="color:#5a5a5a;">${escapeHtml(APP_STORE_URL)}</a>
        </td></tr>

      </table>
    </td></tr>

    <!--
      THE FOOTER THAT MAKES THIS LEGAL TO SEND.

      A promotional message needs a working opt-out and a physical postal
      address (CAN-SPAM 16 CFR 316). The results email has neither and does not
      need them, because it is transactional. This one is not, so both are here,
      and lib/email/product-email.ts refuses to send a body missing either.

      The unsubscribe is a plain visible link rather than the grey four-point
      apology most senders use: somebody who wants out should find it in one
      look, and burying it only trains people to hit the spam button instead,
      which costs far more than an unsubscribe does.
    -->
    <tr><td style="padding:20px 8px 0 8px;font-family:${BODY_FONT};font-size:12px;line-height:1.7;color:${INK};text-align:center;">
      You are getting this because you gave us this address on smartfellaorfartsmella.com.<br>
      <a href="${escapeAttr(unsubscribeUrl)}" style="color:${INK};font-weight:bold;">Unsubscribe</a>
      and we will stop, no questions asked.<br>
      <span style="color:#5a5a5a;">${escapeHtml(POSTAL_ADDRESS)}</span>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;

  const text = [
    "SMART FELLA OR FART SMELLA",
    "",
    copy.headline.toUpperCase(),
    "",
    ...copy.paragraphs.flatMap((p) => [p, ""]),
    `${copy.cta.toUpperCase()}: ${APP_STORE_URL}`,
    "",
    ...copy.closing.flatMap((p) => [p, ""]),
    "---",
    "You are getting this because you gave us this address on smartfellaorfartsmella.com.",
    `Unsubscribe: ${unsubscribeUrl}`,
    POSTAL_ADDRESS,
  ].join("\n");

  return { subject: copy.subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
