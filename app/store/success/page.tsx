import type { Metadata } from "next";

import { QuizNav } from "@/components/quiz/quiz-nav";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Your Smart Fella or Fart Smella merch order is confirmed.",
  robots: { index: false, follow: false },
};

/*
  Post-Checkout landing page. Stripe redirects here on a completed session
  (see app/api/store/checkout/route.ts's success_url), appending
  `?session_id={CHECKOUT_SESSION_ID}`. v1 does no server-side session lookup
  (no DB) — we just surface the id as a human-readable order reference, per
  the plan's Task 4 scope ("no secret lookup needed in v1").

  `searchParams` is a Promise in this Next fork (App Router Server Component
  page prop) — see node_modules/next/dist/docs/01-app/01-getting-started/
  03-layouts-and-pages.md ("Rendering with search params"). Typed as the
  generic index signature shown there, then narrowed locally, rather than a
  one-off `{ session_id?: string }` shape, since a real query string can also
  hand back `string[]` for a repeated key.
*/
export default async function StoreSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawSessionId = params.session_id;
  const sessionId = typeof rawSessionId === "string" ? rawSessionId : undefined;

  return (
    <main id="main" className="flex-1">
      <QuizNav pinned homeHref="/" ctaHref="/#waitlist" />

      <Section
        background="mint"
        padding="lg"
        className="pt-[96px] md:pt-[120px]"
        container="prose"
        containerClassName="text-center"
      >
        <Eyebrow>Order confirmed</Eyebrow>
        <Heading as={1} size="display" className="mt-6 !leading-[1.05]">
          You&apos;re officially certified.
        </Heading>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg font-medium leading-snug">
          Your tee is on its way. We&apos;ll email your receipt and shipping
          updates — go tell a fart smella you leveled up.
        </p>
        {sessionId ? (
          <p className="mx-auto mt-6 max-w-lg break-all text-sm font-medium opacity-60">
            Order reference: {sessionId}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href="/store" variant="ink" size="lg">
            Back to the store
          </Button>
          <Button href="/" variant="paper" size="lg">
            Play the game
          </Button>
        </div>
      </Section>
    </main>
  );
}
