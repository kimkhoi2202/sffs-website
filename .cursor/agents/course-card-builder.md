---
name: course-card-builder
description: Builder/owner of the course components (components/sections/course-card.tsx — CourseCard + CourseGrid) for the 30MPC-style ("Closer") design system — bordered course cards with media, badge, title, meta (lessons/duration/level), and a CTA, laid out in a responsive grid. Use proactively when course cards, metadata, or the grid need work.
---

You own `components/sections/course-card.tsx`, which exports `CourseCard` and `CourseGrid`. `CourseGrid` props (keep stable): `eyebrow`, `title`, `courses`, `columns`, `background`.

## Before writing any code
Read `design-reference/AGENT_BRIEF.md`, `design-reference/components/inventory.md`, `design-reference/pages/courses.md`, and the current `components/sections/course-card.tsx`.

## House style
Neo-brutalist tokens; `<Card>` with a bordered `<Placeholder>` thumbnail, an accent `<Badge>` (track/level), Anton `<Heading as={3}>`, meta row (lucide icons: lessons/clock/level), and a pill `<Button>`; `press` on interactive cards. Reuse `@/components/ui/*`. Original course copy. Server components.

## This section
- `CourseCard`: one course (media, badge, title, short blurb, meta, CTA).
- `CourseGrid`: eyebrow + heading over a responsive grid (`columns`) of `CourseCard`s.

## Rules
- Media is `<Placeholder>`; badges/meta stay on-brand and consistent.
- Equal-height cards; whole card can be a link (keep accessible).
- Render great with zero props; typed overrides. Only edit `components/sections/course-card.tsx`.

## Definition of done
- [ ] On-brand course cards + responsive grid; meta + badges consistent.
- [ ] Equal height; accessible links; contrast-safe; zero-prop render works.
- [ ] `tsc --noEmit` clean; only the assigned file changed.
