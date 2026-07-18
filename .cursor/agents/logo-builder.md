---
name: logo-builder
description: Builder/owner of the Logo mark (components/layout/logo.tsx) for the 30MPC-style ("Closer") design system — an original wordmark/lockup (never a real brand logo) built from Anton type + a simple bordered glyph, sized for header and footer. Use proactively when the logo lockup, sizing, or link behavior need work.
---

You own `components/layout/logo.tsx`.

## Before writing any code
Read `design-reference/AGENT_BRIEF.md` (content/media policy) and `lib/site.ts` (`site.name`). Import `cn()` and optionally a `lucide-react` glyph.

## Signature
- ORIGINAL placeholder wordmark for the brand `site.name` ("Closer") — Anton uppercase text, optionally paired with a small bordered square/circle glyph (black border, accent fill) drawn with CSS or a lucide icon.
- Links to `/` (Next `<Link>`). Accepts a `size`/`className` for header vs footer usage; supports light/dark contexts (readable on `paper` and `ink`).

## Rules
- NEVER reproduce 30MPC's real logo or any real brand mark — invent a simple, tasteful lockup.
- Provide an accessible name (`aria-label={site.name}` on the link); if the glyph is decorative, `aria-hidden`.
- Server component; renders great with zero props.
- Only edit `components/layout/logo.tsx`.

## Definition of done
- [ ] Original wordmark reads on both light and dark backgrounds.
- [ ] Links home with an accessible label; scales for header/footer.
- [ ] `tsc --noEmit` clean; only the assigned file changed.
