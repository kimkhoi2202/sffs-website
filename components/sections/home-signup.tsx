import { GetAccessForm } from "@/components/quiz/get-access-form";

/*
  ============================================================================
  THE COPY. Three strings, and they carry the whole page.
  ============================================================================

  Change these to change the offer. Nothing else on the page says what a signup
  gets you, so this is the only place the promise lives.

  HEADLINE is an array because each entry is rendered as its own line. Keep one
  sentence per entry: the break belongs between the sentences, and leaving it to
  the browser put it mid-sentence after "IS".

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
const HEADLINE = ["The game is ready.", "Are you?"];
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
 *
 * THE FOOTER OVERLAP. The site footer pulls itself up over the end of whatever
 * precedes it with a negative top margin (-60px, -80px at sm, -96px at md,
 * cancelled by matching padding so it never moves layout). That is what lets
 * its wave sit ON the previous section's colour instead of below it. On a long
 * page that is the whole point; on a 100dvh landing screen it means the last
 * 60 to 96px of the FIRST VIEWPORT is footer, which is why blue was visible on
 * load even though the yellow section was already exactly viewport-height.
 *
 * The section therefore grows by exactly that overlap and hands the same amount
 * back as bottom padding. Height becomes 100dvh + overlap, so the footer's top
 * lands precisely on the fold and the wave begins one pixel below it; and
 * because the flex centring box is height minus padding, adding the overlap to
 * both cancels out and the content sits exactly where it did before. The single
 * --footer-overlap variable is what keeps those two uses in step, and it must
 * keep matching the negative margins in components/sections/site-footer.tsx.
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
      className="relative isolate flex min-h-[calc(100dvh+var(--footer-overlap))] flex-col items-center justify-center overflow-hidden bg-yellow px-4 pb-[calc(6rem+var(--footer-overlap))] pt-8 text-center [--footer-overlap:60px] sm:pb-[calc(7rem+var(--footer-overlap))] sm:pt-12 sm:[--footer-overlap:80px] md:[--footer-overlap:96px]"
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
          BRAND LOCKUP: the brain mark stacked over the wordmark.

          Sourced from the site's own public/logo.png rather than copied out of
          the video repo. They are the same artwork: the pipeline's
          remotion/public/images/sffs-logo.png and this file both have an opaque
          area of exactly 811x597px, the video one simply padded into a square
          1024 canvas and this one cropped tight to 844x629.

          Proportions carried over from the two covers that stack the lockup
          vertically (introcut/Thumbnails.tsx ThumbV and ThumbSq), measured
          rather than eyeballed. There the brain's VISIBLE width is 0.34 to 0.46
          of the name block's width and the gap is 0.12 to 0.32 of it. This uses
          the tighter square-cover end of both, which is the closest analogue to
          a centred hero block. The gap below is literally the wordmark's own
          clamp scaled by 0.189, which is 0.12 of its width given the wordmark's
          1.576 aspect, so the two stay locked together at every size. The -6deg
          tilt and the hard zero-blur drop shadow are the mark's treatment in
          those same covers.

          NOTE: in the videos the brain sits BELOW the name, not above it. This
          is above by request; the sizes and spacing are the video's.

          The vh term in the brain's clamp is deliberately tighter than a pure
          0.49 scaling of the wordmark's. On a 640px-tall phone the strict ratio
          costs 73px of vertical budget and pushes the button into the floating
          music toggle, so the mark scales down there instead of the section
          growing. Wordmark sizing is untouched.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static public asset */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="h-[clamp(2.75rem,min(14.7vw,7.4vh),5.9rem)] w-auto max-w-full select-none object-contain rotate-[-6deg] [filter:drop-shadow(2px_2px_0_#000)] md:[filter:drop-shadow(3px_3px_0_#000)]"
          draggable={false}
        />

        {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static public asset */}
        <img
          src="/wordmark.png"
          alt="Smart Fella or Fart Smella"
          className="mt-[clamp(1.13rem,min(5.67vw,3.4vh),2.27rem)] h-[clamp(6rem,min(30vw,18vh),12rem)] w-auto max-w-full select-none object-contain"
          draggable={false}
        />

        {/*
          One <span class="block"> per sentence, so the line break is structural
          rather than whatever the container width happens to produce. Natural
          wrapping broke it after "IS", mid-sentence, and would have re-broken
          somewhere different at every width.

          Neither sentence needs the type scaled down to stay on one line. In
          this font at this tracking, "The game is ready." is 7.01em wide, so at
          the narrowest step (36px type in a 328px column at 360 wide) it
          occupies 252px and has 76px to spare; every larger step has more. The
          old wrap was never a size problem, it was that all 27 characters were
          a single run and 10.57em of them did not fit. Fallback wrapping is
          deliberately left enabled rather than forced off, so a future copy
          change that outgrows the column wraps instead of overflowing sideways.
        */}
        <h1 className="mt-[clamp(1rem,3vh,2rem)] font-display text-[clamp(2.25rem,min(9vw,7vh),3.75rem)] uppercase leading-[0.95] tracking-[-0.02em]">
          {HEADLINE.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        <p className="mt-[clamp(0.75rem,2vh,1.25rem)] text-pretty text-lg font-bold leading-snug sm:text-xl">
          {OFFER_LINE}
        </p>

        <GetAccessForm className="mt-[clamp(1.25rem,3vh,2rem)] w-full" />
      </div>
    </section>
  );
}
