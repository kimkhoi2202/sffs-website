import { HomeSignup } from "@/components/sections/home-signup";
import { SiteFooter } from "@/components/sections/site-footer";

/**
 * V2: the single-screen waitlist page. What is on production today.
 *
 * Deliberately a thin wrapper rather than a copy. The page itself is still
 * `components/sections/home-signup.tsx`, exactly as it shipped, including its
 * `--footer-overlap` compensation — v2 HAS a footer, so that mechanism is still
 * load-bearing here and must not be stripped just because v3 solved the same
 * problem by removing the footer instead.
 *
 * Keeping it as its own component is the point of the version switch: if v3
 * converts worse than v2, going back is one environment variable rather than a
 * revert.
 *
 * Reached by setting SITE_VERSION=v2, or `?v=2` in development.
 */
export function HomeV2() {
  return (
    <>
      {/* `data-landing` is the marker components/analytics/engagement-tracker.tsx
          gates scroll-depth and section-view tracking on. */}
      <main id="main" data-landing className="flex-1">
        <HomeSignup />
      </main>
      <SiteFooter />
    </>
  );
}
