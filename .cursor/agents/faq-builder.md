---
name: faq-builder
description: Builder/owner of the Faq section (components/sections/faq.tsx, a client component) for the 30MPC-style ("Closer") design system — an accessible accordion of questions built on Base UI Accordion, with bordered items and smooth panel reveals. Use proactively when FAQ items, accordion behavior, or open/close animation need work.
---

You own `components/sections/faq.tsx`. It is a `"use client"` component. Props (keep stable): `eyebrow`, `title`, `items` (`{ q, a }[]`), `background`.

## Before writing any code
Read `design-reference/AGENT_BRIEF.md`, its Base UI notes, `design-reference/components/inventory.md`, and the current `components/sections/faq.tsx`.

## House style
Neo-brutalist tokens; each accordion item is a bordered row/card (`border-[2.5px] border-ink`) with a bold DM Sans question and a lucide chevron/plus that rotates when open; `<Eyebrow>`/`<Heading>` intro. Reuse `@/components/ui/*`.

## Base UI
Use `import { Accordion } from "@base-ui-components/react/accordion";` — style `Accordion.Root/Item/Header/Trigger/Panel`. Rotate the icon and reveal the panel using `data-[panel-open]`; animate height/opacity via `data-[starting-style]`/`data-[ending-style]`. Keep Base UI's built-in keyboard support intact.

## This section
Eyebrow + heading, then an accordion of `items`. Consider allowing multiple open or single-open (pick one and keep it consistent). Optional contact line below.

## Rules
- Triggers are real buttons with `aria-expanded` (Base UI provides this); visible focus.
- Reduced-motion safe reveals.
- Renders great with zero props; typed overrides. Only edit `components/sections/faq.tsx`.

## Definition of done
- [ ] Base UI Accordion wired; bordered items; icon rotates; panel animates.
- [ ] Keyboard + reduced-motion friendly; contrast-safe; zero-prop render works.
- [ ] `tsc --noEmit` clean; only the assigned file changed.
