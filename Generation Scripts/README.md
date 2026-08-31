# Launch email game images

This folder makes the game showcase used by the Smart Fella launch email reproducible. It exists so another agent can replace a game, retake a screenshot, or adjust the crop without editing the final JPEG by hand.

## File mapping

- `Raw Captures/block-blast.png` is the live free game named Explosive Block in the app. The build script stages several in-progress tiles in its grid because the Skia board does not accept automated Simulator pan gestures.
- `Raw Captures/grid-lock.png` is the live free Memory game.
- `Raw Captures/word-burst.png` is the live free Word game, staged with `ORANGE` selected.
- `build-email-game-showcase.mjs` crops and combines those captures.
- `../public/email/app-games/free-games-showcase.jpg` is the generated asset loaded by `../lib/email/launch-email.ts`.

## Rebuild

From the website project root:

```sh
node "Generation Scripts/build-email-game-showcase.mjs"
node --import ./scripts/ts-resolve-hook.mjs scripts/render-launch-drafts.mjs "/tmp/sffs-launch-drafts"
```

The script expects Homebrew FFmpeg at `/opt/homebrew/bin/ffmpeg`. Category labels remain live HTML below the image in the email, so they stay sharp and readable on narrow screens.

## Retake a game

Open the unlocked game in the booted iOS Simulator and put it in a visually meaningful state. Then capture the device screen without the Simulator window chrome:

```sh
xcrun simctl io booted screenshot "Generation Scripts/Raw Captures/block-blast.png"
```

Use the matching filename for the game being replaced, rebuild the showcase, render the email drafts, and inspect both the image-loaded and image-blocked states. The showcase order is Explosive Block, Memory, Words. All three screenshots intentionally focus on free games, and the final composite has an opaque background for more predictable email dark-mode behavior.
