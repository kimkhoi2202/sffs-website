import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/sections/legal-page";
import { Card } from "@/components/ui/card";

/*
  Deliverable 1: the Smart Fella or Fart Smella APP Privacy Policy.

  The operator is an individual sole developer (Kim Khoi Lam), not a company.
*/
const LEGAL_ENTITY = "Kim Khoi Lam";
const BUSINESS_ADDRESS = "1143 Sultana Spgs Ct, Houston, TX 77090";
const EFFECTIVE_DATE = "July 24, 2026";
const SUPPORT_EMAIL = "smartfellaorfartsmella123@gmail.com";

export const metadata: Metadata = {
  // Absolute title so the exact required tag is emitted (bypasses the site
  // template that appends a middot suffix).
  title: { absolute: "Privacy Policy | Smart Fella or Fart Smella" },
  description:
    "How Smart Fella or Fart Smella collects, uses, and protects data, with a strong focus on children's privacy and parental rights.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Privacy Policy | Smart Fella or Fart Smella",
    description:
      "How Smart Fella or Fart Smella collects, uses, and protects data, with a strong focus on children's privacy and parental rights.",
    url: "/privacy",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Smart Fella or Fart Smella",
    description:
      "How Smart Fella or Fart Smella collects, uses, and protects data, with a strong focus on children's privacy and parental rights.",
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
          or your child play, why we handle it, and the choices your family has.
        </p>
        <p>
          We wrote this policy to be easy for a parent to read and to put
          children&rsquo;s privacy first. If anything here is unclear, please
          reach out through our <a href="/support">support page</a>.
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
          Smart Fella or Fart Smella is a brain-training and casual-games app for
          tweens: part brain workout, part arcade for young minds. It is made to
          be fun for kids and reassuring for parents.
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
            <li>We collect very little, and only what the app needs to run.</li>
            <li>
              We never sell or share your personal data, and there are no
              third-party ads.
            </li>
            <li>The app is built for kids, and it respects parents.</li>
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
          Smart Fella or Fart Smella is designed for tweens in grades 5 to 8,
          roughly ages 10 to 14. Some players are under 13, so children&rsquo;s
          privacy laws apply and we take them seriously.
        </p>
        <p>
          A parent or guardian may create and own the account. If you are a
          grown-up setting this up for your child, this policy is written with
          you in mind.
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
                  You or a parent at sign-in, handled through Supabase using
                  email and password, Google, or Apple.
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
          Apple and Google process all payments. Analytics in the app are minimal
          to none, and we do not add advertising trackers.
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
          <li>respond to your support requests; and</li>
          <li>meet our legal obligations.</li>
        </ul>
        <p>
          <strong>
            We do not use information for behavioral advertising, and we do not
            build advertising profiles of children.
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
            <strong>Consent.</strong> For optional sign-in, and for parental
            consent where a child in the EU uses the app. You can withdraw
            consent at any time.
          </li>
          <li>
            <strong>Legitimate interests.</strong> To keep the service secure and
            working.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    heading: "Children's privacy (COPPA and GDPR-K)",
    body: (
      <>
        <p>
          This is the part parents care about most, so we put it front and
          center.
        </p>
        <Card color="blue" shadow="md" padding="lg" className="not-prose">
          <ul className="list-disc space-y-2.5 pl-6 text-[1.02rem] leading-relaxed marker:text-ink">
            <li>
              We design the app to minimize any child&rsquo;s personal
              information beyond an account email.
            </li>
            <li>
              A parent or guardian may create and control the account.
            </li>
            <li>
              We do not knowingly over-collect, and we do not show behavioral ads
              or use third-party ad tracking.
            </li>
            <li>We do not sell or share children&rsquo;s data.</li>
            <li>
              <strong>Parental rights.</strong> A parent or guardian may review,
              correct, delete, or revoke consent by using our{" "}
              <a
                href="/support"
                className="font-semibold text-ink underline decoration-2 underline-offset-2"
              >
                support page
              </a>{" "}
              or emailing{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-ink underline decoration-2 underline-offset-2"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </li>
            <li>
              <strong>How we verify a parent request.</strong> Before we act on a
              request about a child&rsquo;s account, we confirm it comes from the
              parent or account owner, for example by confirming control of the
              account email.
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
          This applies to everyone, including children.
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
            Help us confirm you own the account (or that you are the parent or
            guardian), so we can protect it from someone else.
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
          above. It does not change how the app handles data, and it does not add
          any analytics to the app.
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
          Smart Fella or Fart Smella is part brain workout and part arcade, made
          for curious tweens. This policy explains, in plain language, what the
          app collects (not much), why, and the choices you and your family have.
          We built it to put children&rsquo;s privacy first.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
