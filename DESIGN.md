# DESIGN.md — Brand & Content Design System (Video / Thumbnail Edition)

A production guide for making **YouTube videos, thumbnails, channel art, and every other brand
asset** in the neo-brutalist "Closer" style (the same system that powers this website). It
restates the web design tokens and, crucially, **scales them to video/thumbnail pixels** and adds
YouTube-specific specs, recipes, and tooling setup.

> Source of truth for the *web* values: `design-reference/design-tokens.md` and `app/globals.css`.
> This doc is the source of truth for *content/video* assets. When in doubt, keep the four
> signatures (below) and you'll be on-brand.

---

## 0. The style in one breath

**Neo-brutalist, playful-bold sales-education energy.** Big condensed UPPERCASE headlines, thick
pure-black outlines, hard offset shadows with *zero blur*, bright pastel color-blocks stacked like
a sticker sheet, everything rounded into pills and chunky cards. Confident, fun, high-contrast,
never corporate-minimal.

### The 4 non-negotiable signatures
1. **Thick pure-black outlines** on every "object" (cards, buttons, pills, photo frames, stickers).
2. **Hard offset drop-shadows — ZERO blur** (a solid black shape offset down-right). This is the #1 signature.
3. **Anton, UPPERCASE, tight** for display type; **DM Sans** for everything else.
4. **Bright color-blocking** — bold flat fills (blue / mint / coral / yellow) on black, white, or cream.

If an asset has these four, it's on-brand. If it has soft/blurry shadows, thin gray borders,
gradients, or thin/script fonts, it's off-brand.

---

## 1. Brand personality & voice

| Trait | Means (visual) | Means (copy) |
|---|---|---|
| Bold | Oversized Anton, heavy outlines, saturated blocks | Short, verb-first claims |
| Tactical | Concrete numbers, checklists, stat cards | "Book more meetings", not "synergize" |
| Playful | Rotated stickers, press/pop motion, pill shapes | A little swagger, zero fluff |
| Trustworthy | High contrast, clean grid, consistent system | Specific, honest, no hype adjectives |

**Voice for titles/thumbs:** punchy, benefit-led, 3–6 words. Favor a single bold claim or number.
Examples of the *shape* (write your own): "STOP GETTING GHOSTED", "9 MEETINGS IN A WEEK",
"THE COLD CALL THAT ALWAYS WORKS".

---

## 2. Color system

### Core palette (sRGB — use these exact hexes everywhere)

| Role | Name | HEX | RGB | Use |
|---|---|---|---|---|
| Ink | Black | `#000000` | 0,0,0 | Text, ALL borders, ALL shadows, dark backgrounds |
| Paper | White | `#FFFFFF` | 255,255,255 | Base surface, text on dark, cards |
| Accent 1 | Periwinkle blue | `#839AFF` | 131,154,255 | Primary accent, blocks, buttons |
| Accent 2 | Mint | `#C6FCD0` | 198,252,208 | Accent, highlights, blocks |
| Accent 3 | Coral | `#FD7962` | 253,121,98 | Emphasis/alert accent, blocks, buttons |
| Accent 4 | Yellow | `#FCE552` | 252,229,82 | Highlights, badges, blocks (great for thumbnail text) |
| Neutral | Cream | `#F6F4EE` | 246,244,238 | Soft off-white surface |
| Gray 100 | | `#EBEBEB` | dividers on light |
| Gray 400 | | `#A5A5A5` | disabled |
| Gray 600 | | `#7A7A7A` | muted text (min for AA on white) |

**Accent set = {blue, mint, coral, yellow}.** Bases = {ink, paper, cream}.

### Color rules (critical for legibility at small sizes)
- **Text is `ink` (black) on every bright accent and on paper/cream.** Text is `paper` (white) only on `ink`.
- **Never** put gray or low-opacity text on a colored block. Full black or full white only.
- **One dominant accent per frame.** Pick a background block color, then use *one* other accent for the sticker/highlight. Two accents max per thumbnail.
- Borders and shadows are **always pure black `#000`** (never colored, unless deliberately using a colored hard-shadow as a special effect).

### Ready-made high-contrast combos (background → text → accent sticker)
| Background | Headline text | Accent/sticker |
|---|---|---|
| Yellow `#FCE552` | Ink | Coral |
| Blue `#839AFF` | Ink | Yellow |
| Coral `#FD7962` | Ink | Yellow or Paper |
| Mint `#C6FCD0` | Ink | Coral |
| Ink `#000000` | Paper | Yellow (pops hardest) or Coral |
| Paper `#FFFFFF` | Ink | Blue or Coral |

> Thumbnail tip: **Yellow-on-black** and **black-on-yellow** are the most eye-catching in a busy
> feed. Reserve them for your highest-priority videos.

---

## 3. Typography

Two typefaces only. Both are **free & open-source (SIL Open Font License)** — fine for commercial
video/thumbnails. Download from Google Fonts.

- **Display / headlines → `Anton`** — one weight (reads ~900). Google Fonts: "Anton".
- **Body / labels / UI → `DM Sans`** — use 400/500/600/700/900. Google Fonts: "DM Sans".
- (Optional mono for code-on-screen: `Geist Mono` or any mono; rarely needed.)

### Casing & spacing
- **Anton headlines: UPPERCASE**, line-height **0.95–1.05** (tight), letter-spacing **−1%** at large sizes.
- **Eyebrows/labels/kickers (DM Sans):** UPPERCASE, weight 700–800, letter-spacing **+8%**.
- **Body (DM Sans):** sentence case, weight 500, line-height 1.4–1.5, normal tracking.
- Turn on **balanced wrapping** for headlines (avoid one lonely word on the last line).

### Type scale for 1080p video (1920×1080)
Sizes in px at 1080p. (Anton cap-height ≈ 0.72 × font-size — plan legibility off cap-height.)

| Role | Font / weight | Size (px @1080p) | Case | Tracking |
|---|---|---|---|---|
| On-screen title card | Anton | 96–140 | UPPER | −1% |
| Section / chapter title | Anton | 64–90 | UPPER | −1% |
| Lower-third name | Anton | 44–56 | UPPER | −1% |
| Lower-third role/company | DM Sans 600 | 24–30 | UPPER | +6% |
| Eyebrow / kicker | DM Sans 800 | 22–30 | UPPER | +8% |
| Lead / callout body | DM Sans 500 | 30–40 | sentence | 0 |
| Caption / footnote | DM Sans 500 | 22–28 | sentence | 0 |
| Big stat number | Anton | 160–320 | — | −1% |

### Type scale for thumbnails (1280×720)
Thumbnails are viewed as small as **168×94 px** in the mobile feed, so go **bigger and fewer words**.

| Role | Font | Size (px @1280×720) | Notes |
|---|---|---|---|
| Hero headline | Anton | **120–210** | 3–6 words max, 1–3 lines |
| Highlighted word (in a box) | Anton | match headline | one word only, coral/yellow box |
| Eyebrow pill | DM Sans 800 | 34–44 | optional, 1–3 words |
| Number flex | Anton | 220–420 | for "9", "3X", "$0" style thumbs |

> **Legibility floor:** headline cap-height should be **≥ 90px** at 1280×720 so it survives the
> 168px mobile preview. If you can't read it at 15% zoom, it's too small or too wordy.

---

## 4. Signature devices — scaled to pixels

The web uses a ~1200px container with 2.5px borders. Video frames are bigger and thumbnails are
viewed tiny, so **scale weights up**. Use this table.

| Device | Web | **Video 1080p** | **Thumbnail 1280×720** |
|---|---|---|---|
| Standard border | 2.5px | **4px** | **6px** |
| Emphasis border | 5px | **8px** | **10–14px** |
| Shadow — badge (xs) | 2px | **4px** | **6px** |
| Shadow — button (sm) | 4px | **8px** | **10px** |
| Shadow — card (md) | 6px | **12px** | **16px** |
| Shadow — feature (lg) | 8px | **16px** | **22px** |
| Shadow — hero (xl) | 12px | **24px** | **28–36px** |
| Card corner radius | 32px (2xl) | **40px** | **44px** |
| Pill (buttons/badges) | full | full | full |

### How to build the hard shadow (any tool)
A hard offset shadow = **a solid black copy of the shape, moved down + right by the offset, zero
blur, zero spread, 100% black, 45° (equal X and Y).**
- Figma/PS "Drop Shadow": `X = offset, Y = offset, Blur = 0, Spread = 0, Color = #000 @ 100%`.
- Canva / After Effects (no 0-blur shadow): **duplicate the shape, fill black, send behind, nudge down-right by the offset.**

### Object recipe (the "sticker" look)
Any object (card, photo, button, badge) = **flat fill + 4–8px black border + hard offset shadow +
rounded corners (or full pill)**. Optionally rotate stickers/badges **3–6°** for energy.

### Color-blocking
Fill whole regions (or the whole frame) with one flat accent. When stacking blocks in a video
sequence, **rotate colors so neighbors differ** (e.g. blue → cream → ink → coral → mint → yellow).
Never two identical blocks back-to-back.

### The "press" feel (motion signature)
Interactive/animated objects **press into their shadow**: on emphasis, move the object down-right
by the shadow offset and shrink the shadow to 0 (looks physically "pressed"). See §7.

---

## 5. Iconography & imagery

- **Icons:** line icons with **thick, consistent strokes** (2.5px web equiv → 3–4px @1080p),
  matching the outline weight. The web uses **`lucide`** (lucide.dev) — free, open-source; export
  SVGs and recolor to `ink`. Put important icons in a **bordered, hard-shadowed accent tile**
  (rounded square) or circle.
- **Photos/subjects:** frame every photo in a **black-bordered, rounded panel with a hard shadow**
  (like a sticker). Cut-out subjects (transparent PNG people) sit *on top* of a color block and can
  overlap the frame edge for depth.
- **No stock-y soft imagery, no gradients, no glows, no drop-shadow blur.** Flat + bordered only.
- **Placeholder aesthetic:** where a real image isn't ready, use a flat accent rectangle with a
  black border + label (the web `<Placeholder>` pattern) — keeps mockups on-brand.

---

## 6. Layout & grid

### Canvases
| Asset | Dimensions | Aspect | Notes |
|---|---|---|---|
| Video frame | 1920×1080 | 16:9 | Master canvas |
| Thumbnail | 1280×720 | 16:9 | <2MB, JPG/PNG, sRGB, min 640px wide |
| Shorts / vertical | 1080×1920 | 9:16 | Same system, stack elements |

### Margins & safe zones (1080p)
- **Outer margin:** keep all key content **≥ 60px** from every edge (thumbnails) / use broadcast
  **title-safe 5%** (96px) and **action-safe 10%** for video text.
- **Thumbnail bottom-right:** leave clear of the **~120×60px** duration stamp; keep faces/text out of it.
- **Grid:** 12-column, 24px gutter for complex layouts; or simple **60/40 split** (text / subject) for thumbnails.
- **Baseline rhythm:** space by an **8px** unit (8/16/24/32/48/64…), matching the web spacing scale.

---

## 7. Motion & animation

Snappy and physical — never floaty. Match the web timings.

| Motion | Duration | Easing | Notes |
|---|---|---|---|
| Press (emphasis) | 150 ms | easeOutCubic | Object + shadow "press in" |
| Element enter | 200 ms | easeOutCubic | Pop 96%→100% scale + slide up 24px |
| Reveal / transition | 300 ms | ease-in-out | Block wipes, color swaps |
| Sticker pop | 200 ms | slight overshoot | Rotate 3–6°, tiny bounce |
| Marquee ticker | ~30 s loop | linear | Scrolling headline/logo strip |

- **easeOutCubic** = cubic-bezier **(0.215, 0.61, 0.355, 1)** — set this as your default curve.
- **Press keyframes:** object `position +offset` & shadow `offset → 0` over 150ms (then release).
- **Block transitions:** hard color wipes / card slams (with the shadow) beat cross-dissolves.
- **Sound design vibe:** short, punchy clicks/thocks on presses and slams; nothing ambient.
- Keep motion purposeful; avoid parallax drift and opacity-only fades.

---

## 8. YouTube asset specs

Exact dimensions + where the brand elements go.

### Thumbnail — 1280×720
- File: JPG/PNG, **sRGB**, **< 2 MB**, min 640px wide.
- Composition: **one bold claim (3–6 words)** or **one big number**, one subject/face, one accent
  sticker. Background = a flat accent or ink block. Optional **6–10px inner black frame**.
- Border weights & shadows: use the **thumbnail column** in §4 (heavier).
- Legibility check: view at **168×94** — headline still readable? Face still clear?

### Channel banner — upload 2560×1440
- **All-device safe area (text + logo): center 1235×338.** Keep wordmark + tagline here.
- Desktop shows ~2560×423; TV shows the full 2560×1440. Fill the outer area with a color block or
  repeating sticker pattern; keep nothing critical outside the 1235×338 safe box.
- Recipe: ink or accent background, big Anton wordmark centered, a one-line DM Sans tagline pill,
  optional upload-schedule sticker.

### Profile picture / avatar — 800×800 (renders as a circle, ~98px)
- Put a **bordered circle** with an accent fill and your **Anton monogram** (or logo mark) centered.
- Keep the mark well inside the circle; test at tiny size.

### Watermark / branding overlay — 150×150 PNG (transparent)
- A small bordered logo mark; appears bottom-right of the video. Keep it simple (mark only).

### End screen (last 5–20s)
- Elements within 1280×720 with **~60px margins**; use bordered, hard-shadow cards for
  "Subscribe", "Next video", "Playlist". One accent block background.

### Lower-third (name/title bar)
- Bottom-left, inside title-safe. **Card:** accent or paper fill, 4–6px black border, 12–16px hard
  shadow, radius 40px. **Name** in Anton (44–56px), **role** in DM Sans 600 uppercase (24–30px).
  Optional accent tab on the left edge.

---

## 9. Thumbnail recipes (copy these formulas)

Wireframes are schematic (▓ = accent block, ▒ = subject panel, ◼ = sticker).

### Recipe A — "Big Claim + Face"
Background: bright accent (e.g. yellow). Left 60% = headline; right 40% = subject.
```
┌───────────────────────────────────────────────┐  ← 6–10px black frame
│ ◼ EYEBROW PILL                                  │
│                                     ┌─────────┐ │
│  STOP GETTING                       │  ▒▒▒▒▒  │ │  subject in black-
│  [ GHOSTED ]  ← word in coral box   │  ▒▒▒▒▒  │ │  bordered rounded
│  ON COLD CALLS                      │  ▒▒▒▒▒  │ │  panel + hard shadow
│                                ◼ROTATED BADGE   │
└───────────────────────────────────────────────┘
```
Rules: 3–6 words, one word boxed in a second accent, headline cap-height ≥ 90px.

### Recipe B — "Number Flex"
Background: ink. Giant Anton number in yellow, short label below.
```
┌───────────────────────────────────────────────┐
│  EYEBROW                                        │
│      9                                ┌───────┐ │
│  MEETINGS      ◼ IN A WEEK (sticker)  │ ▒▒▒▒▒ │ │
│  IN 5 DAYS                            └───────┘ │
└───────────────────────────────────────────────┘
```
Rules: the number is the hero (220–420px). One label, one sticker, optional small subject.

### Recipe C — "Versus / Comparison"
Split frame with a black divider; loser (coral + ✗) vs winner (mint + ✓).
```
┌────────────────────────┬────────────────────────┐
│  OLD WAY          ✗     │     ✓        NEW WAY    │
│  (coral block)         ◼│◼        (mint block)    │
│  bullet · bullet        │        bullet · bullet  │
└────────────────────────┴────────────────────────┘
        ↑ 8–12px black center divider
```

### Universal thumbnail rules
- ≤ 6 words. One focal point. One accent sticker. Max two accents.
- Face (if used) large, well-lit, clear expression, in a bordered panel or cut out.
- Test at 168×94 and in both light/dark YouTube UI.
- Keep the bottom-right corner clear of text/faces (duration stamp).

---

## 10. Web component → video graphic map

Reuse the same "objects" you see on the site as motion-graphic templates:

| Web component | Video/graphic asset |
|---|---|
| Button (pill + border + hard shadow) | CTA card, "Subscribe"/"Next" end-screen button |
| Badge / pill | Sticker callout ("NEW", chapter tag, "IN A WEEK") |
| Card | Stat card, quote card, tip card, comparison card |
| Section color block | Full-frame background for a video segment |
| Eyebrow | Kicker above a title card |
| StatBand (big Anton numbers) | Number-reveal graphic |
| Testimonial / QuoteFeature | Quote card with avatar + stars |
| Comparison | Versus segment / thumbnail Recipe C |
| Marquee / MarqueeHeadline | Bottom scrolling ticker |
| Steps (numbered circles) | Chaptered "how-to" sequence |
| Avatar (bordered circle + initials) | Lower-third / commenter chip |

---

## 11. Tooling setup

### Figma (recommended for stills/thumbnails)
1. **Color styles:** add every hex in §2.
2. **Text styles:** Anton (title/section/lower-third sizes) + DM Sans (eyebrow/body/caption) per §3.
3. **Effect style "Hard Shadow / md":** Drop shadow `X 12, Y 12, Blur 0, Spread 0, #000 100%` (make xs/sm/lg/xl variants with the §4 offsets).
4. Build a **component library:** Button, Badge, Card, Photo-frame, Lower-third, Number-card, Thumbnail templates A/B/C. Use auto-layout + the 8px grid.

### Canva
- Brand Kit: add the hexes; both **Anton** and **DM Sans** are available.
- Fake the hard shadow: **duplicate the element, fill black, position behind, offset down-right** by the §4 amount (Canva shadows are blurry — don't use them).
- Save thumbnail templates A/B/C as reusable designs.

### After Effects / Premiere (video)
- **Solids** for color blocks; **Essential Graphics** for lower-thirds/title cards.
- Hard shadow = **duplicate layer, black fill, offset** (or "Drop Shadow" effect with **Softness = 0**).
- Set the default **temporal easing to easeOutCubic** (bezier ≈ .215/.61/.355/1); press = position+shadow keyframes over 150ms.
- Borders = **Stroke** effect / shape stroke at the §4 px weight, pure black.

### Portable design tokens (CSS custom properties)
Drop-in values (from `app/globals.css`) if you build web/HTML overlays:
```css
:root {
  --ink:#000; --paper:#fff; --blue:#839aff; --mint:#c6fcd0;
  --coral:#fd7962; --yellow:#fce552; --cream:#f6f4ee;
  --border: 2.5px solid #000;               /* scale up for video */
  --shadow-hard-sm: 4px 4px 0 0 #000;
  --shadow-hard:    6px 6px 0 0 #000;
  --shadow-hard-lg: 8px 8px 0 0 #000;
  --radius-2xl: 2rem; --radius-pill: 100vw;
  --ease-press: cubic-bezier(.215,.61,.355,1);
}
```

---

## 12. Export & technical

- **Color space: sRGB** for every asset (thumbnails, banners, video). Avoid P3/Adobe RGB (colors shift in the feed).
- **Thumbnails:** PNG (crisp text) or high-quality JPG, 1280×720, < 2MB.
- **Banners/avatars:** PNG, exact upload sizes (§8).
- **Video:** 1080p (or 4K) H.264/H.265 MP4, sRGB (Rec.709), 16:9.
- Keep an editable master (Figma/AE) + flattened export per asset.

---

## 13. Do / Don't

**DO**
- Thick pure-black outlines + hard offset shadows (zero blur) on every object.
- UPPERCASE Anton headlines, DM Sans body, tracked uppercase eyebrows.
- Flat bright color-blocks; one dominant accent per frame.
- Huge type on thumbnails (≤ 6 words), one clear subject/face.
- High contrast (ink on bright, paper on ink); rotate stickers 3–6°.

**DON'T**
- ❌ Soft/blurry drop shadows, glows, or gradients.
- ❌ Thin, gray, or colored borders where black belongs.
- ❌ Light-gray/low-opacity text on color blocks.
- ❌ Script/serif/thin fonts, or more than two typefaces.
- ❌ Cluttered thumbnails, tiny text, > 6 words, > 2 accents.
- ❌ Photos without a bordered frame; stock-y soft imagery.

---

## 14. Asset checklist (per video)

- [ ] Thumbnail (1280×720, sRGB, <2MB) — passes the 168×94 legibility test.
- [ ] Title card / intro (Anton headline on an accent/ink block).
- [ ] Lower-third(s) for speakers (name Anton, role DM Sans).
- [ ] 1–3 in-video graphic cards (stat / quote / tip / comparison) from the component map.
- [ ] End screen (bordered Subscribe + Next-video cards, ~60px margins).
- [ ] Optional bottom ticker (marquee) and 150×150 watermark.
- [ ] All colors sRGB; all shadows zero-blur; all borders pure black.

---

## 15. Cheat sheet (copy-paste)

```
FONTS  Anton (display, UPPER, LH .95–1.05, track −1%) · DM Sans (body 500; eyebrow 800 UPPER track +8%)
COLORS ink #000 · paper #fff · blue #839AFF · mint #C6FCD0 · coral #FD7962 · yellow #FCE552 · cream #F6F4EE
TEXT   ink on bright/paper; paper on ink; never gray on color
BORDER thumbnail 6px / emphasis 10–14px · video 4px / emphasis 8px · always #000
SHADOW hard, zero blur, 45°, #000 — thumb: badge6 / btn10 / card16 / hero28  · video: 4/8/12/16/24
RADIUS cards ~44px (thumb) / 40px (video); buttons & badges = full pill
MOTION press 150ms · enter 200ms · reveal 300ms · easeOutCubic (.215,.61,.355,1)
THUMB  1280×720 · ≤6 words · 1 subject · 1 accent sticker · headline cap-height ≥90px · clear bottom-right
YT     banner upload 2560×1440 (safe 1235×338) · avatar 800×800 · watermark 150×150 · export sRGB
```
