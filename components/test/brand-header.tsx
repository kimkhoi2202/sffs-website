/**
 * The front door's branding: "The Official Smart Fella Test".
 *
 * ===========================================================================
 * WHY "OFFICIAL SMART FELLA TEST" AND NOT "OFFICIAL IQ TEST"
 * ===========================================================================
 * "Official IQ Test" was a plain falsehood twice over. Nobody certifies IQ
 * tests, so there is no body for "official" to refer to; and the instruments
 * this format is modelled on explicitly state that they are not IQ tests.
 *
 * "The Official Smart Fella Test" keeps the joke and makes the word true:
 * official refers to OUR OWN brand, and it really is the official one, because
 * there is only one. Nothing in the title, the metadata or the results copy
 * says IQ, and nothing should.
 *
 * Composed from existing brand assets rather than set as one long headline: an
 * "ARE YOU A" eyebrow, the wordmark PNG with the brain sticker on its corner
 * (the archived homepage's lockup, geometry and all), and a title pill beneath.
 * Read top to bottom that is the whole sentence, and it survives 360px, which a
 * single long Anton headline does not.
 */
import { cn } from "@/lib/utils";

/**
 * The wordmark with the brain sticker on its top-right corner.
 *
 * ===========================================================================
 * ONE COMPONENT, BECAUSE THE GEOMETRY WAS MEASURED AND MUST NOT DRIFT
 * ===========================================================================
 * The placement came from the archived homepage lockup, which measured it
 * against the video pipeline's own sticker usages rather than eyeballing it.
 * Three numbers carry it, and they are relative to the WORDMARK'S HEIGHT so the
 * whole thing scales as one object:
 *
 *   h-[46%]      the brain, just under half the wordmark's height
 *   top-[-26%]   how far it rides above the wordmark's top edge
 *   rotate-12    the tilt
 *
 * Those two percentages are the interesting pair: 46 up and 26 out leaves 20%
 * of the wordmark's height covered, which is 43% of the brain sitting ON the
 * letters and the rest overhanging. That overlap is the whole effect — much
 * less and it reads as a separate logo parked nearby, much more and it starts
 * eating the wordmark.
 *
 * The ink drop-shadow is what lets it sit on the letters without muddying them:
 * it gives the brain its own edge against the black type underneath.
 *
 * It is `absolute`, so it costs zero layout height and cannot push anything
 * down when it scales.
 *
 * SECOND CALLER, AND WHY THIS IS EXTRACTED: the results screen shows the same
 * lockup. Copying twenty characters of Tailwind into a second file is how two
 * lockups end up 4% apart six months later.
 */
export function BrandLockup({
  className,
  /** Any CSS length. Everything else is a percentage of it. */
  height,
}: {
  className?: string;
  height: string;
}) {
  return (
    <span className={cn("relative inline-block", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static public asset */}
      <img
        src="/wordmark.png"
        alt="Smart Fella or Fart Smella"
        style={{ height }}
        className="block w-auto max-w-full select-none object-contain"
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static public asset */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[-26%] h-[46%] w-auto select-none rotate-[12deg] [filter:drop-shadow(3px_3px_0_#000)] md:[filter:drop-shadow(4px_4px_0_#000)]"
        draggable={false}
      />
    </span>
  );
}

/**
 * How large the lockup is, which depends on what else is on the screen.
 *
 * ===========================================================================
 * TWO SIZES, BECAUSE THE PRE-TEST SCREENS ARE NOT THE SAME SHAPE
 * ===========================================================================
 * The opening fork is the front door and has two cards under it, so there is
 * room for the lockup to be the thing you see rather than a mark sitting
 * politely above the content. The grade picker has six buttons and a back link,
 * and the intro has three bullets and two controls; on a 360x640 phone those
 * already run past one viewport at the size they are now, which StepShell
 * documents as a deliberate trade. Growing the lockup as far there would push
 * them further, so they get the smaller of the two.
 *
 * BOTH ARE `min()` OF A WIDTH, A HEIGHT AND A CAP, and the height term is the
 * one doing the real work. The binding constraint on a phone is vertical — a
 * 360x640 screen is not short of width — so a size expressed only in `vw` grows
 * fastest exactly where there is least room for it. The `vh` term makes the
 * lockup back off on a short screen and the rem cap stops it becoming absurd on
 * a large monitor.
 *
 *   hero      147px at 360x640, 194 at 390x844, 207 at 1440x900
 *   compact    83px at 360x640, 110 at 390x844, 117 at 1440x900
 *
 * Measured maxima before anything overflows: 170 on the fork at 360x640, 280 at
 * both larger sizes, so `hero` keeps real headroom on the tightest screen.
 */
/**
 * How far the brain rides above the wordmark's box, as a fraction of the
 * wordmark's height. Must match the `top-[-26%]` in BrandLockup.
 *
 * Named and exported because the space above the lockup has to be measured
 * against the brain's VISUAL top, and the brain is not in the layout box at
 * all — it is absolutely positioned, so the h1's border box stops at the
 * wordmark and about a quarter of the sticker hangs above it invisibly as far
 * as layout is concerned.
 *
 * Anything that puts a gap above the lockup and measures it against the box
 * therefore comes out roughly this fraction of the lockup too small, and gets
 * WORSE as the lockup grows, because the overhang scales with it. Measured on
 * screen before this fix: 12px of margin produced −12px of actual air at 360,
 * −27px at 390 and −31px at 1440. The pill was not near the brain, it was
 * behind it.
 *
 * The same class of mistake as the letter badges on the option cards, where a
 * rounded corner meant the visual edge and the box edge were not the same
 * thing either.
 */
export const BRAIN_OVERHANG = 0.26;

const LOCKUP_HEIGHT = {
  hero: "min(52vw, 23vh, 16rem)",
  compact: "min(38vw, 13vh, 9rem)",
} as const;

/**
 * The title pill's TYPE size. Its padding is in `em`, so the whole pill grows
 * from this one number and its proportions cannot drift into a wide thin bar.
 *
 * Sized the same way as the lockup and for the same reason: the height term
 * wins on a phone, because that is where the space runs out. The two scale
 * together, so the pill stays in proportion to the mark above it at every
 * viewport instead of being right at one width and wrong at the rest.
 *
 * IF SOMETHING HAS TO GIVE ON A SHORT PHONE, IT IS THIS. The pill is the name
 * of the thing and the cards are the thing to do, so the height terms here are
 * deliberately tighter than the lockup's — it backs off first.
 */
const PILL_SIZE = {
  hero: "min(3.8vw, 2.2vh, 1.3rem)",
  compact: "min(3vw, 1.5vh, 1rem)",
} as const;

export function BrandHeader({
  className,
  size = "compact",
}: {
  className?: string;
  size?: keyof typeof LOCKUP_HEIGHT;
}) {
  return (
    <div className={cn("flex w-full flex-col items-center text-center", className)}>
      {/*
        THE PILL LEADS, and it is sized to hold its own rather than caption.

        Under a lockup this large a small pill read as something left behind by
        an earlier layout. It is the NAME OF THE THING, so it goes first and
        works as a kicker: what this is, then whose it is. It also gives the eye
        somewhere small to land before the wordmark, which is by far the loudest
        thing on the screen.

        PADDING IS IN `em`, so it is a fixed multiple of the type size and the
        pill keeps its shape at every viewport. Scaling the two independently is
        how a pill turns into a wide thin bar at one width and a lozenge at
        another.

        The border stays at a fixed 2.5px rather than scaling: it is the brand
        keyline, the same weight as every other bordered surface in the flow,
        and a hairline that grows with the text would stop matching them.

        THE WIDTH TERM IS SET BY THE LABEL, NOT BY TASTE. "The Official Smart
        Fella Test" is twenty-nine characters at this tracking, which measures
        about 22x the type size, and the first version of this sized the type
        big enough that it wrapped to two lines inside the pill on a 390px
        phone — a bar with the name broken across it, which is worse than a
        small pill. 3.8vw keeps the label on one line at every width tested,
        and `whitespace-nowrap` makes a future overflow visible rather than
        silently re-wrapping.

        Orange is the existing --color-orange (#ff7a1a) added for the floating
        sound button, not a second orange. The label stays INK, not paper:
        white on this orange is about 2.5:1 and fails, ink is about 8:1. The
        sound button already pairs the same orange with a black icon. No shadow,
        like everything else on these screens that is not a control.
      */}
      <span
        style={{ fontSize: PILL_SIZE[size], padding: "0.62em 1.25em" }}
        className="inline-block whitespace-nowrap rounded-full border-[2.5px] border-ink bg-orange font-sans font-extrabold uppercase leading-none tracking-[0.12em] text-ink"
      >
        The Official Smart Fella Test
      </span>

      {/*
        THIS IS THE PAGE'S H1, and it has to be, because the fork screen's own
        headline was removed: the two cards say "I'm a grown-up" and "I'm a kid"
        and a heading above them was restating the question they already ask.
        Something still has to carry the document's heading, and the honest
        candidate is the thing that IS the page's title.

        The eyebrow is inside the h1 rather than above it so the accessible name
        reads "Are you a Smart Fella or Fart Smella", which is the actual title,
        rather than leaving "Are you a" stranded as loose text next to a heading
        that starts mid-sentence.
      */}
      {/*
        The margin carries the brain's overhang, so what is left over is real
        air between the pill and the top of the sticker. Because it is written
        in terms of the same expression that sizes the lockup, it tracks every
        breakpoint instead of being correct at one width and tight at the rest.
      */}
      <h1
        style={{ marginTop: `calc(${BRAIN_OVERHANG} * ${LOCKUP_HEIGHT[size]} + 0.25rem)` }}
        className="flex flex-col items-center"
      >
        <span className="eyebrow text-ink/70">Are you a</span>

        <BrandLockup className="mt-2" height={LOCKUP_HEIGHT[size]} />
      </h1>
    </div>
  );
}

/**
 * The compact version, for the runner's bar where horizontal space at 360 and
 * vertical space everywhere are both scarce.
 *
 * `hideLabelOnSmall` drops the wordmark below 480px and lets the brain mark
 * carry the brand alone, which is what a mark is for. That is what keeps the
 * bar's three groups (brand, clock, counter and quit) from colliding on the
 * narrowest phone.
 */
export function BrandMark({
  className,
  hideLabelOnSmall,
}: {
  className?: string;
  hideLabelOnSmall?: boolean;
}) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static public asset */}
      <img src="/logo.png" alt="" aria-hidden className="h-6 w-auto select-none" draggable={false} />
      <span
        className={cn(
          "whitespace-nowrap font-sans text-[0.65rem] font-extrabold uppercase leading-none tracking-[0.1em] text-ink/70",
          hideLabelOnSmall && "hidden sm:inline",
        )}
      >
        Smart Fella Test
      </span>
      <span className="sr-only">The Official Smart Fella Test</span>
    </span>
  );
}
