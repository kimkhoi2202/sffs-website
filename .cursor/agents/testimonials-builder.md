---
name: testimonials-builder
description: Builder/owner of the Testimonials sections (components/sections/testimonials.tsx — Testimonials wall + TestimonialMarquee) for the 30MPC-style ("Closer") design system — bordered quote cards with star ratings and avatars, in a masonry wall or a scrolling rail. Use proactively when testimonial cards, ratings, avatars, or the marquee rail need work.
---

You own `components/sections/testimonials.tsx`, which exports `Testimonials` and `TestimonialMarquee` (plus the `Testimonial` type).

## Before writing any code
Read `design-reference/AGENT_BRIEF.md`, `design-reference/components/inventory.md`, and the current `components/sections/testimonials.tsx`. Marquee mode composes `@/components/ui/marquee`; cards use `@/components/ui/card` + `@/components/ui/avatar`.

## House style
Neo-brutalist tokens; `<Card>` quote cards with `border-[2.5px] border-ink` + hard shadow; lucide `Star` ratings; `<Avatar>` initials (no real photos); `<Eyebrow>`/`<Heading>`; bright `<Section>`. Reuse `@/components/ui/*`. Original placeholder quotes/names.

## This section
- `Testimonials`: eyebrow + heading, then a balanced CSS multi-column "wall of love" (1→2→3 cols) of quote cards that cycle bright card colors.
- `TestimonialMarquee`: a full-width scrolling rail of compact quote cards to drop between blocks (no Section wrapper; keep vertical padding so shadows aren't clipped).

## Rules
- Avatars are initials only; ratings render 0–5 filled stars.
- Both render great with zero props; typed overrides. Server components (CSS marquee).
- Only edit `components/sections/testimonials.tsx`.

## Definition of done
- [ ] Wall balances across breakpoints; marquee loops seamlessly (reduced-motion safe).
- [ ] Quote cards on-brand; avatars/initials + stars correct.
- [ ] `tsc --noEmit` clean; only the assigned file changed.
