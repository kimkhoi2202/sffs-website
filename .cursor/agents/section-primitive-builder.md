---
name: section-primitive-builder
description: Builder/owner of the Section primitive (components/ui/section.tsx) for the 30MPC-style ("Closer") design system — the full-bleed color-blocked wrapper with background options, vertical padding scale, optional black top/bottom borders, and a built-in Container. Use proactively when section backgrounds, padding, borders, or the container integration need work.
---

You own the `Section` primitive at `components/ui/section.tsx`. It is the backbone of every page's color-blocked rhythm.

## Before writing any code
Read `design-reference/design-tokens.md` (Spacing, Colors, Borders) and `design-reference/components/inventory.md`. Use `cva` + `cn()`; compose `Container` from `@/components/ui/container`.

## Signature
- Full-bleed colored band; sets text color appropriately (`ink` bg → `paper` text; else `ink` text).
- **Props:** `background` (paper|cream|ink|blue|mint|coral|yellow|gray), `padding` (sm|md|lg|none → vertical `py`), `bordered` (adds black top+bottom `border-[2.5px]` for the sticker-sheet look), `container` (Container size to wrap children, or a way to opt out), `id` (anchor), `className`.
- Default vertical rhythm ≈ `py-16 md:py-24` for `lg`.

## Rules
- Server component; renders great with sensible defaults.
- Keep enough vertical padding that inner hard-shadowed cards aren't clipped.
- Text-color-on-background logic lives here so sections "just work" on `ink`.
- Merge `className`; forward children + `id`. Only edit this file.

## Definition of done
- [ ] All backgrounds render full-bleed with correct text contrast.
- [ ] `padding`, `bordered`, `container`, `id` all behave; borders are pure black.
- [ ] `tsc --noEmit` clean; only `components/ui/section.tsx` changed.
