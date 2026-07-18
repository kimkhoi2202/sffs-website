# Subagent Team — 50 specialists for the "Closer" (30MPC-style) design system

A reusable team of 50 Cursor subagents lives in `.cursor/agents/`. Each has ONE job and a clear
file-ownership boundary, so they can build, extend, and QA this neo-brutalist design system — and
help you spin up **another site in the same style** without collisions.

- **How to invoke:** "Use the `<name>` subagent to …". Cursor also auto-delegates based on each
  agent's `description`.
- **Shared foundation:** every agent reads `design-reference/AGENT_BRIEF.md`,
  `design-reference/design-tokens.md`, and `design-reference/components/inventory.md` first.
- **Content policy (all agents):** clone the *design system only*. 100% original placeholder copy
  for the brand **"Closer"**; media via `<Placeholder>`/`<Avatar>`/`lucide-react`. Never reproduce
  30MPC's copy, names, numbers, logo, or imagery.
- **Collision rule:** each agent edits ONLY its owned file(s); shared tokens route through
  `design-system-steward`; navigation data routes through `nav-data-architect`.

---

## A. Design foundation & tokens (6)
| Agent | Owns / focus |
|---|---|
| `design-system-steward` | `app/globals.css` `@theme` + all tokens/utilities (source of truth) |
| `typography-specialist` | Anton/DM Sans, type scale, heading hierarchy, eyebrows |
| `color-system-specialist` | palette + section color-blocking rhythm + contrast |
| `spacing-layout-specialist` | spacing scale, container widths, section padding cadence |
| `shadow-border-specialist` | thick black borders + hard zero-blur shadows + `press` |
| `motion-interaction-specialist` | press feel, marquees, easings, reduced-motion |

## B. UI primitives (10) — `components/ui/*`
| Agent | Owns |
|---|---|
| `button-builder` | `button.tsx` |
| `card-builder` | `card.tsx` |
| `badge-builder` | `badge.tsx` |
| `heading-eyebrow-builder` | `heading.tsx` + `eyebrow.tsx` |
| `input-field-builder` | `input.tsx` (Input/Textarea/Label/Field) |
| `avatar-builder` | `avatar.tsx` |
| `placeholder-media-builder` | `placeholder.tsx` (media policy enforcer) |
| `container-builder` | `container.tsx` |
| `section-primitive-builder` | `section.tsx` |
| `marquee-primitive-builder` | `marquee.tsx` |

## C. Layout & navigation (4)
| Agent | Owns |
|---|---|
| `site-header-builder` | `components/layout/site-header.tsx` (+ mobile menu, Base UI) |
| `site-footer-builder` | `components/layout/site-footer.tsx` |
| `logo-builder` | `components/layout/logo.tsx` (original wordmark) |
| `nav-data-architect` | `lib/site.ts` (nav + brand config; no dead links) |

## D. Section builders (24) — `components/sections/*`
Hero/intro: `hero-builder`, `hero-split-builder`, `page-hero-builder`, `book-hero-builder`
Social proof: `logo-cloud-builder`, `stat-band-builder`, `testimonials-builder`, `quote-feature-builder`
Feature/content: `feature-grid-builder`, `feature-tabs-builder` (Base UI Tabs), `bento-builder`, `steps-builder`, `comparison-builder`, `video-feature-builder`, `marquee-headline-builder`
Conversion: `pricing-builder`, `faq-builder` (Base UI Accordion), `cta-band-builder`, `newsletter-signup-builder`
Domain: `course-card-builder`, `podcast-builder`, `instructors-builder`, `resource-grid-builder`, `sponsor-tiers-builder`

## E. Assembly, copy & QA (6)
| Agent | Focus |
|---|---|
| `page-assembler` | composes `app/<route>/page.tsx` from sections; color rhythm; anchors; metadata |
| `copywriter-brand-voice` | original "Closer" voice copy across pages/sections |
| `accessibility-auditor` | semantics, keyboard, focus, contrast, ARIA, reduced-motion |
| `responsive-qa-specialist` | layout integrity across breakpoints (base→xl) |
| `visual-fidelity-reviewer` | final taste gate vs `design-tokens.md` signatures |
| `base-ui-integration-specialist` | wires/styles Base UI primitives accessibly + on-brand |

---

## Suggested workflow to build a new page in this style
1. `nav-data-architect` — add the route to `lib/site.ts` (no dead links).
2. `page-assembler` — draft the section order + backgrounds + metadata.
3. Relevant `*-builder`s — add/adjust any missing sections (each in its own file).
4. `copywriter-brand-voice` — pass over all copy for voice + originality.
5. `visual-fidelity-reviewer` → `accessibility-auditor` → `responsive-qa-specialist` — final QA gates.
