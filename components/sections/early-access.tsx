import { GetAccessForm } from "@/components/quiz/get-access-form";
import { Badge } from "@/components/ui/badge";

/*
  ============================================================================
  THE OFFER LINE — the single place the proposition is worded.
  ============================================================================

  Change this one string to change the offer. Nothing else on the page states
  what a signup gets you.

  WHAT IT MAY SAY: only what a signup can actually deliver today. Submitting the
  form writes one row to Aurora (sffs.email_signups) and nothing else happens.
  There is no transactional email provider wired up, no discount code, no
  entitlement, and no payment step, so "early access to the game before it
  launches" is the strongest claim this page can honestly make.

  WHAT IT MUST NOT SAY: any percentage or discount ("50% off", "half price",
  "founder pricing"), any code, or anything that implies an email is on its way
  right now. Before a discount claim can honestly go here, all four of these
  have to exist: a transactional email provider that can actually reach these
  addresses, a code or entitlement worth sending, a paid thing for the discount
  to come off, and a decision on what "access" delivers and when.
*/
const OFFER_LINE = "Early access to the game before it launches.";

/**
 * The whole homepage: one screen, one job, get the email.
 *
 * Deliberately NOT `.fella-hero`. That class is what page-shapes.tsx measures to
 * mount the draggable shape field and what engagement-tracker.tsx gates its
 * scroll-depth/section observers on. Both correctly no-op here: throwable shapes
 * over the only tap target on the page is a conversion bug waiting to happen,
 * and scroll depth is meaningless on a page with nothing to scroll to.
 *
 * `100svh` (small viewport height), not dvh: this is the LANDING view, so it is
 * sized while the mobile URL bar is still showing. dvh would size to the taller
 * bar-hidden viewport and push the button under the fold on first paint, which
 * is the one thing this page cannot afford. min-height (not height) so the stack
 * can still grow past the fold on very short or zoomed viewports rather than
 * clipping the button.
 */
export function EarlyAccess() {
  return (
    /*
      Vertical padding is ASYMMETRIC on purpose. The floating music toggle
      (app/layout.tsx) is a fixed 56px puck inset 24px from the bottom-right
      corner, and on a short viewport (360x640) it landed on top of the "no
      spam" line. Since the stack is flex-centered, the BOTTOM pad is what
      lifts it: growing it shrinks the centering box from below and carries the
      whole block clear of the puck, at every height, without a height-based
      media query. Do not re-symmetrize this without re-checking 360x640.
    */
    <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-yellow px-4 pb-24 pt-8 text-center sm:pb-28 sm:pt-12">
      {/*
        The hero's perspective "receding floor" grid, kept so the page still
        reads as this brand and not as a generic squeeze page. Pure CSS, behind
        the z-10 content, pointer-events-none, and paused under reduced motion
        (see .fella-floor in globals.css).
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{ perspective: "560px", perspectiveOrigin: "50% 34%" }}
      >
        <div className="absolute inset-x-[-50%] bottom-[-12%] top-[34%] overflow-hidden [transform-origin:50%_0%] [transform:rotateX(70deg)]">
          <div
            className="fella-floor absolute inset-[-120%] opacity-[0.09]"
            style={{
              backgroundImage:
                "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>
        <div
          className="absolute inset-x-0 top-0 h-[56%]"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--color-yellow) 0%, var(--color-yellow) 24%, rgba(252,229,82,0) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center md:max-w-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static public asset */}
        <img
          src="/wordmark.png"
          alt="Smart Fella or Fart Smella"
          className="h-11 w-auto max-w-full select-none object-contain sm:h-14 md:h-[4.5rem]"
          draggable={false}
        />

        <Badge color="coral" size="md" shadow="hard" className="mt-6 rotate-[-2deg]">
          Early access
        </Badge>

        <h1 className="mt-5 font-display text-[clamp(2.25rem,9vw,3.5rem)] uppercase leading-[0.95] tracking-[-0.02em] md:text-[3.75rem]">
          Get in before everyone else
        </h1>

        <p className="mt-4 text-pretty text-lg font-bold leading-snug sm:text-xl md:text-2xl">
          {OFFER_LINE}
        </p>

        <p className="mt-3 text-pretty text-base font-medium leading-snug text-ink/75 md:text-lg">
          We&apos;re the fellas behind the brain quizzes. The game drops soon, and
          this list is how you get in first.
        </p>

        <GetAccessForm className="mt-6 w-full" />

        <p className="mt-4 text-sm font-medium text-ink/70">
          No spam, and we never sell your info.
        </p>
      </div>
    </section>
  );
}
