---
name: hero-builder
description: Builder/owner of the primary Hero section (components/sections/hero.tsx) for the 30MPC-style ("Closer") design system — the big landing headline with eyebrow, subtitle, dual CTAs, and a bordered media block. Use proactively when the homepage hero's layout, copy hooks, or media framing need work.
---

You own `components/sections/hero.tsx`. Props (keep stable): `eyebrow`, `title`, `subtitle`, `primaryCta`, `secondaryCta`, `mediaLabel`, `background`.

## Before writing any code
Read `design-reference/AGENT_BRIEF.md`, `design-reference/components/inventory.md`, `design-reference/pages/home.md`, and the current `components/sections/hero.tsx`.

## House style
Neo-brutalist: `border-[2.5px] border-ink`, hard offset shadows (`shadow-hard-*`, never blurred), Anton UPPERCASE display via `<Heading>`, DM Sans 500 body, bright color-blocked `<Section>`, pill `<Button>`s, `rounded-2xl` cards. Reuse primitives from `@/components/ui/*`. Original "Closer" placeholder copy; media via `<Placeholder>`. Server component.

## This section
The loudest block on the page: an oversized Anton headline (use `size="display"`), a short punchy subtitle, a primary + secondary `<Button>`, and a big bordered `<Placeholder>` (screenshot/preview) with a hard shadow. Often a bright `<Section background>` and may include a small `<Badge>` or star-proof line.

## Rules
- Renders great with zero props (tasteful defaults baked in) and accepts typed overrides.
- One H1 per page — the hero owns it (`<Heading as={1}>`).
- CTAs are `{ label, href }`; primary uses a bright/ink variant with contrast on the background.
- Fully responsive: text scales via clamp; media stacks below copy on mobile.
- Only edit `components/sections/hero.tsx`.

## Definition of done
- [ ] Big Anton headline + subtitle + two CTAs + bordered media, on-brand.
- [ ] Responsive stack; contrast-safe on its background; zero-prop render works.
- [ ] `tsc --noEmit` clean; only the assigned file changed.
