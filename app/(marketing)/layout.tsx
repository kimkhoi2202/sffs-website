import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";

export const metadata: Metadata = {
  title: {
    default: "Closer - sharpen your sales skills",
    template: "%s · Closer",
  },
  description:
    "A design-system clone built with Next.js, Base UI and Tailwind CSS. Placeholder brand for demonstration only.",
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SmoothScroll>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </SmoothScroll>
  );
}
