import { Asterisk, Sparkles, Star, type LucideIcon } from "lucide-react";

import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

/** Full-bleed color block behind the banner (mirrors the `<Section>` background union). */
export type MarqueeHeadlineBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

export interface MarqueeHeadlineProps {
  /**
   * Phrase(s) to scroll. Pass a single string, or an array to alternate
   * multiple phrases around the loop. Falls back to defaults when omitted/empty.
   */
  text?: string | string[];
  /** Full-bleed color block behind the banner. */
  background?: MarqueeHeadlineBackground;
  /** Seconds per loop, lower is faster. */
  speed?: number;
  /** Reverse the scroll direction (left-to-right). */
  reverse?: boolean;
  /** Extra classes for the outer strip. */
  className?: string;
  /** Optional id for deep-linking. */
  id?: string;
}

const bgMap: Record<MarqueeHeadlineBackground, string> = {
  paper: "bg-paper text-ink",
  cream: "bg-cream text-ink",
  ink: "bg-ink text-paper",
  blue: "bg-blue text-ink",
  mint: "bg-mint text-ink",
  coral: "bg-coral text-ink",
  yellow: "bg-yellow text-ink",
  gray: "bg-gray-100 text-ink",
};

/** Original placeholder copy for the "Closer" brand, never real marketing copy. */
const DEFAULT_PHRASES = ["Close more deals", "Book more meetings", "Talk less, sell more"];

/** Separators rotate for playful rhythm; the Star is filled for a solid block accent. */
const SEPARATORS: readonly LucideIcon[] = [Star, Asterisk, Sparkles];

/** Repeat the phrase cycle enough times to fill wide viewports for a seamless loop. */
const MIN_UNITS = 8;

function normalizePhrases(text?: string | string[]): string[] {
  const list = Array.isArray(text) ? text : text != null ? [text] : [];
  const cleaned = list.map((phrase) => phrase.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : DEFAULT_PHRASES;
}

/**
 * MarqueeHeadline, a giant scrolling text banner used as a divider between
 * sections. Full-bleed strip with thick black top/bottom borders and a bright
 * color block, scrolling a big Anton uppercase phrase with a lucide separator
 * between each repeat. Seamless scroll + reduced-motion handling come from the
 * shared `<Marquee>` primitive.
 */
export function MarqueeHeadline({
  text,
  background = "yellow",
  speed = 30,
  reverse = false,
  className,
  id,
}: MarqueeHeadlineProps) {
  const phrases = normalizePhrases(text);
  const cycles = Math.max(2, Math.ceil(MIN_UNITS / phrases.length));
  const units = Array.from(
    { length: cycles * phrases.length },
    (_, i) => phrases[i % phrases.length],
  );

  return (
    <div
      id={id}
      className={cn(
        "relative w-full select-none border-y-[2.5px] border-ink py-4 md:py-6",
        bgMap[background],
        className,
      )}
    >
      {/* Screen readers get each phrase once; the scrolling repetition is decorative. */}
      <span className="sr-only">{phrases.join(". ")}</span>

      <div aria-hidden="true">
        {/* gap=0 keeps the duplicate-copy loop perfectly seamless; spacing lives on the icons. */}
        <Marquee speed={speed} reverse={reverse} gap="0rem">
          {units.map((phrase, i) => {
            const Icon = SEPARATORS[i % SEPARATORS.length];
            return (
              <span
                key={i}
                className="flex items-center whitespace-nowrap font-display text-4xl uppercase leading-none tracking-[-0.01em] sm:text-5xl md:text-6xl"
              >
                {phrase}
                <Icon
                  className={cn(
                    "mx-5 size-7 shrink-0 sm:mx-7 sm:size-9 md:mx-10 md:size-11",
                    Icon === Star && "fill-current",
                  )}
                  strokeWidth={2.5}
                />
              </span>
            );
          })}
        </Marquee>
      </div>
    </div>
  );
}
