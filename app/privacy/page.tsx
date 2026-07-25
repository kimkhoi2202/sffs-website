import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/sections/legal-page";
import { Card } from "@/components/ui/card";

/*
  Deliverable 1: the Smart Fella or Fart Smella APP Privacy Policy.

  The operator is an individual sole developer (Kim Khoi Lam), not a company.
*/
const LEGAL_ENTITY = "Kim Khoi Lam";
const BUSINESS_ADDRESS = "1143 Sultana Spgs Ct, Houston, TX 77090";
const EFFECTIVE_DATE = "July 25, 2026";
const SUPPORT_EMAIL = "smartfellaorfartsmella123@gmail.com";

export const metadata: Metadata = {
  // Absolute title so the exact required tag is emitted (bypasses the site
  // template that appends a middot suffix).
  title: { absolute: "Privacy Policy | Smart Fella or Fart Smella" },
  description:
    "How Smart Fella or Fart Smella collects, uses, and protects data.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Privacy Policy | Smart Fella or Fart Smella",
    description:
      "How Smart Fella or Fart Smella collects, uses, and protects data.",
    url: "/privacy",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Smart Fella or Fart Smella",
    description:
      "How Smart Fella or Fart Smella collects, uses, and protects data.",
    images: ["/twitter-image"],
  },
};

const SECTIONS: LegalSection[] = [
  {
    id: "about-this-policy",
    heading: "About this policy",
    body: (
      <>
        <p>
          <strong>Effective date: {EFFECTIVE_DATE}</strong>
          <br />
          <strong>Last updated: {EFFECTIVE_DATE}</strong>
        </p>
        <p>
          This Privacy Policy is provided by {LEGAL_ENTITY}, the operator of the
          Smart Fella or Fart Smella mobile app (the &ldquo;app&rdquo;). It
          explains, in plain language, what information the app handles when you
          play, why we handle it, and the choices you have.
        </p>
        <p>
          We wrote this policy to be easy to read. If anything here is unclear,
          please reach out through our <a href="/support">support page</a>.
        </p>
      </>
    ),
  },
  {
    id: "who-we-are",
    heading: "Who we are",
    body: (
      <>
        <p>
          {LEGAL_ENTITY} makes and operates Smart Fella or Fart Smella. You can
          reach us at {BUSINESS_ADDRESS}, or through the contact details in the{" "}
          <a href="#contact">Contact us</a> section below.
        </p>
        <p>
          Smart Fella or Fart Smella is a brain-training and casual-games app:
          part brain workout, part arcade. Quick logic, memory, focus, and word
          games with a very stupid name.
        </p>
      </>
    ),
  },
  {
    id: "short-version",
    heading: "The short version",
    body: (
      <>
        <p>Here is the whole policy in a nutshell.</p>
        <Card color="mint" shadow="sm" padding="lg" className="not-prose">
          <ul className="list-disc space-y-2 pl-6 text-[1.02rem] leading-relaxed marker:text-ink">
            <li>Signing in is optional. The games work without an account.</li>
            <li>
              We collect very little: what the app needs to run, plus aggregate
              usage analytics so we can improve it.
            </li>
            <li>
              We never sell or share your personal data, and there are no
              third-party ads.
            </li>
            <li>
              The app is made for teens and adults, and it is not directed to
              children under 13.
            </li>
            <li>
              You can ask us to delete your data at any time through our{" "}
              <a
                href="/support"
                className="font-semibold text-ink underline decoration-2 underline-offset-2"
              >
                support page
              </a>
              .
            </li>
          </ul>
        </Card>
      </>
    ),
  },
  {
    id: "who-its-for",
    heading: "Who the app is for",
    body: (
      <>
        <p>
          Smart Fella or Fart Smella is made for teens and adults who like silly
          humour and quick brain games. It is rated 4+ because there is nothing
          objectionable in it, but it is not designed for or directed to children
          under 13, and it is not enrolled in Apple&rsquo;s Kids Category.
        </p>
        <p>
          We do not knowingly collect personal information from children under
          13. If you believe a child under 13 has provided us personal
          information, contact us and we will delete it.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    heading: "Information we collect and why",
    body: (
      <>
        <p>
          We keep data collection small and honest. Here is what the app may
          handle and why.
        </p>
        <div
          role="region"
          aria-label="Information we collect"
          tabIndex={0}
          className="not-prose -mx-1 overflow-x-auto rounded-2xl border-[2.5px] border-ink shadow-hard-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <table className="w-full min-w-[34rem] border-collapse text-left align-top text-[0.95rem] leading-relaxed">
            <thead>
              <tr className="border-b-[2.5px] border-ink bg-cream">
                <th scope="col" className="px-4 py-3 font-bold">
                  Data
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Purpose
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-2 border-ink/15">
                <td className="px-4 py-3 align-top font-semibold">
                  Account email
                </td>
                <td className="px-4 py-3 align-top">
                  Create and secure your optional account.
                </td>
                <td className="px-4 py-3 align-top">
                  You, at sign-in, handled through Supabase using email and
                  password, Google, or Apple.
                </td>
              </tr>
              <tr className="border-b-2 border-ink/15">
                <td className="px-4 py-3 align-top font-semibold">
                  Google profile basics (name, email, avatar)
                </td>
                <td className="px-4 py-3 align-top">
                  Identify your account if you choose Google sign-in.
                </td>
                <td className="px-4 py-3 align-top">
                  Google (only if you use Google sign-in).
                </td>
              </tr>
              <tr className="border-b-2 border-ink/15">
                <td className="px-4 py-3 align-top font-semibold">
                  Apple account basics (name, email)
                </td>
                <td className="px-4 py-3 align-top">
                  Identify your account if you choose Sign in with Apple.
                </td>
                <td className="px-4 py-3 align-top">
                  Apple. With Apple&rsquo;s Hide My Email, the email may be a
                  private relay address that forwards to us.
                </td>
              </tr>
              <tr className="border-b-2 border-ink/15">
                <td className="px-4 py-3 align-top font-semibold">
                  Game scores and progress
                </td>
                <td className="px-4 py-3 align-top">
                  Save your progress, personal bests, and achievements.
                </td>
                <td className="px-4 py-3 align-top">
                  Your gameplay in the app.
                </td>
              </tr>
              <tr className="border-b-2 border-ink/15">
                <td className="px-4 py-3 align-top font-semibold">
                  Pro entitlement status
                </td>
                <td className="px-4 py-3 align-top">
                  Know whether the one-time unlock is active on your account.
                </td>
                <td className="px-4 py-3 align-top">
                  RevenueCat, based on your Apple or Google purchase.
                </td>
              </tr>
              <tr className="border-b-2 border-ink/15">
                <td className="px-4 py-3 align-top font-semibold">
                  App usage events (screens viewed, buttons tapped, purchases
                  started or completed)
                </td>
                <td className="px-4 py-3 align-top">
                  Understand which parts of the app work and which do not, so we
                  can improve it. Not used for advertising.
                </td>
                <td className="px-4 py-3 align-top">
                  Your use of the app, sent to PostHog.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 align-top font-semibold">
                  Limited technical data
                </td>
                <td className="px-4 py-3 align-top">
                  Deliver over-the-air updates and keep the app working.
                </td>
                <td className="px-4 py-3 align-top">Expo and EAS.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The app does <strong>not</strong> collect or store payment card data.
          Apple and Google process all payments. We use a privacy-friendly
          analytics tool (PostHog) to understand how the app is used in
          aggregate, and we do not add advertising trackers.
        </p>
        <p>
          <strong>Analytics, and what we deliberately do not do.</strong> We use
          PostHog to see how the app is used in aggregate. We have turned off the
          things that would matter most for privacy: we do not record your
          screen, we do not automatically capture what you tap, we do not collect
          your IP address or location, we do not use advertising identifiers, and
          we do not build an advertising profile.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    heading: "How we use information",
    body: (
      <>
        <p>We use the limited information above to:</p>
        <ul>
          <li>provide and run the games;</li>
          <li>save your progress and achievements;</li>
          <li>enable and restore the one-time purchase;</li>
          <li>secure accounts and prevent abuse;</li>
          <li>
            understand how the app is used, in aggregate, so we can improve it;
          </li>
          <li>respond to your support requests; and</li>
          <li>meet our legal obligations.</li>
        </ul>
        <p>
          <strong>
            We do not use information for behavioral advertising, and we do not
            build advertising profiles.
          </strong>
        </p>
      </>
    ),
  },
  {
    id: "legal-bases",
    heading: "Legal bases (GDPR)",
    body: (
      <>
        <p>
          For players in the European Economic Area and the United Kingdom, we
          rely on these legal bases:
        </p>
        <ul>
          <li>
            <strong>Contract.</strong> To provide the app and the features you
            ask for, including the one-time unlock.
          </li>
          <li>
            <strong>Consent.</strong> For optional sign-in. You can withdraw
            consent at any time.
          </li>
          <li>
            <strong>Legitimate interests.</strong> To keep the service secure and
            working, and to understand how the app is used in aggregate so we can
            improve it.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    heading: "Children under 13",
    body: (
      <>
        <p>
          The app is not designed for or directed to children under 13, and it
          is not enrolled in Apple&rsquo;s Kids Category.
        </p>
        <Card color="blue" shadow="md" padding="lg" className="not-prose">
          <ul className="list-disc space-y-2.5 pl-6 text-[1.02rem] leading-relaxed marker:text-ink">
            <li>
              We do not knowingly collect personal information from children
              under 13.
            </li>
            <li>
              We keep collection small for everyone: an optional account email,
              your game progress, and whether the unlock is active.
            </li>
            <li>
              We do not show behavioral ads or use third-party ad tracking.
            </li>
            <li>We do not sell or share personal data.</li>
            <li>
              If you believe a child under 13 has provided us personal
              information, tell us through our{" "}
              <a
                href="/support"
                className="font-semibold text-ink underline decoration-2 underline-offset-2"
              >
                support page
              </a>{" "}
              or email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-ink underline decoration-2 underline-offset-2"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              and we will delete it.
            </li>
          </ul>
        </Card>
      </>
    ),
  },
  {
    id: "no-sale",
    heading: "No sale or sharing of personal data",
    body: (
      <>
        <p>
          We do <strong>not</strong> sell your personal information, and we do{" "}
          <strong>not</strong> share it for cross-context behavioral advertising,
          in the sense those terms are used under California law (CCPA and CPRA).
          This applies to everyone.
        </p>
      </>
    ),
  },
  {
    id: "subprocessors",
    heading: "Third-party service providers",
    body: (
      <>
        <p>
          We use a small set of trusted providers (sometimes called
          subprocessors) to run the app. They process data on our behalf, under
          their own terms and safeguards.
        </p>
        <ul>
          <li>
            <strong>Supabase.</strong> Authentication and database hosting
            (stores your account and game data).{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy policy
            </a>
            .
          </li>
          <li>
            <strong>RevenueCat.</strong> Manages purchase and entitlement status
            so we know whether your unlock is active.{" "}
            <a
              href="https://www.revenuecat.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Apple.</strong> Sign-in and payment processing on iOS.{" "}
            <a
              href="https://www.apple.com/legal/privacy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Google.</strong> Sign-in and payment processing on Android.{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Expo and EAS.</strong> App builds and over-the-air updates.{" "}
            <a
              href="https://expo.dev/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy policy
            </a>
            .
          </li>
          <li>
            <strong>PostHog.</strong> Privacy-friendly product analytics, used to
            understand how the app is used in aggregate. Analytics data is not
            used for advertising and is not sold. PostHog also holds the waitlist
            emails collected on our website, kept as a separate list and never
            joined to the analytics above; see{" "}
            <a href="#about-this-website">About this website</a> below.{" "}
            <a
              href="https://posthog.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy policy
            </a>
            .
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    heading: "Data retention",
    body: (
      <>
        <p>
          We keep information while your account is active and for a reasonable
          period afterward for legal, security, and operational reasons. When you
          ask us to delete your data, we delete it. We may keep anonymized or
          aggregate information that does not identify you.
        </p>
        <p>
          <strong>Analytics events.</strong>{" "}
          Analytics events are kept for seven years. That is the retention
          period our analytics provider applies to our plan, and it is not a
          setting we can shorten.
        </p>
        <p>
          <strong>Website session recordings.</strong>{" "}
          Recordings of browsing sessions on this website are kept for 30 days
          and then deleted. This applies to the website only. The app does not
          have a session-recording module installed, so there are no app
          recordings to keep.
        </p>
      </>
    ),
  },
  {
    id: "delete",
    heading: "How to delete your account and data",
    body: (
      <>
        <p>You can ask us to delete your account and data at any time.</p>
        <ol>
          <li>
            Visit our <a href="/support">support page</a>, or email us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </li>
          <li>
            Tell us that it is a deletion request, and let us know which account
            it is for.
          </li>
          <li>
            Help us confirm you own the account, so we can protect it from
            someone else.
          </li>
        </ol>
        <p>
          We aim to complete verified requests within 30 days. You can find more
          help on our <a href="/support">support page</a>.
        </p>
      </>
    ),
  },
  {
    id: "international",
    heading: "International data transfers",
    body: (
      <>
        <p>
          We operate from the United States, and our providers may process data
          in the United States and other countries. When information crosses
          borders, we rely on appropriate safeguards for the transfer.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "How we protect information",
    body: (
      <>
        <p>
          We use reasonable technical and organizational measures to protect the
          small amount of data we hold. These include access controls and row
          level security in Supabase, encryption in transit, and limiting who can
          access data. No online service can be perfectly secure, but we work to
          keep your information safe.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you may have rights under laws such as
          the GDPR and California&rsquo;s CCPA and CPRA, including the right to:
        </p>
        <ul>
          <li>access the personal information we hold about you;</li>
          <li>correct information that is wrong;</li>
          <li>delete your information;</li>
          <li>receive a copy of your information (portability);</li>
          <li>object to or restrict certain processing;</li>
          <li>withdraw consent where we rely on it; and</li>
          <li>
            opt out of the sale or sharing of personal information (we do not
            sell or share it).
          </li>
        </ul>
        <p>
          We will not discriminate against you for using these rights. To
          exercise any of them, visit our <a href="/support">support page</a> or
          email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <>
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will change the effective date at the top of this page. For material
          changes, we will surface a notice in the app or on this site.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <>
        <p>Questions, requests, or privacy concerns? Please reach out:</p>
        <ul>
          <li>{LEGAL_ENTITY}</li>
          <li>{BUSINESS_ADDRESS}</li>
          <li>
            Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </li>
        </ul>
        <p>
          For help or to make a privacy request, visit our{" "}
          <a href="/support">support page</a>. You can also read our{" "}
          <a href="/terms">Terms of Service</a>.
        </p>
      </>
    ),
  },
  {
    id: "about-this-website",
    heading: "About this website (separate from the app)",
    body: (
      <>
        <p>
          The section below is about this marketing website
          (smartfellaorfartsmella.com), which is separate from the app described
          above. Both the website and the app use PostHog for analytics,
          configured differently: the website&rsquo;s setup is described here,
          and the app&rsquo;s more restricted setup is described in the sections
          above.
        </p>
        <Card color="cream" shadow="sm" padding="lg" className="not-prose">
          <ul className="list-disc space-y-2.5 pl-6 text-[1.02rem] leading-relaxed marker:text-ink">
            <li>
              <strong>Website analytics.</strong> This site uses PostHog for
              privacy-friendly, anonymous analytics (for example, page views and
              general usage). It does not collect personal information that
              identifies you, we do not use it for advertising, and we do not
              sell the data.
            </li>
            <li>
              <strong>Website session recordings.</strong>{" "}
              This site also records browsing sessions, so we can see where the
              page confuses people. Every input is masked, so anything you type
              (including your email) is never captured, and the recordings leave
              out request and response bodies, headers, and console logs. The
              app does not do this at all: it has no session-recording module
              installed.
            </li>
            <li>
              <strong>Waitlist emails.</strong>{" "}
              If you give us your email through the waitlist form, we store it
              in our own database and also mirror it into PostHog&rsquo;s data
              warehouse as a separate list, so we can query signups internally.
              That list stands on its own: it is not
              linked to the anonymous analytics above, it is not joined to any
              profile or to anyone&rsquo;s browsing behavior, it is not used for
              advertising, and it is not sold.
            </li>
            <li>
              <strong>SFFS Creator Studio (our own posting tool).</strong> We
              operate an internal tool that publishes our own videos to a TikTok
              account that authorized it, using TikTok Login Kit and the Content
              Posting API. It only posts to the authorized account, uses only the
              scopes granted, stores access tokens securely, and access can be
              revoked at any time from TikTok settings. This use also follows the{" "}
              <a
                href="https://developers.tiktok.com/doc/tiktok-api-terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
              >
                TikTok Developer Terms of Service
              </a>
              .
            </li>
          </ul>
        </Card>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={EFFECTIVE_DATE}
      intro={
        <p>
          Smart Fella or Fart Smella is part brain workout and part arcade, with
          a very stupid name. This policy explains, in plain language, what the
          app collects (not much), why, and the choices you have.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
