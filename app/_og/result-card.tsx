import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import type { VerdictId } from "@/lib/test/scoring";
import { VERDICT_INK } from "@/lib/test/types";

/*
  Per-result share art, in the two shapes a result actually travels in.

  ===========================================================================
  WHY TWO SIZES AND NOT ONE
  ===========================================================================
  They are not the same job.

    STORY CARD, 1080x1920. The primary artefact. Traffic comes from TikTok and
    Instagram, where a link is barely a link: not tappable in feed, and not in
    a Story without a swipe-up nobody has. What actually travels on those
    surfaces is an IMAGE, so this is the thing the share button hands over —
    saved to the camera roll, posted to a Story, screenshotted onward.

    OG CARD, 1200x630. The link preview for everywhere a URL does work:
    Reddit, X, Discord, iMessage. Wide, because that is the aspect every
    unfurler crops to.

  Same render module for both so a verdict cannot look like one product in a
  Story and a different one in a Discord embed. The layout differs; the
  palette, the type and the verdict colours do not.

  ===========================================================================
  THE STORY CARD RESPECTS THE STORIES SAFE AREA
  ===========================================================================
  Instagram and TikTok both paint their own chrome over a full-bleed story —
  the avatar and close button at the top, the reply bar and CTA at the bottom.
  Roughly the first and last 250px of a 1920px canvas are not yours. Nothing
  that carries meaning is placed there, so the score and the verdict survive
  being posted without the app cropping the point off.

  ===========================================================================
  IT REUSES app/_og/card.tsx's MACHINERY, DELIBERATELY
  ===========================================================================
  Same `next/og` ImageResponse, same three font files read off disk on the
  Node runtime, same neo-brutalist vocabulary. No new dependency: Satori is
  already here for the brand card, and a second image pipeline for the sake of
  a second image would be two things to keep looking alike.
*/

export const storySize = { width: 1080, height: 1920 };
export const ogSize = { width: 1200, height: 630 };
export const contentType = "image/png";

const anton = readFileSync(join(process.cwd(), "app/_fonts/Anton-Regular.ttf"));
const dmSans700 = readFileSync(join(process.cwd(), "app/_fonts/DMSans-700.woff"));
const dmSans500 = readFileSync(join(process.cwd(), "app/_fonts/DMSans-500.woff"));

const fonts = [
  { name: "Anton", data: anton, weight: 400 as const, style: "normal" as const },
  { name: "DM Sans", data: dmSans700, weight: 700 as const, style: "normal" as const },
  { name: "DM Sans", data: dmSans500, weight: 500 as const, style: "normal" as const },
];

const INK = "#000000";
const YELLOW = "#fce552";
const BLUE = "#839aff";
const CORAL = "#fd7962";
const MINT = "#c6fcd0";
const PAPER = "#ffffff";

/**
 * The verdict stickers are ~500KB each and only one is ever needed per render,
 * so they are read on first use rather than both at module load. Memoised
 * because a warm lambda renders many cards and the file does not change.
 */
const imageCache = new Map<string, string>();
function dataUri(publicPath: string): string {
  const hit = imageCache.get(publicPath);
  if (hit) return hit;
  const encoded = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public", publicPath),
  ).toString("base64")}`;
  imageCache.set(publicPath, encoded);
  return encoded;
}

/** Intrinsic pixel sizes, so each sticker keeps its own aspect ratio. */
const BADGE: Record<string, { file: string; width: number; height: number }> = {
  "smart-fella": { file: "certified-smart-fella.png", width: 560, height: 651 },
  "fart-smella": { file: "certified-fart-smella.png", width: 546, height: 592 },
};

export interface ResultCardData {
  score: number;
  max: number;
  verdictId: VerdictId;
  verdictTitle: string;
}

/** Alt text for both shapes. Says the outcome, because that is the content. */
export function resultCardAlt({ score, max, verdictTitle }: ResultCardData): string {
  return `${verdictTitle}. Scored ${score} out of ${max} on the Official Smart Fella Test.`;
}

/** The faint grid the brand card uses, as its own element on both layouts. */
function Grid({ cell }: { cell: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        backgroundImage:
          "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
        backgroundSize: `${cell}px ${cell}px`,
        opacity: 0.07,
      }}
    />
  );
}

/* -------------------------------------------------------------------------
 * 1080x1920 — the one people post
 * ----------------------------------------------------------------------- */

export function renderResultStoryCard(data: ResultCardData) {
  const { score, max, verdictId, verdictTitle } = data;
  const badge = BADGE[verdictId];
  const verdictColor = VERDICT_INK[verdictId] ?? INK;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: YELLOW,
          fontFamily: "Anton",
          position: "relative",
          overflow: "hidden",
          // The Stories safe area, as real padding rather than a guideline.
          padding: "260px 70px",
        }}
      >
        <Grid cell={72} />

        {/* Brutalist furniture, parked in the corners the chrome already owns
            so it decorates the dead space instead of competing with the score. */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -110,
            width: 420,
            height: 420,
            borderRadius: 999,
            backgroundColor: BLUE,
            border: `10px solid ${INK}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 120,
            right: -90,
            width: 250,
            height: 250,
            borderRadius: 60,
            backgroundColor: CORAL,
            border: `10px solid ${INK}`,
            transform: "rotate(-12deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -130,
            right: -80,
            width: 380,
            height: 380,
            borderRadius: 999,
            backgroundColor: MINT,
            border: `10px solid ${INK}`,
          }}
        />

        {/* -- content ----------------------------------------------------
            `flexGrow` rather than `height: "100%"`: a percentage height on a
            flex child does not resolve against a padded parent in Satori, and
            the whole group silently collapsed to its natural height and sat at
            the top of the canvas. Growing into the space and centring in it is
            what puts the score in the middle of the safe band. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            width: "100%",
            gap: 44,
          }}
        >
          {/* Who this is from. Small: the score is the headline, not us. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: INK,
              color: YELLOW,
              borderRadius: 999,
              padding: "16px 40px",
              fontSize: 30,
              letterSpacing: 3,
              lineHeight: 1,
            }}
          >
            THE OFFICIAL SMART FELLA TEST
          </div>

          {/* THE VERDICT FIRST, THE NUMBER SECOND, matching the order of the
              results screen (components/test/results-view.tsx). Somebody posts
              this image having just looked at that screen, and the two
              disagreeing about which comes first reads as a different product.

              Each sticker spells out its own words, so no heading is set next
              to it. */}
          {badge ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dataUri(badge.file)}
              width={520}
              height={Math.round((520 / badge.width) * badge.height)}
              alt=""
            />
          ) : (
            <div
              style={{
                fontSize: 96,
                lineHeight: 1,
                color: verdictColor,
                textAlign: "center",
              }}
            >
              {verdictTitle.toUpperCase()}
            </div>
          )}

          {/* The number, in the biggest box on the card. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: PAPER,
              border: `10px solid ${INK}`,
              borderRadius: 48,
              boxShadow: `20px 20px 0 ${INK}`,
              padding: "34px 76px 48px",
            }}
          >
            <div
              style={{
                fontFamily: "DM Sans",
                fontWeight: 700,
                fontSize: 32,
                letterSpacing: 4,
                color: INK,
                opacity: 0.55,
              }}
            >
              I SCORED
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontSize: 260,
                lineHeight: 1,
                color: INK,
              }}
            >
              {score}
              <span style={{ fontSize: 150, opacity: 0.35 }}>/{max}</span>
            </div>
          </div>
        

          {/* The invitation, which is the entire reason this image exists. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: PAPER,
                color: INK,
                border: `10px solid ${INK}`,
                borderRadius: 999,
                boxShadow: `14px 14px 0 ${INK}`,
                padding: "22px 56px",
                fontSize: 62,
                lineHeight: 1,
                letterSpacing: 1,
              }}
            >
              CAN YOU BEAT IT?
            </div>
            <div
              style={{
                fontFamily: "DM Sans",
                fontWeight: 700,
                fontSize: 34,
                letterSpacing: 2,
                color: INK,
                marginTop: 34,
              }}
            >
              SMARTFELLAORFARTSMELLA.COM
            </div>
          </div>
        </div>
      </div>
    ),
    { ...storySize, fonts },
  );
}

/* -------------------------------------------------------------------------
 * 1200x630 — the link preview
 * ----------------------------------------------------------------------- */

export function renderResultOgCard(data: ResultCardData) {
  const { score, max, verdictId, verdictTitle } = data;
  const badge = BADGE[verdictId];
  const verdictColor = VERDICT_INK[verdictId] ?? INK;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: YELLOW,
          fontFamily: "Anton",
          position: "relative",
          overflow: "hidden",
          padding: "0 64px",
        }}
      >
        <Grid cell={48} />

        {/* Corner accents only. Everything here is parked outside the band the
            text and the sticker occupy, so nothing decorative lands behind a
            number somebody is trying to read. */}
        <div
          style={{
            position: "absolute",
            top: -140,
            left: -90,
            width: 260,
            height: 260,
            borderRadius: 999,
            backgroundColor: BLUE,
            border: `6px solid ${INK}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -60,
            right: 90,
            width: 140,
            height: 140,
            borderRadius: 36,
            backgroundColor: CORAL,
            border: `6px solid ${INK}`,
            transform: "rotate(-12deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -130,
            left: 250,
            width: 230,
            height: 230,
            borderRadius: 999,
            backgroundColor: MINT,
            border: `6px solid ${INK}`,
          }}
        />

        {/* Text left, sticker right, CENTRED AS A PAIR. `space-between` pinned
            them to opposite edges and left a wide hole down the middle of a
            card that is mostly read at thumbnail size. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              maxWidth: 620,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: INK,
                color: YELLOW,
                borderRadius: 999,
                padding: "10px 24px",
                fontSize: 22,
                letterSpacing: 2,
                lineHeight: 1,
              }}
            >
              THE OFFICIAL SMART FELLA TEST
            </div>

            {/* Verdict above score here too, for the same reason as the story
                card: one order across every surface a result appears on. */}
            <div
              style={{
                fontSize: 54,
                lineHeight: 1.02,
                color: verdictColor,
                marginTop: 22,
              }}
            >
              {verdictTitle.toUpperCase()}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontSize: 150,
                lineHeight: 1,
                color: INK,
                marginTop: 4,
              }}
            >
              {score}
              <span style={{ fontSize: 88, opacity: 0.35 }}>/{max}</span>
            </div>

            <div
              style={{
                fontFamily: "DM Sans",
                fontWeight: 700,
                fontSize: 30,
                color: INK,
                marginTop: 22,
              }}
            >
              Can you beat it?
            </div>
          </div>

          {badge ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dataUri(badge.file)}
              width={330}
              height={Math.round((330 / badge.width) * badge.height)}
              alt=""
            />
          ) : null}
        </div>
      </div>
    ),
    { ...ogSize, fonts },
  );
}
