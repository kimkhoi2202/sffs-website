import { SmoothScroll } from "@/components/quiz/smooth-scroll";
import { MusicToggle } from "@/components/quiz/music-toggle";

/**
 * Route layout for /smart-or-fart.
 *
 * The quiz lives under the minimal root layout (app/layout.tsx), so it doesn't
 * inherit the marketing route group's smooth scroll. This layout adds the same
 * premium Lenis "dampened" scroll — here via the quiz-specific provider that
 * also syncs Lenis with GSAP ScrollTrigger for the page's scroll reveals + nav.
 *
 * It intentionally renders no <main>/chrome of its own: app/smart-or-fart/page.tsx
 * already provides <main id="main"> and its own slim nav.
 */
export default function SmartOrFartLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SmoothScroll>
      {children}
      <MusicToggle />
    </SmoothScroll>
  );
}
