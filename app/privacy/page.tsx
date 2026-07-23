import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/sections/legal-page";

const LAST_UPDATED = "July 23, 2026";
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
            <strong>Information you give us.</strong> When you enter your email
            address in our &ldquo;get access&rdquo; form to join the list, we
            store it so we can reach you about the Fella Test. If you email us or
            reach out through a social channel, we also receive whatever you
            choose to send.
          </li>
          <li>
            <strong>Product analytics (PostHog).</strong> We use{" "}
            <strong>PostHog</strong>, a third-party analytics provider, to
            understand how the site is used — for example page views, the social
            post or link that referred you (via UTM tags), general device and
            browser type, approximate (city- or country-level) location derived
            from your IP address, clicks and scroll depth, performance and error
            signals, and steps in the email form such as starting or submitting
            it. Once you join our list, we also send PostHog your{" "}
            <strong>email address</strong> and use it as your identifier, so these
            events connect into your individual journey rather than staying
            anonymous. We use this to see which content and traffic sources work.
            We do not build advertising profiles and we do not sell this data.
          </li>
          <li>
            <strong>Session replay.</strong> PostHog also captures{" "}
            <strong>session replays</strong> — a reconstructed playback of on-page
            interactions such as scrolling, taps, and mouse movement — so we can
            find where the experience confuses or delights. Once you join our list,
            your replays are linked to your profile. Even so, replays{" "}
            <strong>still mask everything you type</strong>: the characters of your
            email address (and any other input) are never recorded, and we do not
            capture the contents of network requests.
          </li>
          <li>
            <strong>Quiz answers.</strong> Your quiz responses are processed to
            calculate and show your result. We do not require an account or your
            name to take the quiz, and we do not tie your individual answers to
            your identity.
          </li>
        </ul>
        <p>
          <strong>
            When you join our list, we associate your email address with your
            analytics profile.
          </strong>{" "}
          We use your email as your identifier in PostHog so we can understand
          individual journeys — which post brought you, what you did on the page,
          and your signup — instead of only anonymous aggregates. Before you sign
          up, your activity is anonymous; after you sign up, it is linked to you by
          email. We still do not knowingly collect sensitive personal information,
          we do not build advertising profiles, and we do not sell your data.
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
            understand usage — both aggregate trends and, once you sign up, your
            individual journey — so we can improve our content and fix problems;
          </li>
          <li>respond to messages and support requests you send us; and</li>
          <li>
            publish our own videos to our authorized TikTok account through SFFS
            Creator Studio (see below).
          </li>
        </ul>
        <p>
          We rely on our legitimate interest in operating, measuring, and
          improving the Services as the basis for this limited analytics
          processing. We honor browser &ldquo;Do Not Track&rdquo; and Global
          Privacy Control (GPC) signals, and you can opt out at any time — see{" "}
          <a href="#your-rights">Your rights and choices</a>.
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
          We (and PostHog on our behalf) use first-party cookies and similar
          technologies (such as local storage) to run the site and to measure how
          it is used — for example to recognize a returning device, group events
          into a session, and remember preferences. Because we route analytics
          through our own domain, these are set as first-party cookies. We use
          them to understand usage and improve the site; we do <strong>not</strong>{" "}
          use them for advertising and we do <strong>not</strong> sell the data
          they collect.
        </p>
        <p>
          We honor &ldquo;Do Not Track&rdquo; and Global Privacy Control (GPC)
          browser signals — if your browser sends one, we turn analytics and
          session replay off for your visit. You can also block or clear cookies
          in your browser settings at any time; some parts of the site may then
          behave differently.
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
            Services — such as our website host (<strong>Vercel</strong>), our
            product-analytics provider (<strong>PostHog</strong>), and the cloud
            infrastructure (<strong>AWS</strong>) that stores signup emails — who
            may process data only on our instructions and for our purposes.
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
          described here. Product-analytics events and session replays are
          retained for a limited period and then automatically deleted or
          de-identified; the email you submit is kept while you are on our list;
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
          <li>
            opt out of analytics and session replay — turn on your
            browser&rsquo;s Do Not Track or Global Privacy Control signal, or
            block our cookies;
          </li>
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
