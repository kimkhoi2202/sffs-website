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

export const metadata: Metadata = {
  // Absolute base for OG/Twitter image URLs and the canonical share URL. The
  // auto-generated app/opengraph-image + app/twitter-image resolve against this,
  // so shares render the 1200×630 hero card.
  metadataBase: new URL("https://smartfellaorfartsmella.com"),
  title: {
    default: "Smart Fella or Fart Smella?",
    template: "%s · Smart Fella or Fart Smella",
  },
  description:
    "A dumb little brain game that knows exactly how smart you are. Play memory + puzzle games, climb the ranks, and flex on your friends. Join the waitlist.",
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Smart Fella or Fart Smella?",
    description:
      "The dumb little brain game that knows exactly how smart you are. Join the waitlist.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Fella or Fart Smella?",
    description:
      "The dumb little brain game that knows exactly how smart you are. Join the waitlist.",
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
