import type { Metadata } from "next";

import { QuizNav } from "@/components/quiz/quiz-nav";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionDivider } from "@/components/ui/section-divider";
import { ProductCard } from "@/components/store/product-card";
import { PRODUCTS } from "@/lib/store/products";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Two tees, one honest truth. Grab the open Fart Smella Tee, or unlock the Smart Fella Tee with the code you earn at smart-fella tier in the app.",
  alternates: { canonical: "/store" },
};

/*
  The merch store. Two products only: the open Fart Smella Tee (anyone can
  buy it, no shame) and the gated Smart Fella Tee (earned — unlocked with the
  HMAC-signed code the app mints at smart-fella tier). `SiteFooter` is NOT
  rendered here; it is mounted once, globally, in app/layout.tsx after
  `{children}` — matching every other sub-route page in this repo
  (app/about, app/privacy, ...), none of which render it themselves.

  Ends on yellow (matching app/about/page.tsx's closer) so the section
  handoff into the global footer's blue water wave — calibrated for a
  yellow -> blue seam, see site-footer.tsx — reads correctly.
*/
export default function StorePage() {
  return (
    <main id="main" className="flex-1">
      <QuizNav pinned homeHref="/" ctaHref="/#waitlist" />

      {/* 1. Hero. */}
      <Section
        background="cream"
        padding="lg"
        className="pt-[96px] md:pt-[120px]"
        container="prose"
        containerClassName="text-center"
      >
        <Eyebrow>The merch</Eyebrow>
        <Heading as={1} size="display" className="mt-6 !leading-[1.05]">
          Wear your rank
        </Heading>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg font-medium leading-snug sm:text-xl">
          Two tees, one honest truth. The Fart Smella Tee is open to anyone —
          no judgment, just fumes. The Smart Fella Tee is earned: hit
          smart-fella tier in the app, grab your code, and unlock it below.
        </p>
      </Section>

      <SectionDivider top="cream" bottom="paper" variant="curve" size="sm" />

      {/* 2. The two products. */}
      <Section background="paper" padding="lg" container="page">
        <div className="grid gap-8 md:grid-cols-2">
          <ProductCard product={PRODUCTS["fart-smella-tee"]} />
          <ProductCard product={PRODUCTS["smart-fella-tee"]} />
        </div>
      </Section>

      <SectionDivider top="paper" bottom="yellow" variant="curve" size="sm" />

      {/* 3. Fine print, on the yellow "sand" strip right above the footer's
          water — same beach effect as app/about/page.tsx's closer. */}
      <Section background="yellow" padding="md" container="prose" containerClassName="text-center">
        <p className="text-base font-medium leading-relaxed">
          Placeholder art for now — real product photos drop soon. Sizes S–XXL.
          Flat-rate US shipping added at checkout.
        </p>
      </Section>
    </main>
  );
}
