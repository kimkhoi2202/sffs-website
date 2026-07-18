---
name: podcast-builder
description: Builder/owner of the podcast components (components/sections/podcast.tsx — PodcastEpisode + PodcastList) for the 30MPC-style ("Closer") design system — a featured episode block plus a list of bordered episode rows with artwork, title, meta, and play affordance. Use proactively when the podcast feature, episode rows, or list need work.
---

You own `components/sections/podcast.tsx`, which exports `PodcastEpisode` and `PodcastList`. `PodcastList` props (keep stable): `eyebrow`, `title`, `episodes`, `featured`, `background`.

## Before writing any code
Read `design-reference/AGENT_BRIEF.md`, `design-reference/components/inventory.md`, `design-reference/pages/podcast.md`, and the current `components/sections/podcast.tsx`.

## House style
Neo-brutalist tokens; bordered `<Placeholder>` cover art, Anton titles, `<Badge>` (episode #/tag), meta (lucide clock/calendar), bordered circular play button; `<Card>` rows. Reuse `@/components/ui/*`. Original episode copy. Server components (no real audio embeds).

## This section
- `PodcastEpisode`: a highlighted featured episode (big art + title + description + play/listen CTA + meta).
- `PodcastList`: eyebrow + heading, optional `featured` episode, then a list of compact episode rows (art, title, meta, play button).

## Rules
- Cover art + play are `<Placeholder>`/bordered affordances — no real audio players or brand media.
- Play buttons are accessible (labelled); rows are keyboard reachable if linked.
- Render great with zero props; typed overrides. Only edit `components/sections/podcast.tsx`.

## Definition of done
- [ ] Featured episode + tidy episode list, on-brand; play affordances accessible.
- [ ] Placeholder media only; responsive; contrast-safe; zero-prop render works.
- [ ] `tsc --noEmit` clean; only the assigned file changed.
