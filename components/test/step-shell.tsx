/**
 * One step of the flow: exactly one viewport tall, and no site chrome.
 *
 * ===========================================================================
 * FILL WHEN SHORT, SCROLL WHEN TALL
 * ===========================================================================
 * The construction is `min-h-[100dvh]` on a centring flex column, and the
 * `min-` is the whole trick:
 *
 *   content shorter than the viewport  the section is exactly one viewport
 *                                      tall and `justify-center` centres the
 *                                      content in it. Nothing below the fold,
 *                                      nothing to scroll.
 *   content taller than the viewport   `min-height` yields, the section grows
 *                                      to the content, `justify-center`
 *                                      becomes a no-op, and the page scrolls
 *                                      normally. Nothing is ever clipped.
 *
 * A fixed `height: 100dvh` would have got the first case right and clipped the
 * second, which matters because these steps differ a lot: the first fork has
 * two cards, the grade picker has six, and the grown-up intro has five rules.
 * On a 360x640 phone at least one of them genuinely does not fit, and the
 * honest answer there is a scroll, not a squeeze.
 *
 * `dvh` rather than `vh` or `svh`: `vh` is the LARGE viewport, measured as if
 * the browser chrome were hidden, so at first paint a 100vh block is taller
 * than the screen and pushes content under the fold. `svh` freezes at the
 * small height, so once the URL bar scrolls away the block is short. `dvh`
 * tracks the live viewport, which is also what makes a desktop window resize
 * re-fit correctly.
 *
 * ===========================================================================
 * NO FOOTER, AND NO COMPENSATION FOR ONE
 * ===========================================================================
 * The site footer is not in this tree at all — it lives in app/(site)/layout.tsx
 * and the flow is not in that group. So there is no negative margin reaching
 * back into the last 60 to 96 pixels of the screen, and therefore no
 * `--footer-overlap` variable here. v2 still needs that mechanism, because v2
 * still has a footer; v3 deleted the problem instead of compensating for it.
 *
 * The bottom padding is not footer compensation. It is clearance for the
 * floating music toggle, a fixed 56px puck inset 24px from the bottom-right
 * corner, which would otherwise sit on top of whatever the last element is.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StepShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative flex min-h-[100dvh] w-full flex-col items-center justify-center",
        "px-4 pb-24 pt-8 sm:pt-12",
        /*
          A SHORT VIEWPORT GETS ITS PADDING BACK. Below 700px tall the grade
          picker and the intro already run past one screen, so 32px of top
          padding and 16px of slack under the music toggle are worth more as
          content than as margin. The bottom stays at 80px because that is what
          the toggle actually occupies — a 56px puck inset 24px — so this
          reclaims the spare 16 rather than letting the puck sit on a button.
        */
        "[@media(max-height:700px)]:pb-20 [@media(max-height:700px)]:pt-4",
        /*
          And below 660 it goes further, because that is where the grade picker
          and the sub-fork were still running 15px and 6px past the fold. The
          bottom drops to the music toggle's actual footprint with nothing
          spare, and the top to the same 8px, which is enough to close both with
          room over. Nothing above 660 is affected, so the common phone sizes
          keep their breathing room.
        */
        "[@media(max-height:660px)]:pb-[4.75rem] [@media(max-height:660px)]:pt-2",
        className,
      )}
    >
      {children}
    </section>
  );
}
