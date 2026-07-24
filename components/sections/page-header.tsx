import Link from "next/link";

import { Container } from "@/components/ui/container";

/**
 * Static, on-brand page header shared by the standalone content pages
 * (Support, and the internal App Store copy sheet). It mirrors the header baked
 * into the LegalPage shell so Support/Privacy/Terms all read as one family:
 * brain logo (home), centered wordmark, and a chunky "back" pill on the right.
 *
 * The back link defaults to the home quiz but is overridable so an internal
 * page can point somewhere else.
 */
export function PageHeader({
  backHref = "/",
  backLabel = "Back to the test",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
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
          href={backHref}
          className="col-start-3 inline-flex shrink-0 items-center gap-2 justify-self-end rounded-full border-[2.5px] border-ink bg-yellow px-4 py-2 text-sm font-bold uppercase leading-none tracking-[0.02em] btn-press"
        >
          <span aria-hidden>&larr;</span> {backLabel}
        </Link>
      </Container>
    </header>
  );
}
