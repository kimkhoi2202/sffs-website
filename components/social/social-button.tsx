import { cn } from "@/lib/utils";
import type { Social } from "@/lib/socials";

/*
  Neo-brutalist social ICON button: a rounded-square chip with a thick black
  border, a hard offset shadow, and the signature btn-press lift/press.

  FACE is paper (white) — never black — honoring the site's "no black-filled
  buttons" rule and matching its white surfaces. A light face lets BOTH brand
  marks read cleanly: instagram.svg is the full-color gradient tile (pops on
  white) and tiktok.svg is the INK (black) note (would vanish on a dark face).

  `surface` adapts only the hard-shadow color to the block the chip sits on,
  mirroring the site's --btn-shadow-color convention (button.tsx / globals.css):
    - "light" → default black hard shadow (for bright/colored blocks: the yellow
      "Follow us" section and the blue footer)
    - "dark"  → paper/white hard shadow (for any near-black surface)
  The border stays ink on every surface: a white chip needs the black keyline to
  read on light blocks, and on dark blocks the white face already separates it.
  The focus ring is the site's bespoke three-tone ring (paper halo → brand-blue
  band → ink keyline) so it stays visible on any surface.
*/

type Size = "md" | "lg";

const SIZE: Record<Size, string> = {
  // ~48px tap target (comfortably >44px) for the slim footer.
  md: "h-12 w-12 rounded-2xl p-2",
  // Large, prominent chips for the dedicated "Follow us" section.
  lg: "h-16 w-16 rounded-2xl p-3 sm:h-20 sm:w-20 sm:p-4",
};

const SURFACE: Record<"light" | "dark", string> = {
  // Bright/colored blocks: the default ink hard shadow already reads.
  light: "",
  // Near-black blocks: flip the hard shadow to paper so it stays visible.
  dark: "[--btn-shadow-color:var(--color-paper)]",
};

export function SocialButton({
  social,
  size = "md",
  surface = "light",
  className,
}: {
  social: Social;
  /** Chip scale. `md` for the footer, `lg` for the Follow-us section. */
  size?: Size;
  /** Which kind of block the chip sits on, so the hard shadow stays visible. */
  surface?: "light" | "dark";
  className?: string;
}) {
  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow us on ${social.label}`}
      className={cn(
        "btn-press relative inline-flex items-center justify-center border-[2.5px] border-ink bg-paper select-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transparent",
        "focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:content-[''] focus-visible:after:-inset-[2.5px] focus-visible:after:rounded-[inherit]",
        "focus-visible:after:[box-shadow:0_0_0_2px_var(--color-paper),0_0_0_5px_var(--color-blue),0_0_0_7px_var(--color-ink)]",
        SIZE[size],
        SURFACE[surface],
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- brand icon is a static /public SVG */}
      <img
        src={social.icon}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </a>
  );
}
