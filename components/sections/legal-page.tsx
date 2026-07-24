import type { ReactNode } from "react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";

/** One top-level section of a legal document (rendered as an anchored article). */
export type LegalSection = {
  /** Stable slug used for the in-page anchor + "On this page" table of contents. */
  id: string;
  /** Uppercase Anton section heading. */
  heading: string;
  /** Body content: author paragraphs / lists as DIRECT children (see proseClass). */
  body: ReactNode;
};

/*
  Shared long-form reading styles for legal body copy. Applied to a wrapper so we
  never need per-element classes on every <p>/<li> (and never need to touch the
  shared globals.css, which is mid-edit elsewhere). Vertical rhythm comes from
  space-y on the DIRECT children, so author each block (<p>, <ul>, <ol>) as a
  direct child of the body node. Full-contrast ink text, generous line-height,
  and on-brand underlined links / disc bullets.
*/
const proseClass =
  "space-y-4 text-[1.05rem] leading-[1.75] text-ink " +
  "[&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2 [&_a]:break-words " +
  "[&_strong]:font-bold [&_strong]:text-ink " +
  "[&_code]:rounded [&_code]:bg-ink/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] " +
  "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:marker:text-ink " +
  "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol]:marker:text-ink";

/**
 * On-brand shell for the site's long-form legal pages (Terms, Privacy).
 *
 * Echoes the site's neo-brutalist system (Anton display headings, DM Sans body,
 * thick ink rules, hard offset shadows, brand color-blocking) but tuned for
 * readability: a narrow prose column, an uppercase-Anton heading per section, and
 * generous spacing.
 *
 * The whole page sits in its own `relative z-40` stacking context with opaque
 * brand surfaces, so the global draggable shape field (an inset-0 z-30 overlay
 * mounted in app/layout.tsx) stays BEHIND the dense legal copy and never drifts
 * over the text, while the fixed music toggle (z-40, later in the DOM) and the
 * skip link (z-100) stay on top and fully usable. `flex-1` lets the page grow to
 * fill the viewport so the shared footer is always grounded at the bottom.
 */
export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  /** Human-readable date, e.g. "July 21, 2026". */
  lastUpdated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div id="top" className="relative z-40 flex flex-1 flex-col bg-paper text-ink">
      {/* Static, on-brand header: brain logo (home), centered wordmark, back link. */}
      <header className="border-b-[2.5px] border-ink bg-paper">
        <Container className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 md:py-4">
          <Link
            href="/"
            aria-label="Smart Fella or Fart Smella, home"
            className="col-start-1 inline-flex items-center justify-self-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static /public asset */}
            <img
              src="/logo.png"
              alt=""
              draggable={false}
              className="h-10 w-auto select-none md:h-12"
            />
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static /public asset */}
          <img
            src="/wordmark.png"
            alt="Smart Fella or Fart Smella"
            draggable={false}
            className="col-start-2 hidden h-10 w-auto max-w-full select-none justify-self-center object-contain md:block lg:h-12"
          />
          <Link
            href="/"
            className="col-start-3 inline-flex shrink-0 items-center gap-2 justify-self-end rounded-full border-[2.5px] border-ink bg-yellow px-4 py-2 text-sm font-bold uppercase leading-none tracking-[0.02em] btn-press"
          >
            <span aria-hidden>←</span> Back to the test
          </Link>
        </Container>
      </header>

      <main id="main" className="flex-1">
        {/* Title band: signature yellow color-block, ink rule below. */}
        <section className="border-b-[2.5px] border-ink bg-yellow">
          <Container size="prose" className="py-14 md:py-20">
            <Eyebrow>Legal</Eyebrow>
            <Heading as={1} size="xl" className="mt-4">
              {title}
            </Heading>
            <p className="mt-6 inline-flex items-center rounded-full border-[2.5px] border-ink bg-paper px-4 py-1.5 text-sm font-bold uppercase tracking-[0.02em] shadow-hard-xs">
              Last updated: {lastUpdated}
            </p>
          </Container>
        </section>

        {/* Body: prose column on paper. */}
        <section className="bg-paper">
          <Container size="prose" className="py-14 md:py-20">
            <div className={proseClass}>{intro}</div>

            {/* On this page: quick jump menu for a long document. */}
            <nav
              aria-label="On this page"
              className="mt-10 rounded-2xl border-[2.5px] border-ink bg-cream p-6 shadow-hard-sm"
            >
              <Eyebrow className="text-ink/70">On this page</Eyebrow>
              <ol className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {sections.map((section, index) => (
                  <li key={section.id} className="flex gap-2 text-[0.95rem] leading-snug">
                    <span aria-hidden className="font-bold tabular-nums text-ink/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <a
                      href={`#${section.id}`}
                      className="font-semibold text-ink underline decoration-2 underline-offset-2 hover:text-ink/70"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Sections. */}
            <div className="mt-14 space-y-12">
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-heading`}
                  className="scroll-mt-[6rem]"
                >
                  <Heading
                    as={2}
                    size="sm"
                    className="flex items-baseline gap-3"
                  >
                    <span aria-hidden className="text-ink/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span id={`${section.id}-heading`}>{section.heading}</span>
                  </Heading>
                  <div className={`mt-5 ${proseClass}`}>{section.body}</div>
                </section>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
