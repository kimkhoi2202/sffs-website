/**
 * The flow's icon set. Nucleo Core v1.7.0, outline style, 24px grid.
 *
 * ===========================================================================
 * ONLY THE FOUR WE USE ARE HERE
 * ===========================================================================
 * Nucleo is a paid library of ~19,000 icons. Vendoring the set into the repo
 * would be wasteful and the wrong thing to do with licensed assets, so these
 * four paths were copied out by hand and the library stays outside the tree.
 * Adding a fifth means going back to the source, not reaching for a lookalike
 * from somewhere else — one family throughout is the whole point, and a Nucleo
 * arrow next to a hand-drawn cross looks worse than either alone.
 *
 * Source files, for provenance:
 *   ArrowLeft   outline/arrows/24px_arrow-left.svg
 *   ArrowRight  outline/arrows/24px_arrow-right.svg   (mirrored from the above)
 *   XMark       outline/ui-layout/24px_xmark.svg
 *   Check       outline/ui-layout/24px_check.svg
 *
 * ===========================================================================
 * WHY OUTLINE, AND WHY THIS WEIGHT
 * ===========================================================================
 * This design system is thick ink keylines and hard offset shadows, so a
 * hairline icon looks like it wandered in from a different product. Nucleo
 * ships these at `stroke-width: 2` on a 24px box; the default here is 2.5,
 * which is exactly the border weight used everywhere else
 * (`border-[2.5px]`), so an icon inside a bordered control reads as the same
 * object rather than as something drawn on top of it.
 *
 * `stroke-linecap="square"` is Nucleo's own and is kept deliberately: rounded
 * caps would soften the geometry against a system that has no soft edges.
 *
 * SIZE AND WEIGHT, WHICH HAVE TO MOVE TOGETHER. The glyph should occupy
 * roughly 40-50% of its control's diameter: a 24px icon in a 56px button, a
 * 17px icon in a 36px button. Much under that and the control reads as broken
 * rather than deliberate, whatever the stroke.
 *
 * Weight is the other half. At the right size a 2px hairline still looks
 * anaemic beside 2.5px ink borders and Anton headlines, so the default here is
 * 3 — heavier than Nucleo ships them, and matched to the type around it. Both
 * were judged at rendered size on a phone, not zoomed in, which is the only
 * place an undersized icon is obvious.
 *
 * The bold "pentagon" arrows in the set (24px_arrow-bold-left) were the other
 * candidate and were rejected: at 20px they read as a filled shape rather than
 * a direction, and next to the letter badges on the option cards there was
 * already enough solid geometry on screen.
 */
import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Any CSS length. Defaults to 24px, sized for a 56px control. */
  size?: number | string;
  strokeWidth?: number;
}

function Icon({
  size = 24,
  strokeWidth = 3,
  className,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeMiterlimit={10}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12L3 12" />
      <path d="M10 19L3 12L10 5" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12L21 12" />
      <path d="M14 5L21 12L14 19" />
    </Icon>
  );
}

export function XMarkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="19" y1="19" x2="5" y2="5" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="3 13 8 19 21 5" />
    </Icon>
  );
}
