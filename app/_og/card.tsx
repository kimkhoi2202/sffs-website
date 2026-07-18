import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/*
  Shared render for the social share / link-preview card (opengraph-image +
  twitter-image). A 1200×630 hero-style card: yellow field with a faint grid,
  brutalist corner shapes, the brain logo, the "ARE YOU A / SMART FELLA / OR /
  FART SMELLA?" headline in Anton with hard offset shadows, and a DM Sans
  tagline. Runs on the Node runtime so it can read the bundled font + logo files
  straight off disk at build time.
*/

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt =
  "Smart Fella or Fart Smella? — take the brutally honest 60-second Fella Test.";

// Literal, statically-scoped paths (read once at build time on the Node runtime).
const anton = readFileSync(join(process.cwd(), "app/_fonts/Anton-Regular.ttf"));
const dmSans700 = readFileSync(join(process.cwd(), "app/_fonts/DMSans-700.woff"));
const dmSans500 = readFileSync(join(process.cwd(), "app/_fonts/DMSans-500.woff"));
const logoSrc = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/logo.png"),
).toString("base64")}`;

const INK = "#000000";
const YELLOW = "#fce552";
const BLUE = "#839aff";
const CORAL = "#fd7962";
const MINT = "#c6fcd0";
const PAPER = "#ffffff";
const HARD = "6px 6px 0 #000";

export function renderFellaOgImage() {
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
        }}
      >
        {/* faint grid hint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.07,
          }}
        />

        {/* brutalist corner shapes (painted before content = behind) */}
        <div
          style={{
            position: "absolute",
            top: -70,
            left: -60,
            width: 260,
            height: 260,
            borderRadius: 999,
            backgroundColor: BLUE,
            border: `6px solid ${INK}`,
            boxShadow: "12px 12px 0 #000",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -46,
            right: 96,
            width: 150,
            height: 150,
            borderRadius: 40,
            backgroundColor: CORAL,
            border: `6px solid ${INK}`,
            boxShadow: "10px 10px 0 #000",
            transform: "rotate(-10deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -84,
            left: 70,
            width: 220,
            height: 220,
            borderRadius: 999,
            backgroundColor: MINT,
            border: `6px solid ${INK}`,
            boxShadow: "12px 12px 0 #000",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 54,
            right: -56,
            width: 220,
            height: 96,
            borderRadius: 999,
            backgroundColor: PAPER,
            border: `6px solid ${INK}`,
            boxShadow: "10px 10px 0 #000",
            transform: "rotate(8deg)",
          }}
        />

        {/* content — comes after the absolute shapes in DOM, so it paints on top */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={116} height={86} alt="" style={{ marginBottom: 14 }} />

          <div
            style={{
              fontSize: 46,
              color: INK,
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            ARE YOU A
          </div>

          <div
            style={{
              fontSize: 116,
              color: BLUE,
              lineHeight: 0.92,
              textShadow: HARD,
              marginTop: 8,
            }}
          >
            SMART FELLA
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: PAPER,
              color: INK,
              border: `4px solid ${INK}`,
              borderRadius: 999,
              padding: "2px 26px",
              fontSize: 40,
              lineHeight: 1,
              boxShadow: "4px 4px 0 #000",
              margin: "12px 0",
            }}
          >
            OR
          </div>

          <div
            style={{
              fontSize: 116,
              color: CORAL,
              lineHeight: 0.92,
              textShadow: HARD,
            }}
          >
            FART SMELLA?
          </div>

          <div
            style={{
              fontFamily: "DM Sans",
              fontWeight: 700,
              fontSize: 28,
              color: INK,
              marginTop: 26,
            }}
          >
            The brutally honest 60-second Fella diagnostic.
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Anton", data: anton, weight: 400, style: "normal" },
        { name: "DM Sans", data: dmSans700, weight: 700, style: "normal" },
        { name: "DM Sans", data: dmSans500, weight: 500, style: "normal" },
      ],
    },
  );
}
