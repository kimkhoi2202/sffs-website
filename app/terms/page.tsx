import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/sections/legal-page";

const LAST_UPDATED = "July 21, 2026";
const CONTACT_EMAIL = "smartfellaorfartsmella123@gmail.com";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of Smart Fella or Fart Smella — our entertainment quiz, brand, social channels, and the SFFS Creator Studio TikTok integration.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of these terms",
    body: (
      <>
        <p>
          These Terms of Service (the &ldquo;Terms&rdquo;) are a binding
          agreement between you and Smart Fella or Fart Smella (&ldquo;Smart
          Fella or Fart Smella,&rdquo; &ldquo;SFFS,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;). They govern your access to and
          use of our website, our quiz and its results, our brand content, our
          social media channels, and any tools or applications we operate,
          including the SFFS Creator Studio described below (together, the
          &ldquo;Services&rdquo;).
        </p>
        <p>
          By visiting the site, taking the quiz, or otherwise using the
          Services, you agree to these Terms and to our{" "}
          <a href="/privacy">Privacy Policy</a>. If you do not agree, please do
          not use the Services.
        </p>
      </>
    ),
  },
  {
    id: "what-we-do",
    heading: "What Smart Fella or Fart Smella is",
    body: (
      <>
        <p>
          Smart Fella or Fart Smella is an entertainment brand. We publish a
          light-hearted personality quiz, share comedy and lifestyle content,
          and run channels on platforms such as TikTok, Instagram, and YouTube.
        </p>
        <p>
          To publish our own content more efficiently, we also operate a
          developer application called <strong>SFFS Creator Studio</strong>,
          which connects to a TikTok account we control (or an account whose
          owner has explicitly authorized it) and posts videos to that account
          through TikTok&rsquo;s Content Posting API, using TikTok Login Kit for
          authorization. Section 8 explains this integration in more detail, and
          our <a href="/privacy">Privacy Policy</a> describes how it handles
          data.
        </p>
      </>
    ),
  },
  {
    id: "entertainment-only",
    heading: "For entertainment only",
    body: (
      <>
        <p>
          The quiz, your &ldquo;Fella Score,&rdquo; and every result, ranking,
          and diagnosis we produce are for entertainment purposes only. They are,
          as we like to say, backed by vibes and questionable science.
        </p>
        <p>
          Nothing on the Services is professional advice of any kind — medical,
          psychological, legal, financial, or otherwise — and you should not rely
          on it as such. Results are not an assessment of your actual
          intelligence, character, worth, or anything else that matters. Please
          take them in the spirit intended.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "Eligibility",
    body: (
      <>
        <p>
          You must be at least 13 years old to use the Services. If you are under
          the age of majority where you live, you may use the Services only with
          the involvement and consent of a parent or legal guardian.
        </p>
        <p>
          If you connect a social account or use SFFS Creator Studio, you confirm
          that you are old enough to enter into these Terms and that you comply
          with the terms of the relevant platform (for example, TikTok&rsquo;s
          minimum-age and account requirements).
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: (
      <>
        <p>When using the Services, you agree that you will not:</p>
        <ul>
          <li>
            break any applicable law, or infringe anyone&rsquo;s rights,
            including intellectual property and privacy rights;
          </li>
          <li>
            attempt to disrupt, overload, or gain unauthorized access to the
            Services, our systems, or any connected accounts;
          </li>
          <li>
            scrape, harvest, or bulk-download content or data except as expressly
            permitted, or use automated means in a way that harms the Services;
          </li>
          <li>
            copy, resell, or commercially exploit the Services or our content
            without our written permission; or
          </li>
          <li>
            use the Services to harass others or to post or transmit anything
            unlawful, hateful, or malicious.
          </li>
        </ul>
        <p>
          We may suspend or limit access to the Services if we reasonably believe
          you have violated these Terms or created risk for us or other users.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    heading: "Our content and brand",
    body: (
      <>
        <p>
          The Services and everything in them — including the name &ldquo;Smart
          Fella or Fart Smella,&rdquo; our logos, wordmarks, quiz questions,
          copy, graphics, characters, and design — are owned by us or our
          licensors and are protected by intellectual property laws.
        </p>
        <p>
          We grant you a personal, limited, non-exclusive, non-transferable, and
          revocable license to use the Services for your own non-commercial
          enjoyment. You are welcome to share your own quiz results and our
          public posts on social media. All rights not expressly granted are
          reserved.
        </p>
      </>
    ),
  },
  {
    id: "tiktok",
    heading: "TikTok and the SFFS Creator Studio app",
    body: (
      <>
        <p>
          SFFS Creator Studio is our developer application built on TikTok Login
          Kit and the TikTok Content Posting API. Its only purpose is to help us
          publish our own videos to a connected, authorized TikTok account.
        </p>
        <ul>
          <li>
            <strong>Authorization you control.</strong> The app can only act
            after the account owner signs in through TikTok&rsquo;s official
            login and grants permission. It requests only the scopes needed to
            publish content and read basic profile information, and it can be
            disconnected at any time from the account&rsquo;s TikTok settings.
          </li>
          <li>
            <strong>Posting to your own account only.</strong> The app publishes
            videos solely to the TikTok account that authorized it. It does not
            post to, follow, message, or take actions on any other user&rsquo;s
            account.
          </li>
          <li>
            <strong>Platform rules apply.</strong> Your use of TikTok — including
            anything published through the app — is also governed by
            TikTok&rsquo;s Terms of Service and Community Guidelines. If those
            rules conflict with an action you ask the app to take, TikTok&rsquo;s
            rules control.
          </li>
        </ul>
        <p>
          For details on the data this integration touches, how access tokens are
          handled, and how you can revoke access, see the TikTok section of our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    heading: "Third-party services and links",
    body: (
      <>
        <p>
          The Services rely on and link to third parties — for example TikTok,
          Instagram, YouTube, and our hosting and analytics providers. We
          don&rsquo;t control those services and aren&rsquo;t responsible for
          their content, policies, or practices. Your use of a third-party
          service is governed by that service&rsquo;s own terms and privacy
          policy.
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
          The Services are provided &ldquo;as is&rdquo; and &ldquo;as
          available,&rdquo; without warranties of any kind, whether express or
          implied, including implied warranties of merchantability, fitness for a
          particular purpose, and non-infringement. We do not warrant that the
          Services will be uninterrupted, error-free, secure, or that any result
          or content is accurate or reliable.
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
          To the fullest extent permitted by law, Smart Fella or Fart Smella and
          the people who work on it will not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or for any
          loss of data, profits, or goodwill, arising out of or relating to your
          use of (or inability to use) the Services.
        </p>
        <p>
          To the extent any liability cannot be excluded, it is limited to the
          greater of the amount you paid us to use the Services (which, for a free
          quiz, is typically nothing) or USD $100. Some jurisdictions do not allow
          certain limitations, so some of the above may not apply to you.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    heading: "Indemnification",
    body: (
      <>
        <p>
          You agree to indemnify and hold harmless Smart Fella or Fart Smella
          from any claims, damages, liabilities, and reasonable expenses
          (including legal fees) arising out of your misuse of the Services or
          your breach of these Terms or of any third-party platform&rsquo;s rules.
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
          We may update these Terms from time to time. When we do, we&rsquo;ll
          revise the &ldquo;Last updated&rdquo; date at the top of this page.
          Material changes may be highlighted on the site. Your continued use of
          the Services after an update means you accept the revised Terms.
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
          These Terms are governed by the laws of the United States and of the
          state in which the operator of Smart Fella or Fart Smella is based,
          without regard to conflict-of-laws rules. Nothing here limits any
          mandatory consumer-protection rights you may have where you live.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <>
        <p>
          Questions about these Terms? Reach out and we&rsquo;ll get back to you:
        </p>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          Thanks for stopping by. These terms keep things clear about what you
          can expect from Smart Fella or Fart Smella and what we expect from you.
          We&rsquo;ve kept the legalese as painless as we could — please read it
          before using the Services.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
