import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/sections/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";

/* Deliverable 3: the Support and Help page. */
const SUPPORT_EMAIL = "smartfellaorfartsmella123@gmail.com";

export const metadata: Metadata = {
  title: { absolute: "Support and Help | Smart Fella or Fart Smella" },
  description:
    "Get help with Smart Fella or Fart Smella. Find answers about accounts, the one-time unlock, restoring purchases, privacy, and how to delete your data.",
  alternates: { canonical: "/support" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Support and Help | Smart Fella or Fart Smella",
    description:
      "Get help with Smart Fella or Fart Smella. Find answers about accounts, the one-time unlock, restoring purchases, privacy, and how to delete your data.",
    url: "/support",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support and Help | Smart Fella or Fart Smella",
    description:
      "Get help with Smart Fella or Fart Smella. Find answers about accounts, the one-time unlock, restoring purchases, privacy, and how to delete your data.",
    images: ["/twitter-image"],
  },
};

type FaqItem = {
  id: string;
  q: string;
  /** Rich answer shown on the page (may include links). */
  a: ReactNode;
  /** Plain-text mirror used for the FAQPage JSON-LD. */
  plain: string;
};

const LINK =
  "font-semibold text-ink underline decoration-2 underline-offset-2 hover:text-ink/70";

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-it",
    q: "What is Smart Fella or Fart Smella?",
    a: (
      <>
        It is a brain-training and casual-games app for tweens. Think part brain
        workout, part arcade: quick logic, memory, and focus challenges mixed
        with fun casual games.
      </>
    ),
    plain:
      "It is a brain-training and casual-games app for tweens. Think part brain workout, part arcade: quick logic, memory, and focus challenges mixed with fun casual games.",
  },
  {
    id: "who-is-it-for",
    q: "Who is it for?",
    a: (
      <>
        It is made for tweens in grades 5 to 8, roughly ages 10 to 14. It is
        playful for kids and built to be reassuring for parents.
      </>
    ),
    plain:
      "It is made for tweens in grades 5 to 8, roughly ages 10 to 14. It is playful for kids and built to be reassuring for parents.",
  },
  {
    id: "need-account",
    q: "Does my child need an account?",
    a: (
      <>
        No. The games work without an account. Signing in is optional and simply
        saves progress. An account can be created and owned by a parent.
      </>
    ),
    plain:
      "No. The games work without an account. Signing in is optional and simply saves progress. An account can be created and owned by a parent.",
  },
  {
    id: "safe-and-private",
    q: "Is it safe and private for kids?",
    a: (
      <>
        Yes, privacy is a priority. There are no third-party ads, no ad tracking,
        and we never sell data. We collect very little, and an account can be
        parent-owned. Read the full details in our{" "}
        <a href="/privacy" className={LINK}>
          Privacy Policy
        </a>
        .
      </>
    ),
    plain:
      "Yes, privacy is a priority. There are no third-party ads, no ad tracking, and we never sell data. We collect very little, and an account can be parent-owned. Read the full details in our Privacy Policy.",
  },
  {
    id: "cost",
    q: "How much does it cost?",
    a: (
      <>
        The first game in every category is free. To unlock the rest, there is a
        single one-time purchase. There is no subscription.
      </>
    ),
    plain:
      "The first game in every category is free. To unlock the rest, there is a single one-time purchase. There is no subscription.",
  },
  {
    id: "unlock",
    q: "What do I get when I unlock?",
    a: (
      <>
        The one-time unlock opens all of the games beyond the free first game in
        each category. It is a one-time purchase that stays with your store
        account.
      </>
    ),
    plain:
      "The one-time unlock opens all of the games beyond the free first game in each category. It is a one-time purchase that stays with your store account.",
  },
  {
    id: "subscription",
    q: "Is this a subscription?",
    a: (
      <>
        No. It is a one-time purchase, not a subscription. We may add
        subscription options in the future, and if we do, the details and pricing
        will be shown before you buy.
      </>
    ),
    plain:
      "No. It is a one-time purchase, not a subscription. We may add subscription options in the future, and if we do, the details and pricing will be shown before you buy.",
  },
  {
    id: "restore",
    q: "How do I restore my purchase on a new device?",
    a: (
      <>
        In the app, choose Restore Purchases. Make sure the device is signed in
        to the same Apple or Google store account you used to buy the unlock.
      </>
    ),
    plain:
      "In the app, choose Restore Purchases. Make sure the device is signed in to the same Apple or Google store account you used to buy the unlock.",
  },
  {
    id: "refund",
    q: "How do I get a refund?",
    a: (
      <>
        Refunds are handled by the Apple App Store or Google Play under their
        policies, so please request refunds there. If you need help, email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>
          {SUPPORT_EMAIL}
        </a>
        .
      </>
    ),
    plain:
      "Refunds are handled by the Apple App Store or Google Play under their policies, so please request refunds there. If you need help, email us at smartfellaorfartsmella123@gmail.com.",
  },
  {
    id: "delete-data",
    q: "How do I delete my account and data?",
    a: (
      <>
        You can ask us to delete your account and data at any time. Use the{" "}
        <a href="#delete" className={LINK}>
          Delete your account and data
        </a>{" "}
        steps above, and we will confirm ownership and complete the deletion. See
        our{" "}
        <a href="/privacy" className={LINK}>
          Privacy Policy
        </a>{" "}
        for details.
      </>
    ),
    plain:
      "You can ask us to delete your account and data at any time. Use the Delete your account and data steps on the support page, and we will confirm ownership and complete the deletion. See our Privacy Policy for details.",
  },
  {
    id: "contact-human",
    q: "How do I contact a human?",
    a: (
      <>
        Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>
          {SUPPORT_EMAIL}
        </a>{" "}
        and a real person will get back to you, usually within a couple of
        business days.
      </>
    ),
    plain:
      "Email us at smartfellaorfartsmella123@gmail.com and a real person will get back to you, usually within a couple of business days.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.plain,
    },
  })),
};

export default function SupportPage() {
  return (
    <div
      id="top"
      className="relative z-40 flex flex-1 flex-col bg-paper text-ink"
    >
      <PageHeader />

      <main id="main" className="flex-1">
        {/* Title band, signature yellow color-block. */}
        <section className="border-b-[2.5px] border-ink bg-yellow">
          <Container size="prose" className="py-14 md:py-20">
            <Eyebrow>Support</Eyebrow>
            <Heading as={1} size="xl" className="mt-4">
              Support and Help
            </Heading>
            <p className="mt-6 max-w-[48ch] text-[1.05rem] font-medium leading-relaxed">
              Need a hand with Smart Fella or Fart Smella? You are in the right
              place. Find quick answers below, or reach a real human any time.
            </p>
          </Container>
        </section>

        <section className="bg-paper">
          <Container size="prose" className="space-y-12 py-14 md:py-20">
            {/* Prominent contact block. */}
            <Card
              color="blue"
              shadow="md"
              padding="lg"
              className="scroll-mt-[6rem]"
            >
              <Heading as={2} size="sm">
                Contact us
              </Heading>
              <p className="mt-4 text-[1.05rem] font-medium leading-relaxed">
                The fastest way to reach us is email. A real person reads every
                message, and we usually reply within a couple of business days.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button href={`mailto:${SUPPORT_EMAIL}`} variant="yellow" size="lg">
                  Email support
                </Button>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-[1.05rem] font-bold underline decoration-2 underline-offset-4"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </Card>

            {/* Delete your account and data, kept near the top. */}
            <Card
              id="delete"
              color="coral"
              shadow="md"
              padding="lg"
              className="scroll-mt-[6rem]"
            >
              <Heading as={2} size="sm">
                Delete your account and data
              </Heading>
              <p className="mt-4 text-[1.05rem] font-medium leading-relaxed">
                You can ask us to delete your account and data at any time. Here
                is how:
              </p>
              <ol className="mt-4 list-decimal space-y-2 pl-6 text-[1.02rem] font-medium leading-relaxed marker:font-bold marker:text-ink">
                <li>
                  Email us at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>
                    {SUPPORT_EMAIL}
                  </a>
                  , and tell us it is a deletion request.
                </li>
                <li>
                  Help us confirm you own the account (or that you are the parent
                  or guardian), so we can protect it.
                </li>
                <li>
                  We complete verified requests and confirm when your data is
                  deleted, usually within 30 days.
                </li>
              </ol>
              <p className="mt-4 text-[1.02rem] font-medium leading-relaxed">
                For more detail, see our{" "}
                <a href="/privacy" className={LINK}>
                  Privacy Policy
                </a>
                .
              </p>
            </Card>

            {/* FAQ. */}
            <section aria-labelledby="faq-heading" className="scroll-mt-[6rem]">
              <Heading as={2} size="lg">
                <span id="faq-heading">Frequently asked questions</span>
              </Heading>
              <div className="mt-8 space-y-5">
                {FAQ_ITEMS.map((item) => (
                  <Card
                    key={item.id}
                    color="paper"
                    shadow="sm"
                    padding="lg"
                    className="scroll-mt-[6rem]"
                  >
                    <h3 className="font-sans text-lg font-bold leading-snug text-ink">
                      {item.q}
                    </h3>
                    <p className="mt-3 text-[1.02rem] font-medium leading-relaxed text-ink/80">
                      {item.a}
                    </p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Cross-links to the legal pages. */}
            <section aria-labelledby="related-heading">
              <Heading as={2} size="sm">
                <span id="related-heading">Related pages</span>
              </Heading>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[1.02rem]">
                <li>
                  <a href="/privacy" className={LINK}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className={LINK}>
                    Terms of Service
                  </a>
                </li>
              </ul>
            </section>
          </Container>
        </section>
      </main>

      {/* FAQPage structured data mirroring the visible FAQ above. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
