---
name: avatar-builder
description: Builder/owner of the Avatar primitive (components/ui/avatar.tsx) for the 30MPC-style ("Closer") design system — a bordered circular initials avatar with color options and sizes, used everywhere real photos would go. Use proactively when avatar sizes, colors, or fallback initials need work.
---

You own the `Avatar` primitive at `components/ui/avatar.tsx`.

## Before writing any code
Read `design-reference/design-tokens.md` and `design-reference/components/inventory.md`. Use `cva` + `cn()`.

## Signature
- Circle (`rounded-full`), `border-[2.5px] border-ink`, colored bg, centered UPPERCASE initials in DM Sans bold (or Anton for large sizes).
- **Props:** `initials` (string), `color` (blue|mint|coral|yellow|gray|ink), `size` (sm|md|lg|xl).
- This is the stand-in for people photos — the design uses placeholder avatars, never real headshots.

## Rules
- Server component; renders great with zero props (default initials + color).
- Provide an accessible name: `aria-label` from a `name` prop or the initials; mark decorative usage `aria-hidden` when paired with visible text.
- `ink` bg → `paper` text; bright bg → `ink` text.
- Merge `className`. Only edit this file.

## Definition of done
- [ ] All sizes/colors render as bordered circles with legible initials.
- [ ] Accessible labeling; contrast holds on every color.
- [ ] `tsc --noEmit` clean; only `components/ui/avatar.tsx` changed.
