import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Closer collects, uses, and protects your information across our sales-training playbooks, courses, and coaching, and the choices and rights you have over your data.",
};

const LAST_UPDATED = "January 6, 2026";

/** Section id → label, reused for the anchor targets and the on-page contents card. */
const TOC = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-your-information", label: "How We Use Your Information" },
  { id: "cookies", label: "Cookies & Tracking Technologies" },
  { id: "how-we-share-information", label: "How We Share Information" },
  { id: "your-rights", label: "Your Privacy Rights & Choices" },
  { id: "data-retention", label: "Data Retention" },
  { id: "data-security", label: "Data Security" },
  { id: "childrens-privacy", label: "Children's Privacy" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle={`Last updated: ${LAST_UPDATED}`}
        cta={null}
        align="left"
        background="cream"
      />

      <Section background="paper" padding="lg" container={false}>
        <Container size="prose">
          <article className="space-y-12">
            <div className="space-y-3">
              <p className="text-lg leading-relaxed text-ink">
                This Privacy Policy explains what information Closer collects, why we collect it,
                and the choices you have. It applies to our website, newsletters, courses, and
                coaching. By using Closer, you agree to the practices described below.
              </p>
              <p className="text-sm text-gray-600">
                This is original placeholder copy written for a design demo. It is a generic
                template, not legal advice, and does not reflect any real company&rsquo;s data
                practices.
              </p>
            </div>

            <Card color="cream" shadow="sm" padding="md">
              <Eyebrow>On this page</Eyebrow>
              <ul className="mt-3 grid gap-1 text-sm font-medium sm:grid-cols-2">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="underline underline-offset-4 hover:opacity-70"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>

            <section id="information-we-collect" className="scroll-mt-24">
              <Heading as={2} size="sm">
                Information We Collect
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  When you visit Closer, create an account, enroll in a course, or work with a
                  coach, we collect information that helps us provide and improve the service. The
                  categories below describe the general types of information a product like ours
                  typically gathers.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    <span className="font-semibold">Account details</span> you provide, such as your
                    name, email address, and any profile information you choose to add.
                  </li>
                  <li>
                    <span className="font-semibold">Usage and device information</span>, including
                    pages you view, features you use, browser type, and an approximate location
                    derived from your IP address.
                  </li>
                  <li>
                    <span className="font-semibold">Payment information</span>, which is handled by
                    our third-party payment processor, we do not store full card numbers on our own
                    servers.
                  </li>
                  <li>
                    <span className="font-semibold">Content you submit</span>, such as messages, form
                    responses, and notes shared during coaching sessions.
                  </li>
                </ul>
              </div>
            </section>

            <section id="how-we-use-your-information" className="scroll-mt-24">
              <Heading as={2} size="sm">
                How We Use Your Information
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  We use the information we collect to run Closer, keep it secure, and make it more
                  useful to you. In general, we rely on this information for the following purposes:
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>Deliver and maintain the product, including your playbooks, courses, and coaching sessions.</li>
                  <li>Personalize your experience and recommend content that fits your goals.</li>
                  <li>Process transactions and send related confirmations and receipts.</li>
                  <li>Send service updates and, only if you opt in, marketing and newsletter emails.</li>
                  <li>Analyze usage so we can debug issues and improve our sales-training content.</li>
                </ul>
                <p>
                  You can opt out of marketing messages at any time using the unsubscribe link in
                  every email we send.
                </p>
              </div>
            </section>

            <section id="cookies" className="scroll-mt-24">
              <Heading as={2} size="sm">
                Cookies &amp; Tracking Technologies
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  Closer uses cookies and similar technologies, such as pixels and local storage,
                  to keep you signed in, remember your preferences, and understand how the site is
                  used. Some cookies are essential for the site to function, while others help us
                  measure and improve performance.
                </p>
                <p>
                  You can control or disable cookies through your browser settings. If you turn off
                  certain cookies, some parts of the site may not work as intended.
                </p>
              </div>
            </section>

            <section id="how-we-share-information" className="scroll-mt-24">
              <Heading as={2} size="sm">
                How We Share Information
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  We do not sell your personal information. We share it only in the limited
                  circumstances described below:
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    With <span className="font-semibold">service providers</span> who help us operate
                    Closer, such as hosting, analytics, email delivery, and payment processing,
                    under agreements that limit how they may use your data.
                  </li>
                  <li>
                    With <span className="font-semibold">partners you choose to connect</span> with,
                    and only to the extent needed to provide the service you requested.
                  </li>
                  <li>
                    When <span className="font-semibold">required by law</span>, or to protect the
                    rights, safety, and property of Closer, our users, or the public.
                  </li>
                  <li>
                    In connection with a <span className="font-semibold">business transaction</span>,
                    such as a merger or acquisition, in which case we will notify you of any change in
                    how your information is owned or used.
                  </li>
                </ul>
              </div>
            </section>

            <section id="your-rights" className="scroll-mt-24">
              <Heading as={2} size="sm">
                Your Privacy Rights &amp; Choices
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  Depending on where you live, you may have rights over the personal information we
                  hold about you. These commonly include the right to:
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>Access a copy of the information we hold about you.</li>
                  <li>Correct information that is inaccurate or incomplete.</li>
                  <li>Delete your information, subject to certain legal exceptions.</li>
                  <li>Export your information in a portable format.</li>
                  <li>Object to or restrict certain processing, and withdraw consent where processing relies on it.</li>
                </ul>
                <p>
                  To exercise any of these rights, contact us using the details in the{" "}
                  <a href="#contact" className="font-semibold underline underline-offset-4 hover:opacity-70">
                    Contact Us
                  </a>{" "}
                  section. We will respond within a reasonable timeframe and in line with applicable
                  law.
                </p>
              </div>
            </section>

            <section id="data-retention" className="scroll-mt-24">
              <Heading as={2} size="sm">
                Data Retention
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  We keep your information only for as long as we need it to provide the service,
                  comply with our legal obligations, resolve disputes, and enforce our agreements.
                  When information is no longer needed, we delete it or anonymize it so it can no
                  longer be associated with you. Retention periods vary depending on the type of data
                  and the reason it was collected.
                </p>
              </div>
            </section>

            <section id="data-security" className="scroll-mt-24">
              <Heading as={2} size="sm">
                Data Security
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  We use reasonable administrative, technical, and physical safeguards designed to
                  protect your information from unauthorized access, loss, misuse, and alteration.
                  However, no method of transmitting or storing data is ever completely secure, so we
                  cannot guarantee absolute security. If we become aware of a breach that affects your
                  information, we will notify you and the appropriate authorities as required by law.
                </p>
              </div>
            </section>

            <section id="childrens-privacy" className="scroll-mt-24">
              <Heading as={2} size="sm">
                Children&rsquo;s Privacy
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  Closer is intended for adults and is not directed to children. We do not knowingly
                  collect personal information from children under the applicable age of consent in
                  your jurisdiction. If you believe a child has provided us with personal information,
                  please contact us and we will take steps to delete it.
                </p>
              </div>
            </section>

            <section id="changes" className="scroll-mt-24">
              <Heading as={2} size="sm">
                Changes to This Policy
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our
                  practices, technology, or legal requirements. When we do, we will revise the
                  &ldquo;Last updated&rdquo; date at the top of this page. For material changes, we
                  will provide additional notice, such as an email or an in-product message, before
                  the changes take effect.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <Heading as={2} size="sm">
                Contact Us
              </Heading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink">
                <p>
                  If you have questions about this policy or would like to exercise your privacy
                  rights, you can reach our team using the placeholder details below.
                </p>
                <Card color="cream" shadow="sm" padding="md">
                  <p className="font-semibold text-ink">Closer, Inc. - Privacy Team</p>
                  <p className="mt-1">
                    Email:{" "}
                    <a
                      href="mailto:privacy@closer.example"
                      className="font-semibold underline underline-offset-4 hover:opacity-70"
                    >
                      privacy@closer.example
                    </a>
                  </p>
                  <p>Mail: 100 Placeholder Ave, Suite 200, Example City, CA 00000</p>
                </Card>
              </div>
            </section>
          </article>
        </Container>
      </Section>

      <CtaBand
        title="Questions about your privacy?"
        subtitle="We're happy to help. Reach the Closer team and we'll walk you through your data, your choices, and your rights."
        primaryCta={{ label: "Contact us", href: "/contact" }}
        secondaryCta={null}
        badge={null}
        align="center"
        background="blue"
      />
    </>
  );
}
