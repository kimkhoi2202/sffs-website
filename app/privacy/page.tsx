import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/sections/legal-page";

const LAST_UPDATED = "July 21, 2026";
const CONTACT_EMAIL = "smartfellaorfartsmella123@gmail.com";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Smart Fella or Fart Smella handles your data — minimal collection, no sale of personal information, and exactly how the SFFS Creator Studio TikTok integration is used.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    heading: "Our approach to privacy",
    body: (
      <>
        <p>
          This Privacy Policy explains what information Smart Fella or Fart Smella
          (&ldquo;SFFS,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) collects, how we use it, and the choices you have. It
          applies to our website, our quiz, and the SFFS Creator Studio TikTok
          integration.
        </p>
        <p>
          The short version: we collect as little as possible, we{" "}
          <strong>do not sell your personal information</strong>, and we
          don&rsquo;t use your data for anything beyond running and improving the
          Services. The sections below spell out the details.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    heading: "Information we collect",
    body: (
      <>
        <p>We keep data collection minimal and honest:</p>
        <ul>
          <li>
            <strong>Information you give us.</strong> If you email us or reach out
            through a social channel, we receive whatever you choose to send —
            typically your email address or handle and the contents of your
            message.
          </li>
          <li>
            <strong>Basic, aggregated analytics.</strong> Like most sites, we
            collect limited technical information automatically to understand how
            the site is used — for example page views, referring links, general
            device and browser type, and approximate (city- or country-level)
            location derived from your IP address. We use this in aggregate; we do
            not build advertising profiles about you.
          </li>
          <li>
            <strong>Quiz answers.</strong> Your quiz responses are processed to
            calculate and show your result. We do not require an account or your
            name to take the quiz, and we do not tie your individual answers to
            your identity.
          </li>
        </ul>
        <p>
          We do not knowingly collect sensitive personal information, and we ask
          that you not send it to us.
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
          <li>operate, maintain, and secure the website and the quiz;</li>
          <li>calculate and display your quiz results;</li>
          <li>
            understand aggregate usage so we can improve our content and fix
            problems;
          </li>
          <li>respond to messages and support requests you send us; and</li>
          <li>
            publish our own videos to our authorized TikTok account through SFFS
            Creator Studio (see below).
          </li>
        </ul>
        <p>
          We rely on these legitimate purposes — and, where required, your consent
          (for example for non-essential analytics cookies) — as our legal basis
          for processing.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies and analytics",
    body: (
      <>
        <p>
          We use a small number of cookies and similar technologies to make the
          site work and to gather the aggregate analytics described above. You can
          control or clear cookies in your browser settings, and where required we
          will ask for your consent before setting non-essential ones. Blocking
          some cookies may affect how parts of the site behave.
        </p>
      </>
    ),
  },
  {
    id: "tiktok",
    heading: "TikTok integration (SFFS Creator Studio)",
    body: (
      <>
        <p>
          We operate a developer application, <strong>SFFS Creator Studio</strong>
          , built on <strong>TikTok Login Kit</strong> and the{" "}
          <strong>TikTok Content Posting API</strong>. We use it to publish our
          own videos to a TikTok account that has authorized the app. Here is
          exactly how it handles data:
        </p>
        <ul>
          <li>
            <strong>Posts only to your own authorized account.</strong> The app
            uploads and publishes videos <strong>solely</strong> to the TikTok
            account whose owner authorized it. It never posts to, reads, or acts
            on any other user&rsquo;s account.
          </li>
          <li>
            <strong>Only the scopes you grant.</strong> When you connect through
            TikTok&rsquo;s official login screen, the app requests only the
            permissions it needs — reading basic profile information and
            publishing content (for example{" "}
            <code>user.info.basic</code> and <code>video.publish</code>). It
            accesses only the data covered by the scopes you approve, and nothing
            more.
          </li>
          <li>
            <strong>Access tokens are handled securely.</strong> The OAuth access
            and refresh tokens TikTok issues are stored securely, kept encrypted,
            transmitted only over encrypted connections, used only to perform the
            publishing actions you request, and never sold or shared with third
            parties for their own use.
          </li>
          <li>
            <strong>We don&rsquo;t hoard TikTok data.</strong> We do not retain
            TikTok data beyond what is needed to post content and confirm it
            published successfully. We do not use TikTok data to build profiles,
            train unrelated models, or for advertising.
          </li>
          <li>
            <strong>You can revoke access anytime.</strong> You can disconnect the
            app at any time from your TikTok account settings (Security &amp;
            permissions &rarr; Manage app permissions). Once revoked, the app can
            no longer act on your account, and we delete the associated tokens.
          </li>
        </ul>
        <p>
          Our use of TikTok data also complies with the{" "}
          <a
            href="https://developers.tiktok.com/doc/tiktok-api-terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
          >
            TikTok Developer Terms of Service
          </a>{" "}
          and TikTok&rsquo;s platform policies.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "How we share information",
    body: (
      <>
        <p>
          <strong>We do not sell your personal information.</strong> We share
          information only in these limited situations:
        </p>
        <ul>
          <li>
            <strong>Service providers.</strong> With vendors who help us run the
            Services — such as our website host and analytics provider — who may
            process data only on our instructions and for our purposes.
          </li>
          <li>
            <strong>Platforms you connect.</strong> With TikTok, as necessary to
            publish content you ask us to post through SFFS Creator Studio.
          </li>
          <li>
            <strong>Legal and safety.</strong> When we reasonably believe
            disclosure is required by law, or is needed to protect the rights,
            safety, or property of SFFS, our users, or the public.
          </li>
          <li>
            <strong>Business transfers.</strong> In connection with a merger,
            acquisition, or sale of assets, subject to this policy.
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
          We keep information only as long as we need it for the purposes
          described here. Aggregate analytics are retained in de-identified form;
          messages you send us are kept as long as needed to help you and for our
          records; and TikTok access tokens are kept only while the integration is
          connected and are deleted when you disconnect the app or the tokens
          expire.
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
          We use reasonable technical and organizational measures — including
          encryption in transit, restricted access, and secure storage of
          credentials such as OAuth tokens — to protect information against loss,
          misuse, and unauthorized access. No method of transmission or storage is
          perfectly secure, but we work to keep the small amount of data we hold
          safe.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights and choices",
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>
            request access to, correction of, or deletion of personal information
            we hold about you;
          </li>
          <li>opt out of non-essential analytics cookies;</li>
          <li>
            disconnect SFFS Creator Studio from your TikTok account at any time
            (see the TikTok section above); and
          </li>
          <li>
            object to or restrict certain processing, where the law provides for
            it.
          </li>
        </ul>
        <p>
          To exercise any of these, email us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We&rsquo;ll
          respond within a reasonable time and may need to verify your request.
        </p>
      </>
    ),
  },
  {
    id: "children",
    heading: "Children\u2019s privacy",
    body: (
      <>
        <p>
          The Services are not directed to children under 13, and we do not
          knowingly collect personal information from them. If you believe a child
          has provided us information, contact us and we will delete it.
        </p>
      </>
    ),
  },
  {
    id: "international",
    heading: "International visitors",
    body: (
      <>
        <p>
          We operate from the United States, and the limited information we
          collect may be processed there or in other countries where our service
          providers operate. Data-protection laws in those countries may differ
          from those where you live; by using the Services, you understand your
          information may be processed in the United States.
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
          We may update this Privacy Policy from time to time. When we do,
          we&rsquo;ll change the &ldquo;Last updated&rdquo; date at the top of the
          page and, for material changes, note them on the site. Please check back
          periodically.
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
          Questions, requests, or privacy concerns? We&rsquo;d genuinely like to
          hear from you:
        </p>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          Your privacy matters to us — even on a site whose whole job is to tell
          you whether you&rsquo;re a Smart Fella or a Fart Smella. This policy
          explains, in plain language, what we collect (not much), what we do with
          it, and how the SFFS Creator Studio TikTok integration is used.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
