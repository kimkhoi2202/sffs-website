import { GetAccessForm } from "@/components/quiz/get-access-form";

/*
  ============================================================================
  THE COPY. Two strings, and they carry the whole page.
  ============================================================================

  Change these to change the offer. Nothing else on the page says what a signup
  gets you, so this is the only place the promise lives.

  WHAT ACTUALLY HAPPENS ON SUBMIT: one row is written to Aurora
  (sffs.email_signups). That is all. No email is sent, no link, no invite, no
  download, no TestFlight code. There is no transactional email provider wired
  up, and as of 2026-07-31 there is no public build URL to send even if there
  were one (the app is not on the App Store or Google Play).

  SO THE COPY MAY: state that the game is finished, and promise a FUTURE
  contact. Both are true, and "we'll get you in" is future tense on purpose.

  THE COPY MUST NOT: imply anything is delivered by submitting the form. No
  "get instant access", no "we'll send you a link", no "check your email", no
  discount or percentage of any kind. The headline deliberately says the GAME
  is ready rather than saying YOU now have it, because the second one would be
  a promise this pipeline cannot keep.
*/
const HEADLINE = "The game is ready. Are you?";
const OFFER_LINE = "Drop your email and we'll get you in.";

/**
 * The whole homepage: one screen, one job, get the email.
 *
 * Deliberately NOT `.fella-hero`. That class is what page-shapes.tsx measures to
 * mount the draggable shape field and what engagement-tracker.tsx gates its
 * scroll-depth/section observers on. Both correctly no-op here: throwable shapes
 * over the only tap target on the page is a conversion bug waiting to happen,
 * and scroll depth is meaningless on a page with nothing to scroll to.
 *
 * HEIGHT: `100dvh`, matching what commit 3304c6b did to the old waitlist panel.
 * Not `vh`: on mobile `100vh` is the LARGE viewport, measured as if the browser
 * chrome were hidden, so at first paint (chrome showing) a 100vh block is taller
 * than the screen and shoves the button under the fold. Not `svh` either, which
 * this section used until now: svh is frozen at the small (chrome-showing)
 * height, so once the URL bar scrolls away the panel is short and the footer
 * wave peeks up into the fold. `dvh` tracks the live viewport, so it equals svh
 * at first paint (button visible) AND grows to fill once the chrome hides. It is
 * also what makes a desktop window resize correct: the panel re-fits live.
 *
 * min-height, not height, so the stack can still grow past the fold on a very
 * short or zoomed viewport instead of clipping the button.
 */
export function HomeSignup() {
  return (
    /*
      Vertical padding is ASYMMETRIC on purpose, and the copy above is kept
      short on purpose. Both serve the same constraint: the floating music
      toggle (app/layout.tsx) is a fixed 56px puck inset 24px from the
      bottom-right corner, so at 360x640 anything past roughly y=550 lands
      underneath it. The larger bottom pad shrinks the flex-centering box and
      lifts the block, but that only helps while the stack still FITS the box.
      Re-check 360x640 after any copy change.

      Every vertical step below is clamped against BOTH vw and vh. The vh half
      is what keeps a short-but-wide viewport (1024x768, a landscape tablet)
      honest: without it the wordmark and headline size off width alone, the
      stack outgrows the fold, and the button drops below it.
    */
    <section
      data-section="signup"
      className="relative isolate flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-yellow px-4 pb-24 pt-8 text-center sm:pb-28 sm:pt-12"
    >
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
        {/*
          The wordmark is the brand, so it leads at real size instead of sitting
          above the headline like a footnote. Sized by height against min(vw,vh)
          so it grows with the screen but never eats the vertical budget the
          form needs on a short viewport.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static public asset */}
        <img
          src="/wordmark.png"
          alt="Smart Fella or Fart Smella"
          className="h-[clamp(6rem,min(30vw,18vh),12rem)] w-auto max-w-full select-none object-contain"
          draggable={false}
        />

        <h1 className="mt-[clamp(1rem,3vh,2rem)] font-display text-[clamp(2.25rem,min(9vw,7vh),3.75rem)] uppercase leading-[0.95] tracking-[-0.02em]">
          {HEADLINE}
        </h1>

        <p className="mt-[clamp(0.75rem,2vh,1.25rem)] text-pretty text-lg font-bold leading-snug sm:text-xl">
          {OFFER_LINE}
        </p>

        <GetAccessForm className="mt-[clamp(1.25rem,3vh,2rem)] w-full" />

        <p className="mt-4 text-sm font-medium text-ink/70">
          No spam. We never sell your info.
        </p>
      </div>
    </section>
  );
}
