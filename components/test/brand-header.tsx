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

export function BrandHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col items-center text-center", className)}>
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

        The lockup leads and the pill captions it. Reading order is the sentence
        the brand actually makes: "Are you a Smart Fella or Fart Smella" first,
        then what the page does with that question.
      */}
      <h1 className="flex flex-col items-center">
        <span className="eyebrow text-ink/70">Are you a</span>

        {/*
          The brain mark sits on the wordmark's top-right corner as a sticker,
          absolutely positioned so it costs zero layout height. Placement and
          the +12deg tilt carry over from the archived homepage lockup, which
          measured them against the video pipeline's own sticker usages.
        */}
        <span className="relative mt-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static public asset */}
          <img
            src="/wordmark.png"
            alt="Smart Fella or Fart Smella"
            className="block h-[clamp(3.5rem,15vw,7rem)] w-auto max-w-full select-none object-contain"
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
      </h1>

      {/*
        The title pill, captioning the lockup.

        `mt-3` and not more: the wordmark's PNG carries its own transparent
        padding below the glyphs, so the optical gap is larger than the number
        suggests. Measured, not guessed, at 360 and at 1440.

        Orange is the existing --color-orange (#ff7a1a) added for the floating
        sound button, not a second orange. The label stays INK, not paper:
        white on this orange is about 2.5:1 and fails, ink is about 8:1. The
        sound button already pairs the same orange with a black icon.
      */}
      <span className="mt-3 inline-block rounded-full border-[2.5px] border-ink bg-orange px-3.5 py-1.5 font-sans text-[0.7rem] font-extrabold uppercase leading-none tracking-[0.12em] text-ink">
        The Official Smart Fella Test
      </span>
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
