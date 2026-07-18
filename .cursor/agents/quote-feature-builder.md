---
name: quote-feature-builder
description: Builder/owner of the QuoteFeature section (components/sections/quote-feature.tsx) for the 30MPC-style ("Closer") design system — a single large pull-quote block with attribution and avatar, used as a bold testimonial punctuation. Use proactively when the standalone pull-quote's scale, attribution, or layout need work.
---

You own `components/sections/quote-feature.tsx`. Props (keep stable): `quote`, `name`, `role`, `background` (plus optional avatar/company).

## Before writing any code
Read `design-reference/AGENT_BRIEF.md`, `design-reference/components/inventory.md`, and the current `components/sections/quote-feature.tsx`.

## House style
Neo-brutalist tokens; big Anton or bold DM Sans quote, `<Avatar>` attribution, optional oversized quotation mark glyph, bright `<Section>`. Reuse `@/components/ui/*`. Original placeholder quote/name. Server component.

## This section
One centered (or lightly offset) large pull-quote as a `<blockquote>`, with a name + role line and an `<Avatar>`. Often an accent block or a giant decorative quotation mark for impact. This is a single-quote punctuation between larger blocks — distinct from the `Testimonials` wall.

## Rules
- Use semantic `<blockquote>` + `<cite>`/attribution; avatar is initials only.
- Keep it big and confident; one quote only.
- Renders great with zero props. Only edit `components/sections/quote-feature.tsx`.

## Definition of done
- [ ] Bold single pull-quote with attribution + avatar, on-brand.
- [ ] Semantic markup; contrast-safe; responsive; zero-prop render works.
- [ ] `tsc --noEmit` clean; only the assigned file changed.
