import { cn } from "@/lib/utils";

/**
 * A single on-brand brain-mascot cameo (sliced from the sticker sheet into
 * public/decor/mascot/). Purely decorative: aria-hidden + pointer-events-none.
 *
 * Visible by default; a subtle, perpetual CSS idle loop (float / sway / swim)
 * gives it life. The idle is transform-only (GPU, off-main-thread) and is
 * disabled under prefers-reduced-motion via a media query in globals.css, so the
 * reduced-motion fallback is simply the static pose — no layout shift, no jank.
 */

type Idle = "float" | "sway" | "swim" | "none";

export function Mascot({
  pose,
  className,
  idle = "float",
  idleDelay = "0s",
}: {
  /** File name in public/decor/mascot/ (e.g. "wave", "peek", "point"). */
  pose: string;
  /** Absolute placement + height, e.g. "bottom-6 left-4 h-24 md:h-28". */
  className?: string;
  idle?: Idle;
  /** Stagger the idle loop so cameos don't bob in unison, e.g. "-1.4s". */
  idleDelay?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute z-20 block select-none", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative mascot /public asset */}
      <img
        src={`/decor/mascot/${pose}.png`}
        alt=""
        draggable={false}
        style={{ animationDelay: idleDelay }}
        className={cn("block h-full w-auto select-none", idle !== "none" && `mascot-${idle}`)}
      />
    </span>
  );
}
