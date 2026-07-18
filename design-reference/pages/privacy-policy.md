# Build Blueprint — Privacy Policy (`/privacy-policy`)

> Long-form legal / prose page for the placeholder brand **Closer**. This is the one
> page type that is *mostly hand-written prose* inside a narrow text column — **not** an
> assembly of `components/sections/*`. Use only the `PageHero` section at the top and an
> optional `CtaBand` at the bottom; everything in between is semantic HTML styled with
> Tailwind utilities + the `<Heading>` primitive inside `<Container size="prose">`.

---

## Purpose

Give Closer a credible, on-brand legal home for its privacy practices. It must read like a
real privacy policy (scannable section headings, plain-language paragraphs, bulleted lists)
while staying visually consistent with the rest of the site (Anton uppercase headings, DM
Sans body, calm color-blocked hero, thick-border closing CTA). **All copy is original
placeholder boilerplate** — clearly generic, written from scratch, never lifted from any
real 30MPC/other source.

## Route

```
app/privacy-policy/page.tsx
```

Server Component (no `"use client"` — this page is static prose with zero interactivity).
`SiteHeader` / `SiteFooter` are already mounted in the root layout; **do not** add them here.

## Suggested metadata (original copy)

```tsx
export const metadata = {
  title: "Privacy Policy | Closer",
  description:
    "How Closer collects, uses, and protects your information across our sales-training playbooks, courses, and coaching — and the choices and rights you have over your data.",
};
```

## `last updated` placeholder

Define one constant and reuse it in the hero subtitle (and, if you like, in the
"Changes to This Policy" section). Placeholder date is fine:

```tsx
const LAST_UPDATED = "January 6, 2026";
```

---

## Page structure (top → bottom)

1. **`PageHero`** — title `"Privacy Policy"`, a small "last updated" subtitle.
2. **Prose article** — a `<Section background="paper">` whose content sits in a
   `<Container size="prose">` (44rem / ~700px text column): an intro paragraph, an optional
   jump-link table of contents, then ~10 anchored `<section>` blocks with `<Heading>` titles
   and paragraphs/lists.
3. **Closing `CtaBand`** (small) — a calm "questions about your privacy?" contact prompt.

Color rhythm: `cream` hero → `paper` prose → `ink` closing band (adjacent blocks contrast;
no two identical bordered blocks touch).

---

## 1. PageHero (top)

Use `align="left"` on purpose: `align="center"` renders decorative sticker badges
("Playbooks / Live coaching / Templates") which are off-tone for a legal page. Pass
`cta={null}` (a legal header needs no button). Carry the date in `subtitle`.

```tsx
import { PageHero } from "@/components/sections/page-hero";

<PageHero
  eyebrow="Legal"
  title="Privacy Policy"
  subtitle={`Last updated: ${LAST_UPDATED}`}
  cta={null}
  align="left"
  background="cream"
/>
```

`PageHero` renders the `<h1>` for the page, so the prose below must start its section titles
at `<Heading as={2}>` (h2) to keep the heading outline valid.

---

## 2. Prose article

### Wrapper

`Section` already wraps its children in a `Container`, so the cleanest way to get the
44rem text column the brief calls for is `container="prose"`. (This is exactly equivalent to
`container={false}` + an explicit `<Container size="prose">` — either satisfies "laid out
inside `<Container size="prose">`".)

```tsx
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
// (equivalent explicit form) import { Container } from "@/components/ui/container";

<Section background="paper" padding="lg" container="prose">
  <article className="space-y-12">
    {/* intro + TOC + sections go here */}
  </article>
</Section>
```

### Prose styling recipe (IMPORTANT — no typography plugin)

This project has **no `@tailwindcss/typography`**, so a bare `prose` class does nothing.
`Container size="prose"` only sets the max-width. Style every text element explicitly:

| Element | Classes |
|---|---|
| Article wrapper | `space-y-12` (vertical rhythm between sections) |
| Intro paragraph | `text-lg leading-relaxed` |
| Section wrapper | `<section id="...">` + `scroll-mt-24` (so anchor jumps clear the sticky header) |
| Section title | `<Heading as={2} size="sm">` (Anton, uppercase, ~1.25–1.75rem) |
| Body block under a title | `mt-4 space-y-4 text-base leading-relaxed` |
| Bulleted list | `mt-4 list-disc space-y-2 pl-6` |
| Small meta text | `text-sm text-gray-600` |
| Inline emphasis | `font-semibold` (avoid new colors; keep ink-on-paper for readability) |
| Optional divider | `<hr className="border-t border-gray-200" />` between sections (optional) |

Keep body text `text-ink` on the `paper` background for contrast; reserve `text-gray-600`
for secondary meta lines only.

### Intro paragraph (original boilerplate)

One short, plain-language opener before the first section, e.g.:

> This Privacy Policy explains what information Closer collects, why we collect it, and the
> choices you have. It applies to our website, newsletters, courses, and coaching. By using
> Closer, you agree to the practices described below. *(Rewrite in your own words — this is
> placeholder text.)*

### Optional: in-page table of contents

Nice-to-have on long legal pages. Render an on-brand jump-link list (bordered card) right
after the intro. Anchor `href`s must match each section `id`:

```tsx
import { Card } from "@/components/ui/card";

<Card color="cream" shadow="sm" padding="md" className="not-prose">
  <p className="eyebrow">On this page</p>
  <ul className="mt-3 space-y-1 text-sm font-medium">
    <li><a href="#information-we-collect" className="underline underline-offset-4 hover:opacity-70">Information We Collect</a></li>
    {/* …one link per section id… */}
  </ul>
</Card>
```

---

## Section headings + 1-line ORIGINAL placeholder summaries

Ten standard sections. Each is a `<section id="…">` with `<Heading as={2} size="sm">` and
the placeholder body below. **Summaries are generic boilerplate written from scratch —
replace/expand as desired, but keep it original.**

1. **Information We Collect** (`id="information-we-collect"`)
   — The account, usage, device, and payment details we gather when you sign up, browse, or
   interact with Closer playbooks and coaching.

2. **How We Use Your Information** (`id="how-we-use-your-information"`)
   — We use your data to deliver the product, personalize your learning, process payments,
   send updates you opt into, and improve our sales-training content.

3. **Cookies & Tracking Technologies** (`id="cookies"`)
   — We use cookies, pixels, and similar tools to remember your preferences and understand
   how the site is used; you can control these through your browser settings.

4. **How We Share Information** (`id="how-we-share-information"`)
   — We share data only with service providers and partners who help us run Closer, or when
   required by law — and we do not sell your personal information.

5. **Your Privacy Rights & Choices** (`id="your-rights"`)
   — You can access, correct, export, or delete your information and manage your marketing
   preferences at any time by contacting us.

6. **Data Retention** (`id="data-retention"`)
   — We keep your information only as long as needed to provide the service and meet legal
   obligations, then delete or anonymize it.

7. **Data Security** (`id="data-security"`)
   — We use reasonable safeguards to protect your information, though no method of
   transmission or storage is ever completely secure.

8. **Children's Privacy** (`id="childrens-privacy"`)
   — Closer is intended for adults, and we do not knowingly collect personal information
   from children under the applicable age of consent.

9. **Changes to This Policy** (`id="changes"`)
   — We may update this policy from time to time and will revise the "last updated" date and,
   for material changes, provide additional notice.

10. **Contact Us** (`id="contact"`)
    — Questions or requests about your privacy? Reach the Closer team at the contact details
    in this section (placeholder email/address).

> Optional 11th section if you want extra realism: **International Data Transfers**
> (`id="international-transfers"`) — "Your information may be processed in countries other
> than your own, with appropriate protections in place." Keep it original if added.

### Section block pattern

```tsx
<section id="information-we-collect" className="scroll-mt-24">
  <Heading as={2} size="sm">Information We Collect</Heading>
  <div className="mt-4 space-y-4 text-base leading-relaxed">
    <p>{/* original boilerplate paragraph */}</p>
    <ul className="mt-4 list-disc space-y-2 pl-6">
      <li>{/* e.g. Account details you provide (name, email) */}</li>
      <li>{/* e.g. Usage and device information */}</li>
      <li>{/* e.g. Payment information handled by our processor */}</li>
    </ul>
  </div>
</section>
```

Repeat for all ten sections inside the `<article className="space-y-12">` wrapper.

---

## 3. Closing CtaBand (small contact note)

End with a compact, calm contact prompt — not the loud marketing CTA. Hide the sticker
badge and the secondary button, and point the single action at `/contact`. Use `ink` so it
contrasts the `paper` prose and adds a strong footer cap.

```tsx
import { CtaBand } from "@/components/sections/cta-band";

<CtaBand
  title="Questions about your privacy?"
  subtitle="We're happy to help. Reach the Closer team and we'll walk you through your data, your choices, and your rights."
  primaryCta={{ label: "Contact us", href: "/contact" }}
  secondaryCta={null}
  badge={null}
  align="center"
  background="ink"
/>
```

(Alternatively, skip `CtaBand` and end the prose with a simple styled contact note inside the
`Contact Us` section — a bordered `Card color="cream"` with a placeholder email. The `CtaBand`
is preferred for a cleaner page cap and consistent footer rhythm.)

---

## Assembly sketch (`app/privacy-policy/page.tsx`)

```tsx
import { PageHero } from "@/components/sections/page-hero";
import { CtaBand } from "@/components/sections/cta-band";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";

export const metadata = {
  title: "Privacy Policy | Closer",
  description:
    "How Closer collects, uses, and protects your information — and the choices and rights you have over your data.",
};

const LAST_UPDATED = "January 6, 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle={`Last updated: ${LAST_UPDATED}`}
        cta={null}
        align="left"
        background="cream"
      />

      <Section background="paper" padding="lg" container="prose">
        <article className="space-y-12">
          <p className="text-lg leading-relaxed">{/* intro (original) */}</p>

          {/* optional TOC card */}

          <section id="information-we-collect" className="scroll-mt-24">
            <Heading as={2} size="sm">Information We Collect</Heading>
            <div className="mt-4 space-y-4 text-base leading-relaxed">
              {/* original boilerplate paragraphs + lists */}
            </div>
          </section>

          {/* …sections 2–10 in the same pattern… */}
        </article>
      </Section>

      <CtaBand
        title="Questions about your privacy?"
        subtitle="Reach the Closer team and we'll walk you through your data, your choices, and your rights."
        primaryCta={{ label: "Contact us", href: "/contact" }}
        secondaryCta={null}
        badge={null}
        align="center"
        background="ink"
      />
    </>
  );
}
```

---

## Build checklist (self-review)

- [ ] Only `app/privacy-policy/page.tsx` is created; shared files untouched.
- [ ] `PageHero` uses `align="left"`, `cta={null}`, title `"Privacy Policy"`, date in `subtitle`.
- [ ] Prose lives in `<Container size="prose">` (or `Section container="prose"`) — 44rem column.
- [ ] Section titles are `<Heading as={2} size="sm">` (page `h1` comes from `PageHero`).
- [ ] Every text element is explicitly styled (no reliance on a `prose` typography class).
- [ ] All ~10 sections present with anchor `id`s; TOC links (if used) match those ids.
- [ ] `scroll-mt-24` on sections so anchor jumps clear the sticky header.
- [ ] Closing `CtaBand` is calm (`badge={null}`, `secondaryCta={null}`, `background="ink"`).
- [ ] Color rhythm cream → paper → ink; adjacent blocks contrast.
- [ ] 100% original placeholder copy — no text lifted from any real source. Fully responsive.
```