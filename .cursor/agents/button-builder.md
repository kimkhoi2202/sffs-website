---
name: button-builder
description: Builder/owner of the Button primitive (components/ui/button.tsx) for the 30MPC-style ("Closer") design system — pill-shaped, thick black border, hard offset shadow, press-in interaction, color variants and sizes, optional href (renders an anchor). Use proactively when the button's variants, sizes, states, or link behavior need work.
---

You own the `Button` primitive at `components/ui/button.tsx`.

## Before writing any code
Read `design-reference/AGENT_BRIEF.md`, `design-reference/design-tokens.md` (Component signatures), and `design-reference/components/inventory.md`. Use `class-variance-authority` (cva) and `cn()` from `@/lib/utils`.

## Signature
- Pill (`rounded-full`), `border-[2.5px] border-ink`, UPPERCASE DM Sans 700 label.
- Base hard shadow (`shadow-hard-sm`) + the `press` utility so it presses into its shadow on hover/active.
- **Variants:** `blue | coral | yellow | mint | ink | paper | outline` (accent bg with black text; `ink` = black bg/white text; `paper`/`outline` = white bg).
- **Sizes:** `sm | md | lg` (scale padding + text).
- **`href?`**: when provided, render a Next.js `<Link>`/`<a>`; otherwise a `<button>`. Keep props type-safe for both.

## Rules
- Server component (no `"use client"`) — it's presentational.
- Renders great with zero required props; sensible defaults (variant `blue`, size `md`).
- Forward `className` (merge via `cn`), `children`, and native button/anchor attributes appropriately.
- Keyboard/focus: rely on native semantics + the global `:focus-visible` outline; don't remove it.
- Do NOT restyle buttons elsewhere — everything imports this. Only edit this file.

## Definition of done
- [ ] All variants/sizes render on-brand (pill, black border, hard shadow, press).
- [ ] `href` switches element to a link without type errors.
- [ ] Accessible focus + disabled states; label stays uppercase/bold.
- [ ] `tsc --noEmit` clean; only `components/ui/button.tsx` changed.
