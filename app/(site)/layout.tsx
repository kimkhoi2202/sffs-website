import { SiteFooter } from "@/components/sections/site-footer";

/**
 * The shared chrome for the CONTENT pages: /about, /privacy, /terms, /support,
 * /app-store-copy, /internal and /tiktok.
 *
 * ===========================================================================
 * WHY THIS GROUP EXISTS
 * ===========================================================================
 * The site footer used to be in the root layout, which meant every route got
 * it whether it suited them or not. The v3 test flow does not want it: the
 * footer pulls itself up over whatever precedes it with a negative top margin
 * (-60px, -80px at sm, -96px at md) so its wave can sit on the previous
 * section's colour, and on a page that is exactly one viewport tall that margin
 * reaches backwards and eats the last 60 to 96 pixels of the first screen. On
 * the v2 homepage that was compensated for with a --footer-overlap variable;
 * on a multi-step flow, compensating on every step is worse than not having the
 * footer there at all.
 *
 * So the footer moved down here. A route group changes nothing about the URLs —
 * /privacy is still /privacy — it just means "these routes share this chrome".
 *
 * ===========================================================================
 * WHAT IS DELIBERATELY NOT IN THIS GROUP
 * ===========================================================================
 *   app/page.tsx            renders whichever site version is active, and
 *                           brings its OWN footer when that version wants one.
 *                           v1 and v2 do; v3 does not.
 *   app/results/[token]     a v3 results page. No footer; it carries its own
 *                           minimal legal line instead, because someone can
 *                           land there straight from an inbox.
 *
 * A new content page added to this group inherits the footer automatically,
 * which is the point: the previous arrangement made forgetting it impossible,
 * and this one makes forgetting it unlikely while still letting the flow opt
 * out cleanly.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
