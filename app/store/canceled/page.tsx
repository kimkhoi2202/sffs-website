import type { Metadata } from "next";

import { QuizNav } from "@/components/quiz/quiz-nav";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout canceled",
  description:
    "No worries — your Smart Fella or Fart Smella cart is still here whenever you're ready.",
  robots: { index: false, follow: false },
};

/**
 * Stripe redirects here when a Checkout Session is abandoned (see
 * app/api/store/checkout/route.ts's cancel_url). Nothing was charged;
 * just a friendly nudge back to /store.
 */
export default function StoreCanceledPage() {
  return (
    <main id="main" className="flex-1">
      <QuizNav pinned homeHref="/" ctaHref="/#waitlist" />

      <Section
        background="coral"
        padding="lg"
        className="pt-[96px] md:pt-[120px]"
        container="prose"
        containerClassName="text-center"
      >
        <Eyebrow>No worries</Eyebrow>
        <Heading as={1} size="display" className="mt-6 !leading-[1.05]">
          Checkout canceled
        </Heading>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg font-medium leading-snug">
          Nothing was charged. Your tee will be right where you left it
          whenever you&apos;re ready to grab it.
        </p>
        <div className="mt-8">
          <Button href="/store" variant="ink" size="lg">
            Back to the store
          </Button>
        </div>
      </Section>
    </main>
  );
}
