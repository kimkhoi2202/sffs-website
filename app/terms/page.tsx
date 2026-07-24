import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/sections/legal-page";

/*
  Deliverable 2: the Smart Fella or Fart Smella APP Terms of Service.

  Fill-in values are left as clearly-marked placeholder tokens in EXACT bracket
  format so the owner can find/replace them before launch. Do NOT invent values.
  Recommended default for [Support Email]: hello@smartfellaorfartsmella.com
*/
const LEGAL_ENTITY = "[Legal Entity Name]";
const BUSINESS_ADDRESS = "[Business Address]";
const GOVERNING_LAW = "[Governing-Law Jurisdiction]";
const EFFECTIVE_DATE = "[Effective Date]";
const SUPPORT_EMAIL = "[Support Email]";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service | Smart Fella or Fart Smella" },
  description:
    "The terms for using the Smart Fella or Fart Smella app, including purchases, the one-time unlock, and acceptable use.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Terms of Service | Smart Fella or Fart Smella",
    description:
      "The terms for using the Smart Fella or Fart Smella app, including purchases, the one-time unlock, and acceptable use.",
    url: "/terms",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Smart Fella or Fart Smella",
    description:
      "The terms for using the Smart Fella or Fart Smella app, including purchases, the one-time unlock, and acceptable use.",
    images: ["/twitter-image"],
  },
};

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    heading: "Agreement",
    body: (
      <>
        <p>
          <strong>Effective date: {EFFECTIVE_DATE}</strong>
        </p>
        <p>
          These Terms of Service (the &ldquo;Terms&rdquo;) are an agreement
          between you and {LEGAL_ENTITY} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;), the operator of the Smart Fella or Fart Smella
          mobile app (the &ldquo;app&rdquo;). Please read them before using the
          app.
        </p>
      </>
    ),
  },
  {
    id: "acceptance",
    heading: "Acceptance",
    body: (
      <>
        <p>
          By downloading, opening, or using the app, you agree to these Terms and
          to our <a href="/privacy">Privacy Policy</a>. If you do not agree,
          please do not use the app.
        </p>
      </>
    ),
  },
  {
    id: "who-can-use",
    heading: "Who can use the app, and parental consent",
    body: (
      <>
        <p>
          The app is made for tweens, roughly ages 10 to 14. We care about young
          players, so parental involvement matters here.
        </p>
        <ul>
          <li>
            If you are under 13, or under the age of digital consent where you
            live, a parent or guardian must agree to these Terms and create or
            approve the account before you use the app.
          </li>
          <li>
            A parent or guardian who sets up or approves an account is
            responsible for the child&rsquo;s use of the app under these Terms.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "your-account",
    heading: "Your account",
    body: (
      <>
        <p>
          You do not need an account to play. The games work without one.
        </p>
        <p>
          If you choose to sign in, you can use Supabase email and password or
          Google sign-in. You are responsible for keeping your login details
          private and for activity that happens under your account. If you think
          someone else is using your account, contact us through our{" "}
          <a href="/support">support page</a>.
        </p>
      </>
    ),
  },
  {
    id: "license",
    heading: "Your license to use the app",
    body: (
      <>
        <p>
          We grant you a personal, limited, non-exclusive, non-transferable, and
          revocable license to use the app for your own non-commercial
          entertainment and learning. In return, you agree not to:
        </p>
        <ul>
          <li>reverse engineer, decompile, or tamper with the app;</li>
          <li>resell, rent, or commercially exploit the app or its content;</li>
          <li>
            abuse, disrupt, or try to gain unauthorized access to the app or our
            systems; or
          </li>
          <li>bypass or interfere with paid access.</li>
        </ul>
      </>
    ),
  },
  {
    id: "purchases",
    heading: "Purchases and the one-time unlock",
    body: (
      <>
        <p>
          <strong>Free to start.</strong> The first game in each category is free
          to play.
        </p>
        <p>
          <strong>One-time unlock.</strong> A single, one-time lifetime unlock
          (the non-consumable product <code>sffs_pro_lifetime</code>) unlocks the
          rest of the games. It is a one-time purchase, not a subscription.
        </p>
        <ul>
          <li>
            Purchases are billed by Apple or Google through your store account,
            not by us.
          </li>
          <li>
            <strong>Restore Purchases.</strong> You can restore your unlock on a
            supported device that is signed in to the same store account you used
            to buy it.
          </li>
          <li>
            <strong>Possible future subscriptions.</strong> We may offer
            subscriptions in the future. If we do, their own terms and pricing
            will be shown to you before you buy. There is no subscription today.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "refunds",
    heading: "Refunds",
    body: (
      <>
        <p>
          Because Apple and Google handle billing, refunds are handled by them
          under their store policies. Please request refunds through the Apple
          App Store or Google Play. If you need a hand, our{" "}
          <a href="/support">support page</a> can point you in the right
          direction.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: (
      <>
        <p>
          Keep it kind and kid-appropriate. When using the app, you agree not to:
        </p>
        <ul>
          <li>misuse the app or use it in a way that breaks the law;</li>
          <li>bypass or interfere with paid access;</li>
          <li>upload or share harmful, unlawful, or hateful content; or</li>
          <li>interfere with other players or with how the app works.</li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    heading: "Intellectual property",
    body: (
      <>
        <p>
          The app, its games, artwork, names, and branding are owned by{" "}
          {LEGAL_ENTITY} or its licensors, and are protected by intellectual
          property laws. These Terms do not transfer ownership of anything to
          you. All rights not expressly granted are reserved.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    heading: "Third-party services",
    body: (
      <>
        <p>
          The app relies on services from Apple, Google, Supabase, RevenueCat,
          and Expo and EAS. Your use of those services may also be subject to
          their own terms. We do not control them and are not responsible for
          them.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    heading: "Disclaimers",
    body: (
      <>
        <p>
          Smart Fella or Fart Smella is made for entertainment and general brain
          exercise. It is <strong>not</strong> a medical, diagnostic, clinical,
          or educational assessment tool.
        </p>
        <ul>
          <li>
            It does not diagnose, treat, or measure any condition or ability.
          </li>
          <li>
            It does not make claims about IQ, intelligence, grades, or academic
            outcomes.
          </li>
        </ul>
        <p>
          The app is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo;
          without warranties of any kind, to the fullest extent allowed by law.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    body: (
      <>
        <p>
          To the fullest extent permitted by law, {LEGAL_ENTITY} and the people
          who work on the app will not be liable for any indirect, incidental,
          special, or consequential damages arising out of or relating to your
          use of the app. Because this is a low-cost consumer app, our total
          liability is limited to the amount you paid for the app, to the extent
          permitted by law. Some places do not allow certain limitations, so some
          of the above may not apply to you.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    heading: "Indemnification",
    body: (
      <>
        <p>
          You agree to indemnify and hold harmless {LEGAL_ENTITY} from claims,
          damages, and reasonable expenses that arise out of your misuse of the
          app or your breach of these Terms.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    heading: "Termination",
    body: (
      <>
        <p>
          You may stop using the app at any time, and you can ask us to delete
          your account and data through our <a href="/support">support page</a>.
          We may suspend or end access to the app if you violate these Terms or
          create risk for us or other players.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <>
        <p>
          We may update these Terms from time to time. When we do, we will change
          the effective date at the top of this page. If you keep using the app
          after an update, you accept the revised Terms.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    heading: "Governing law",
    body: (
      <>
        <p>
          These Terms are governed by the laws of {GOVERNING_LAW}, without regard
          to conflict-of-laws rules. Nothing here limits any mandatory
          consumer-protection rights you may have where you live.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <>
        <p>Questions about these Terms? Please reach out:</p>
        <ul>
          <li>{LEGAL_ENTITY}</li>
          <li>{BUSINESS_ADDRESS}</li>
          <li>
            Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </li>
        </ul>
        <p>
          You can also read our <a href="/privacy">Privacy Policy</a> or get help
          on our <a href="/support">support page</a>.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated={EFFECTIVE_DATE}
      intro={
        <p>
          Thanks for playing Smart Fella or Fart Smella. These terms keep things
          clear about what you can expect from the app and what we expect from
          you. We kept the legalese as light as we could, so please give it a
          read.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
