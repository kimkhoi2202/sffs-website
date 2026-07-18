# 30MPC Design Tokens — Source of Truth

Reverse-engineered from the live Webflow CSS (`raw/css/webflow-opt.min.css`). These are the
canonical values for the clone. **Everything below is baked into Tailwind theme tokens** in
`app/globals.css` (`@theme`). Prefer semantic Tailwind classes over raw values.

> Content policy: This project clones the **design system only** (color, type, spacing, layout,
> component structure). All copy is original placeholder text; all imagery is placeholder. Do not
> reproduce 30MPC's marketing copy, photos, or logo.

---

## Aesthetic summary ("the taste")

Neo-brutalist / playful-bold sales brand:
- **Thick black outlines** (`2.5px solid #000`, up to `5px`) on nearly every card, button, input, pill.
- **Hard offset drop-shadows with zero blur** (e.g. `4px 4px 0 0 #000`) — the single most important signature. Interactive elements "press" into their shadow on hover.
- **Big condensed display type** in **Anton**, frequently **UPPERCASE**, very tight line-height.
- **DM Sans** for all body/UI text, medium weight (500) as the base.
- **High-contrast color blocking**: full-bleed sections in bright pastels (mint, periwinkle, yellow, coral) or black, stacked like sticker sheets.
- **Generous rounding**: `1rem`–`2rem` radii on cards; full **pills** (`border-radius: 100vw`) on buttons/badges; circles for avatars/icons.
- Energetic, confident, fun. Not corporate-minimal.

---

## Color palette

| Token | Hex | Usage |
|---|---|---|
| `--color-ink` (black) | `#000000` | Text, borders, hard shadows, dark sections |
| `--color-paper` (white) | `#ffffff` | Base surface, cards, text on dark |
| `--color-blue` (periwinkle) | `#839aff` | Primary accent, section blocks, buttons |
| `--color-mint` | `#c6fcd0` | Accent, section blocks, highlights |
| `--color-coral` (red) | `#fd7962` | Accent, alerts, emphasis, buttons |
| `--color-yellow` | `#fce552` | Accent, highlights, badges, section blocks |
| `--color-gray-100` | `#ebebeb` | Light neutral surface / dividers |
| `--color-gray-400` | `#a5a5a5` | Inactive/disabled |
| `--color-gray-500` | `#9b9b9b` | Muted text on light |
| `--color-gray-600` | `#999999` | Muted text |

Accent set = {blue, mint, coral, yellow}. Sections rotate through these on black/white bases.

---

## Typography

- **Display / headings:** `Anton, sans-serif` — condensed, weight 400 (Anton has one weight; it reads as ~900). Use UPPERCASE for hero/section headings, `line-height: 1`–`1.1`, `letter-spacing: -0.01em` on large sizes.
- **Body / UI:** `"DM Sans", sans-serif` — base `1rem / 1.5 / 500`. Weights used: 400, 500 (base), 600, 700, 900.
- **Eyebrows / labels / buttons:** DM Sans, UPPERCASE, `letter-spacing: 0.01em`, weight 700–900, small (`0.75rem`–`0.875rem`).

Both fonts are open-source (Google Fonts). Loaded via `next/font/google`.

### Type scale (rem)
`0.625, 0.75, 0.8, 0.875, 1 (base), 1.125, 1.25, 1.375, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 4, 4.5, 6.2`
Plus fluid display: `clamp()` around `5vw` for hero.

| Role | Size | LH | Weight | Font |
|---|---|---|---|---|
| Hero display | `clamp(2.75rem, 6vw, 6.2rem)` | 1 | 400 | Anton, UPPERCASE |
| H1 | `clamp(2.25rem, 4vw, 4rem)` | 1.05 | 400 | Anton |
| H2 | `clamp(2rem, 3vw, 3rem)` | 1.1 | 400 | Anton |
| H3 | `1.5rem`–`2rem` | 1.2 | 400/700 | Anton or DM Sans 700 |
| Lead / large body | `1.125rem`–`1.25rem` | 1.5 | 500 | DM Sans |
| Body | `1rem` | 1.5 | 500 | DM Sans |
| Small / caption | `0.875rem` | 1.5 | 500 | DM Sans |
| Eyebrow / label | `0.75rem`–`0.8rem` | 1.2 | 700–900 | DM Sans UPPERCASE, +tracking |

Line-heights in use: `1, 1.1, 1.2 (headings), 1.25, 1.3, 1.4, 1.5 (body), 1.6`.
Letter-spacing: `-0.01em` (large display), `0.01em` (labels).

---

## Spacing & layout

- **Spacing scale (rem):** `0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5` (maps to Tailwind default 1,2,3,4,6,8,10,12,16,20). Base unit ~ `0.25rem`.
- **Gaps (most common):** `1rem`, `0.5rem`, `2rem`, `1.5rem`, `3rem`.
- **Container widths:** wide content `~75rem (1200px)`; standard `~62rem (992px)`; prose/text column `~44rem (700px)` / `50ch`; forms `~31rem (500px)`.
- **Side gutters:** `1rem` mobile → `2rem`+ desktop. Common pattern `max-width: calc(100% - 2rem)` / `calc(100% - 4rem)`.
- **Section padding:** vertical `4rem` mobile → `6–8rem` desktop; horizontal `1rem` → `2rem`. (`py-16 md:py-24`, `px-4 md:px-8`.)

---

## Radii

| Token | Value |
|---|---|
| `sm` | `0.375rem` |
| `DEFAULT` | `0.5rem` |
| `md` | `0.75rem` |
| `lg` | `1rem` (most common card) |
| `xl` | `1.5rem` |
| `2xl` | `2rem` (large cards) |
| `3xl` | `2.5rem` |
| `4xl` | `3rem` |
| `pill` | `100vw` (buttons, badges) |
| `full` | `9999px` / `50%` (circles) |

---

## Borders

- **Default:** `2.5px solid #000` (the standard outline everywhere).
- **Thin:** `1px solid #000`.
- **Emphasis:** `3px` / `5px solid #000`.
- Borders are almost always pure black `#000`. Colored insets occasionally (`inset 0 -4px 0 0 var(--red)` as an underline accent).

---

## Shadows (SIGNATURE — hard, zero blur)

| Token | Value | Use |
|---|---|---|
| `hard-xs` | `2px 2px 0 0 #000` | small pills/badges |
| `hard-sm` | `4px 4px 0 0 #000` | default buttons, small cards |
| `hard` | `6px 6px 0 0 #000` | cards |
| `hard-lg` | `8px 8px 0 0 #000` | feature cards, modals |
| `lip` | `0 4px 0 0 #000` | bottom-lip buttons |
| `lip-lg` | `0 8px 0 0 #000` | bottom-lip large |

**Interaction pattern (buttons/cards):** on hover, `translate(2px, 2px)` and shrink shadow to `2px 2px` (press-in); on active, `translate(4px,4px)` and shadow `0 0` (fully pressed). Transition `transform .15s, box-shadow .15s`.

Never use soft/blurry shadows. If a soft shadow is ever needed, don't — use a hard offset shadow.

---

## Breakpoints (match Webflow source)

| Name | Min width | Notes |
|---|---|---|
| base | 0 | mobile-first |
| `sm` | `480px` | Webflow mobile-landscape boundary (max 479) |
| `md` | `768px` | Webflow tablet boundary (max 767) |
| `lg` | `992px` | Webflow desktop boundary (max 991) |
| `xl` | `1440px` | Webflow large |
| `2xl` | `1920px` | Webflow xl |

---

## Motion

- Durations: `0.15s` (press), `0.2s` (default), `0.3s` (ease-in-out reveals).
- Easings: `ease-in-out`, `cubic-bezier(.215,.61,.355,1)` (easeOutCubic).
- Common: `transition: transform .2s`, `transition: all .2s`, hover `translate` + shadow change.
- Marquees (logo strips) scroll horizontally; carousels via Swiper-like slider.

---

## Component signatures (quick reference)

- **Button (primary):** pill, `bg-blue`/`bg-coral`/`bg-yellow`, `border-2.5 border-ink`, `text-ink`, UPPERCASE DM Sans 700, `shadow-hard-sm`, press-in on hover.
- **Button (secondary):** pill, `bg-paper`, black border + shadow.
- **Card:** `bg-paper`, `border-2.5 border-ink`, `rounded-2xl`, `shadow-hard`.
- **Badge/Pill:** small pill, colored bg, black border, `shadow-hard-xs`, UPPERCASE label.
- **Input:** `bg-paper`, `border-2.5 border-ink`, `rounded-pill` or `rounded-lg`, black text.
- **Section:** full-bleed colored/black/white block, black top/bottom border optional, centered container.
- **Eyebrow:** small uppercase tracked label, often in a pill above headings.
