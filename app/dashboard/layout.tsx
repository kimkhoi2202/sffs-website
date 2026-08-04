import type { Metadata } from "next";

/**
 * /dashboard — the internal traffic and journey dashboard.
 *
 * OUTSIDE the (site) route group on purpose. That group exists to hand the
 * shared marketing footer to content pages; this is a tool, it fills the
 * viewport, and a wave-shaped footer under a data table would be a joke at its
 * own expense.
 *
 * `noindex, nofollow` here AND `X-Robots-Tag` on the data route. The page is
 * passphrase-gated so a crawler could never read it anyway, but a gated page
 * that still shows up in a search result advertises its own existence.
 */
export const metadata: Metadata = {
  title: "Traffic dashboard",
  description: "Internal traffic, attribution and user journeys.",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The root layout mounts the site's ambient chrome — the floating music puck
 * and the draggable shape field — on every route, with no path awareness. On a
 * marketing page that is the point; on an analytics tool a "Play music" button
 * hovering over the funnel is just wrong.
 *
 * Hidden with scoped CSS rather than by making the root layout path-aware,
 * because that file is a shared seam every route depends on and this is a
 * cosmetic concern local to one page. The selector matches both label states
 * ("Play music" / "Pause music"), which is the only thing about that button
 * that is stable.
 */
const SUPPRESS_SITE_CHROME = `
  .dashboard-surface ~ * [aria-label$="music"],
  body > button[aria-label$="music"],
  body > audio + button[aria-label$="music"] { display: none !important; }
`;

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dashboard-surface min-h-dvh bg-cream text-ink">
      <style dangerouslySetInnerHTML={{ __html: SUPPRESS_SITE_CHROME }} />
      {children}
    </div>
  );
}
