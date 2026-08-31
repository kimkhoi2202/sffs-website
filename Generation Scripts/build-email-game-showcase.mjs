/**
 * Build the lightweight, three-game image used by the launch email.
 *
 * The source captures come directly from the iOS Simulator. We crop away the
 * simulator-only status area, scale each screen once, and place the three
 * games on the same opaque yellow used by the email. The opaque background is
 * intentional: dark-mode email clients cannot invert transparency that is not
 * there.
 */
import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const project = dirname(here);
const captures = join(here, "Raw Captures");
const output = join(project, "public", "email", "app-games", "free-games-showcase.jpg");
mkdirSync(dirname(output), { recursive: true });

const inputs = ["block-blast.png", "grid-lock.png", "word-burst.png"].flatMap((name) => [
  "-i",
  join(captures, name),
]);

const filter = [
  "color=c=0xfce552:s=1040x661[bg]",
  "[0:v]crop=1206:2340:0:180,scale=320:621:flags=lanczos[g0]",
  "[1:v]crop=1206:2340:0:180,scale=320:621:flags=lanczos[g1]",
  "[2:v]crop=1206:2340:0:180,scale=320:621:flags=lanczos[g2]",
  "[bg][g0]overlay=20:20[b1]",
  "[b1][g1]overlay=360:20[b2]",
  "[b2][g2]overlay=700:20[base]",
  // Stage a plausible in-progress Explosive Block board using the game's own
  // black-outline palette. The Simulator build does not accept automated pan
  // gestures for this Skia board, so keeping these tiles here makes the email
  // capture reproducible rather than requiring a hand-edited JPEG.
  "[base]" +
    [
      [37, 423, "0x63c088"], [73, 423, "0x63c088"], [109, 423, "0x63c088"], [73, 387, "0x63c088"],
      [289, 423, "0xfce552"], [289, 387, "0xfce552"], [289, 351, "0xfce552"], [289, 315, "0xfce552"],
      [181, 387, "0xbdf4c9"], [217, 351, "0xbdf4c9"],
    ].flatMap(([x, y, color]) => [
      `drawbox=x=${x}:y=${y}:w=32:h=32:color=black:t=fill`,
      `drawbox=x=${x + 3}:y=${y + 3}:w=26:h=26:color=${color}:t=fill`,
    ]).join(",") + "[out]",
].join(";");

const result = spawnSync(
  "/opt/homebrew/bin/ffmpeg",
  ["-y", ...inputs, "-filter_complex", filter, "-map", "[out]", "-frames:v", "1", "-q:v", "3", output],
  { stdio: "inherit" },
);

if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Built ${output}`);
