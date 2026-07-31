import type { Metadata } from "next";
import { DM_Sans, Anton, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/quiz/smooth-scroll";
import { MusicToggle } from "@/components/quiz/music-toggle";
import { SiteFooter } from "@/components/sections/site-footer";
import { PageShapes } from "@/components/quiz/page-shapes";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { EngagementTracker } from "@/components/analytics/engagement-tracker";
import { LinkTracker } from "@/components/analytics/link-tracker";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * The SITE-WIDE default description, inherited by any route that does not set
 * its own. /privacy, /terms and /support each define their own title,
 * description and openGraph block, so this reaches /about and anything added
 * later.
 *
 * It describes the PRODUCT and nothing else. It used to end "Join the waitlist",
 * which outlived the waitlist, and before that the share card called the app a
 * "60-second Fella Test", which was a different product entirely. Both were
 * still being served to anyone who shared a legal page, including an App Store
 * reviewer following the listing links. Keep this one purely descriptive: no
 * campaign language, no call to action, nothing that can go stale when the
 * homepage changes again.
 */
const SITE_DESCRIPTION =
  "A dumb little brain game that knows exactly how smart you are. Quick puzzle games, one brain rank, and a daily streak.";

export const metadata: Metadata = {
  // Absolute base for OG/Twitter image URLs and the canonical share URL. The
  // auto-generated app/opengraph-image + app/twitter-image resolve against this,
  // so shares render the 1200×630 hero card.
  metadataBase: new URL("https://smartfellaorfartsmella.com"),
  title: {
    default: "Smart Fella or Fart Smella?",
    template: "%s · Smart Fella or Fart Smella",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Smart Fella or Fart Smella?",
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Fella or Fart Smella?",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${anton.variable} ${geistMono.variable} h-full`}
    >
      {/* `relative` so the document-glued shapes overlay (absolute inset-0)
          spans the whole document as its containing block. */}
      <body className="relative flex min-h-full flex-col bg-paper text-ink antialiased">
        <PostHogProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:border-[2.5px] focus:border-ink focus:bg-yellow focus:px-4 focus:py-2 focus:font-bold focus:text-ink"
          >
            Skip to content
          </a>
          <SmoothScroll>
            {children}
            <SiteFooter />
            <MusicToggle />
          </SmoothScroll>
          {/* Page-level draggable shape field — a document-glued overlay mounted
              OUTSIDE the hero so it's never clipped by it; the shapes confine
              themselves to the hero and bounce off its wavy divider edge. */}
          <PageShapes />
          {/* Scroll-depth + section-view analytics (IntersectionObserver). Renders
              nothing; safe no-op on routes without the tracked sections. */}
          <EngagementTracker />
          {/* Outbound + social link-click analytics (delegated listener). */}
          <LinkTracker />
        </PostHogProvider>
      </body>
    </html>
  );
}
