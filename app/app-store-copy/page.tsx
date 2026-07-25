import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/sections/page-header";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";

/*
  Deliverable 4: App Store Connect listing copy and metadata.

  INTERNAL reference only. This route is noindex,nofollow and is intentionally
  left OFF public navigation. Character counts are computed live from the copy
  strings below, so what you see is always the true length.
*/
export const metadata: Metadata = {
  title: { absolute: "App Store Copy (Internal) | Smart Fella or Fart Smella" },
  description:
    "Internal reference: ready-to-paste App Store Connect copy and metadata for Smart Fella or Fart Smella.",
  // Internal utility page, keep it out of search results.
  robots: { index: false, follow: false },
  alternates: { canonical: "/app-store-copy" },
  // Plain string images (no alt) so this internal page does not inherit the
  // site-wide OG/Twitter card alt text.
  openGraph: { images: ["/opengraph-image"] },
  twitter: { images: ["/twitter-image"] },
};

// ---- Character-limited copy (edit here; counts update automatically) ----
const APP_NAME = "Smart Fella or Fart Smella";
const APP_NAME_FALLBACK = "Smart Fella: Brain Games";

const SUBTITLE_PRIMARY = "Dumb name. Real brain games.";
const SUBTITLE_ALT_1 = "Brain training and fun games";
const SUBTITLE_ALT_2 = "The dumb little brain game";

const PROMO_TEXT =
  "Play the first game in every category free. No ads, and we never sell your data. Quick brain games with a very stupid name, plus a one-time unlock for the rest.";

const KEYWORDS =
  "brain,training,logic,puzzle,memory,focus,attention,quiz,trivia,reflex,casual,streak,brainteaser";

const DESCRIPTION = `Smart Fella or Fart Smella is a dumb little brain game with a very stupid name. Quick logic, memory, focus, and word games mixed with casual arcade rounds - a real challenge you can finish in about a minute. Play a round, get ranked, and settle the only question that matters: are you a smart fella, or a certified fart smella?

WHAT IS INSIDE

Brain-training challenges. Quick logic, memory, focus, and attention games that keep your brain busy.

Fun casual games. Arcade-style games for the moments you just want to play.

Progress and personal bests. Save scores and beat your own high score over time.

First game in every category free. Try before you buy, no strings attached.

One-time unlock, no subscription. A single purchase opens the rest of the games.

NO ADS, NO CREEPY TRACKING

No ads, no third-party ad tracking, and we never sell data. Signing in is optional - every game works fine without an account.

SIMPLE PRICING

Try the first game in every category for free. When you are ready, one purchase unlocks everything. There is no subscription, and Restore Purchases is supported if you switch devices. If we ever add subscriptions, the details will be shown first.

A quick, honest note: this is a fun brain-exercise and games app. It does not make medical, clinical, or IQ claims, and it is not a test of intelligence or grades. It is here to make thinking fun.`;

const WHATS_NEW = `Welcome to Smart Fella or Fart Smella! This is our very first release.

Here is what you can do:
Play brain-training challenges and fun casual games.
Try the first game in every category for free.
Unlock the rest with a single one-time purchase.
Enjoy it all with no ads.

We would love your feedback. Reach us any time from the Support page.`;

function CharCount({ value, limit }: { value: string; limit: number }) {
  const n = value.length;
  const ok = n <= limit;
  return (
    <span
      className={`inline-flex items-center rounded-full border-[2.5px] border-ink px-3 py-1 text-xs font-bold uppercase tracking-[0.02em] ${
        ok ? "bg-mint" : "bg-coral"
      }`}
    >
      {n} / {limit} characters {ok ? "(fits)" : "(over limit)"}
    </span>
  );
}

/** A copyable block for a single ready-to-paste value. */
function CopyBlock({ value }: { value: string }) {
  return (
    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border-[2.5px] border-ink bg-cream p-4 font-mono text-sm leading-relaxed text-ink">
      {value}
    </pre>
  );
}

function FieldCard({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card color="paper" shadow="sm" padding="lg" className="scroll-mt-[6rem]">
      <Heading as={2} size="sm" className="flex items-baseline gap-3">
        <span aria-hidden className="text-ink/40">
          {index}
        </span>
        <span>{title}</span>
      </Heading>
      <div className="mt-4 space-y-3 text-[1rem] font-medium leading-relaxed text-ink">
        {children}
      </div>
    </Card>
  );
}

export default function AppStoreCopyPage() {
  return (
    <div
      id="top"
      className="relative z-40 flex flex-1 flex-col bg-paper text-ink"
    >
      <PageHeader />

      <main id="main" className="flex-1">
        <section className="border-b-[2.5px] border-ink bg-yellow">
          <Container size="prose" className="py-12 md:py-16">
            <Eyebrow>Internal reference</Eyebrow>
            <Heading as={1} size="lg" className="mt-4">
              App Store listing copy
            </Heading>
            <p className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-3 text-sm font-bold shadow-hard-xs">
              Internal only. Not linked in public navigation, and set to
              noindex,nofollow. Ready to paste into App Store Connect.
            </p>
          </Container>
        </section>

        <section className="bg-paper">
          <Container size="prose" className="space-y-8 py-12 md:py-16">
            <FieldCard index="01" title="App name (max 30)">
              <CharCount value={APP_NAME} limit={30} />
              <CopyBlock value={APP_NAME} />
              <p className="text-[0.95rem] text-ink/70">
                Shorter fallback if the name is ever rejected:
              </p>
              <CharCount value={APP_NAME_FALLBACK} limit={30} />
              <CopyBlock value={APP_NAME_FALLBACK} />
            </FieldCard>

            <FieldCard index="02" title="Subtitle (max 30)">
              <p className="text-[0.95rem] text-ink/70">Primary</p>
              <CharCount value={SUBTITLE_PRIMARY} limit={30} />
              <CopyBlock value={SUBTITLE_PRIMARY} />
              <p className="text-[0.95rem] text-ink/70">Alternate 1</p>
              <CharCount value={SUBTITLE_ALT_1} limit={30} />
              <CopyBlock value={SUBTITLE_ALT_1} />
              <p className="text-[0.95rem] text-ink/70">Alternate 2</p>
              <CharCount value={SUBTITLE_ALT_2} limit={30} />
              <CopyBlock value={SUBTITLE_ALT_2} />
            </FieldCard>

            <FieldCard index="03" title="Promotional text (max 170)">
              <CharCount value={PROMO_TEXT} limit={170} />
              <CopyBlock value={PROMO_TEXT} />
            </FieldCard>

            <FieldCard index="04" title="Keywords (max 100, comma-separated)">
              <CharCount value={KEYWORDS} limit={100} />
              <CopyBlock value={KEYWORDS} />
              <p className="text-[0.95rem] text-ink/70">
                No spaces, comma-separated, and no repeat of the app-name words
                (Smart, Fella, or, Fart, Smella), which Apple already indexes from
                the name.
              </p>
            </FieldCard>

            <FieldCard index="05" title="Description (max 4000)">
              <CharCount value={DESCRIPTION} limit={4000} />
              <CopyBlock value={DESCRIPTION} />
            </FieldCard>

            <FieldCard index="06" title="Categories">
              <p>
                <strong>Recommended.</strong> Primary: Education. Secondary:
                Games (Puzzle).
              </p>
              <p>
                <strong>Alternate.</strong> Primary: Games (Puzzle subcategory).
                Secondary: Education.
              </p>
              <p>
                <strong>Tradeoff.</strong> Education fits the brain-training
                angle and signals that the games have substance. Games first
                widens reach in the largest, most-browsed category. Pick based on
                whether credibility or discovery matters more at launch.
              </p>
            </FieldCard>

            <FieldCard index="07" title="Age rating guidance">
              <p>
                Aim for a 4+ style rating in the App Store Connect questionnaire,
                and answer honestly:
              </p>
              <ul className="list-disc space-y-1.5 pl-6 marker:text-ink">
                <li>No objectionable, violent, or mature content.</li>
                <li>No unmoderated user-generated content.</li>
                <li>No gambling or simulated gambling.</li>
                <li>No unrestricted web access.</li>
              </ul>
              <p>
                <strong>Kids Category note.</strong> Do not enroll in the Kids
                Category. The rating is 4+ because there is nothing objectionable
                in the app, not because the app is aimed at children.
              </p>
              <p>
                Confirm the final age band directly in App Store Connect. Keep
                every questionnaire
                answer consistent with the Privacy Policy and the app behavior,
                and do not overclaim.
              </p>
            </FieldCard>

            <FieldCard index="08" title="Privacy nutrition label guidance">
              <p>Map the labels to match the Privacy Policy:</p>
              <ul className="list-disc space-y-1.5 pl-6 marker:text-ink">
                <li>
                  <strong>Contact info (email).</strong> Account email, used for
                  app functionality (your account). Linked to you. Not used for
                  tracking.
                </li>
                <li>
                  <strong>Name and avatar.</strong> Only if Google sign-in is
                  used, for app functionality. Linked to you. Not used for
                  tracking.
                </li>
                <li>
                  <strong>User content.</strong> Limited to game progress and
                  scores, for app functionality.
                </li>
                <li>
                  <strong>Purchases.</strong> Purchase and entitlement status
                  through RevenueCat, for app functionality.
                </li>
                <li>
                  <strong>Usage data (product interaction).</strong> App usage
                  events through PostHog (screens viewed, buttons tapped,
                  purchases started or completed), for analytics. NOT linked to
                  you: the app never calls identify, so there is no per-user
                  profile. Not used for tracking.
                </li>
              </ul>
              <p>
                Data is <strong>not</strong> used for third-party advertising,
                <strong> not</strong> sold, and there is{" "}
                <strong>no</strong> tracking across other companies&rsquo; apps or
                sites.
              </p>
            </FieldCard>

            <FieldCard index="09" title="What's New (first release)">
              <CharCount value={WHATS_NEW} limit={4000} />
              <CopyBlock value={WHATS_NEW} />
            </FieldCard>

            <FieldCard index="10" title="Store URLs to enter">
              <ul className="list-disc space-y-1.5 pl-6 marker:text-ink">
                <li>
                  <strong>Marketing URL:</strong>{" "}
                  https://smartfellaorfartsmella.com
                </li>
                <li>
                  <strong>Support URL:</strong>{" "}
                  https://smartfellaorfartsmella.com/support
                </li>
                <li>
                  <strong>Privacy Policy URL:</strong>{" "}
                  https://smartfellaorfartsmella.com/privacy
                </li>
              </ul>
              <p className="text-[0.95rem] text-ink/70">
                The [App Store URL] token is the future public listing link. Once
                the app is live, use it on the site wherever the download link is
                needed.
              </p>
            </FieldCard>
          </Container>
        </section>
      </main>
    </div>
  );
}
