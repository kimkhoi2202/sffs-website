# Agent Brief — 30MPC-style design clone

**Read this fully before writing any code.** Every builder subagent relies on the same
foundation so the site stays visually consistent.

## Mission

Recreate the **visual design system** of 30mpc.com (30 Minutes to President's Club) as a
reusable Next.js component library + full site. We clone the *look and feel* — color,
typography, spacing, layout, component structure, motion — NOT the content.

### Content policy (important)
- **All copy is original placeholder text.** Do NOT copy 30MPC's marketing copy. Write your
  own plausible, on-brand sales-education copy for the placeholder brand **"Closer"**.
- **All media is placeholder.** Never reference 30MPC images/logo/photos. Use the
  `<Placeholder>`, `<Avatar>`, and `lucide-react` icons instead.
- You may read `design-reference/raw/pages/<page>.html` to understand *structure and section
  order only*. Do not lift text from it.

## Tech stack
- Next.js 16 (App Router, RSC) + React 19 + TypeScript
- Tailwind CSS v4 (theme tokens live in `app/globals.css` `@theme`)
- Base UI (`@base-ui-components/react`) for interactive primitives
- `lucide-react` icons, `class-variance-authority`, `cn()` from `@/lib/utils`

Project root: `/Users/khoilam/Documents/Crossover/30mpc-website-design-cursor`
(all paths below are relative to it; use absolute paths when writing files).

## Rules to avoid collisions (STRICT)
- **Only create/edit the file(s) assigned to you.** Do not touch other agents' files.
- **Never modify** these shared files: `app/globals.css`, `app/layout.tsx`, `lib/utils.ts`,
  `lib/site.ts`, anything in `components/ui/`, `components/layout/`, or any config
  (`next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `package.json`).
- **Do NOT** run `npm install`, `npm run build`, or the dev server. Do not add dependencies.
- Do not create barrel/index files. Import components by their direct path.
- Write clean, type-safe code (it must pass `tsc --noEmit`). Server Components by default; add
  `"use client"` only when you use state/effects/Base UI interactivity.

## Design language cheat sheet
Full detail in `design-reference/design-tokens.md`. The signatures:
- **Thick black borders:** `border-[2.5px] border-ink` (use `border-[5px]` for emphasis).
- **Hard offset shadows (no blur):** `shadow-hard-xs|sm|hard|hard-lg`, plus `shadow-lip`.
- **Press interaction:** add the `press` utility class to buttons/interactive cards (it nudges
  into the shadow on hover/active). `press-lg` for big cards.
- **Display type:** Anton via `font-display`, usually `uppercase`, tight leading. Use the
  `<Heading>` primitive or the `text-display` utility.
- **Body type:** DM Sans via `font-sans`, base weight 500. Labels/eyebrows are UPPERCASE +
  tracked (`eyebrow` utility or `<Eyebrow>`).
- **Color blocking:** full-bleed `<Section background="...">` blocks in `blue`, `mint`, `coral`,
  `yellow`, `cream`, `ink`, `paper`. Rotate colors between stacked sections.
- **Rounding:** cards `rounded-2xl`, buttons/badges `rounded-full`, inputs `rounded-full`.
- **Palette:** `ink` #000, `paper` #fff, `blue` #839aff, `mint` #c6fcd0, `coral` #fd7962,
  `yellow` #fce552, `cream` #f6f4ee, `gray-100..600`.

## Foundation primitives (REUSE THESE — do not re-implement)
Import from `@/components/ui/<name>` and `@/components/layout/<name>`.

```tsx
import { Container } from "@/components/ui/container";      // size: page|prose|form|full
import { Section } from "@/components/ui/section";          // background, padding(sm|md|lg), bordered, container
import { Button } from "@/components/ui/button";            // variant: blue|coral|yellow|mint|ink|paper|outline; size: sm|md|lg; href?
import { Badge } from "@/components/ui/badge";              // color, size, shadow
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";          // as:1..4, size: display|xl|lg|md|sm, uppercase
import { Card } from "@/components/ui/card";                // color, shadow(none|sm|md|lg), padding, interactive
import { Input, Textarea, Label, Field } from "@/components/ui/input";
import { Placeholder } from "@/components/ui/placeholder";  // color, aspect "16/9", label
import { Marquee } from "@/components/ui/marquee";          // speed, gap, reverse
import { Avatar } from "@/components/ui/avatar";            // initials, color, size
```

Usage examples:
```tsx
<Section background="blue" padding="lg" bordered>
  <Eyebrow>Free newsletter</Eyebrow>
  <Heading size="xl">Book more meetings</Heading>
  <p className="mt-4 max-w-prose text-lg">Original placeholder copy…</p>
  <div className="mt-6 flex flex-wrap gap-3">
    <Button href="/courses" variant="coral" size="lg">Start learning</Button>
    <Button href="/podcast" variant="paper" size="lg">Listen now</Button>
  </div>
</Section>

<Card color="mint" shadow="md" interactive>
  <Badge color="yellow" shadow="hard">New</Badge>
  <Heading as={3} size="sm" className="mt-3">Cold calling 101</Heading>
  <p className="mt-2 text-sm">Original copy…</p>
</Card>
```

## Base UI usage
Import each component from its subpath, e.g.:
```tsx
import { Accordion } from "@base-ui-components/react/accordion";
import { Tabs } from "@base-ui-components/react/tabs";
import { Dialog } from "@base-ui-components/react/dialog";
```
- Components are **unstyled** — style parts with Tailwind classes on each part
  (`Accordion.Root/Item/Header/Trigger/Panel`, `Tabs.Root/List/Tab/Panel`, etc.).
- Style open/animation states via data attributes: `data-[panel-open]`, `data-[selected]`,
  `data-[starting-style]`, `data-[ending-style]`.
- Anything using Base UI interactivity must be a `"use client"` component.
- Keep interactions simple, keyboard-accessible, and on-brand (black borders, hard shadows).

## Folder conventions
- Reusable page sections → `components/sections/<kebab-name>.tsx` (export a named component).
- Small sub-parts used by one section can live in the same file.
- Pages → `app/<route>/page.tsx` (assemble sections + primitives; add `export const metadata`).

## Fidelity checklist (self-review before finishing)
- [ ] Uses the shared primitives; no ad-hoc re-styling of buttons/cards.
- [ ] Black `2.5px` borders + hard offset shadows on the right elements.
- [ ] Anton uppercase display headings; DM Sans body.
- [ ] Bright color-blocked sections, generous rounding, pill buttons.
- [ ] Fully responsive (mobile-first; check `sm`/`md`/`lg`). Real content stacks cleanly.
- [ ] Original placeholder copy + `<Placeholder>`/`<Avatar>`/lucide for all media.
- [ ] Type-safe; only your assigned files changed.
