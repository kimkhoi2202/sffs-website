"use client";

import { useEffect } from "react";

import {
  trackOutboundLinkClicked,
  trackSocialLinkClicked,
  type SocialLocation,
} from "@/lib/analytics/events";

/**
 * Delegated outbound-link analytics (plan §2.2). One bubble-phase document
 * listener catches every external `<a>` click — so the server-rendered
 * <SocialButton> anchors and the footer are covered without touching them:
 *  - instagram.com / tiktok.com → `social_link_clicked` (the site→social flywheel)
 *  - any other external host     → `outbound_link_clicked`
 * Internal (#hash, same-origin, mailto/tel) links are skipped — the smooth-scroll
 * handler + autocapture already cover those. Renders nothing.
 */
export function LinkTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") return; // mailto/tel/etc.
      if (url.origin === window.location.origin) return; // internal nav

      const domain = url.hostname.replace(/^www\./, "");
      const socialLocation: SocialLocation = anchor.closest("footer")
        ? "footer"
        : "follow_us";

      if (domain.includes("instagram")) {
        trackSocialLinkClicked("instagram", socialLocation);
      } else if (domain.includes("tiktok")) {
        trackSocialLinkClicked("tiktok", socialLocation);
      } else {
        trackOutboundLinkClicked({
          href: url.href,
          link_domain: domain,
          location: anchor.closest("[id]")?.id || "unknown",
        });
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
