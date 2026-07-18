import type { Metadata } from "next";
import { Crosshair, Quote, Zap } from "lucide-react";

import { PageHero } from "@/components/sections/page-hero";
import { VideoFeature } from "@/components/sections/video-feature";
import { FeatureGrid } from "@/components/sections/feature-grid";
import { PodcastList } from "@/components/sections/podcast";
import { LogoCloud } from "@/components/sections/logo-cloud";
import { Testimonials } from "@/components/sections/testimonials";
import { NewsletterSignup } from "@/components/sections/newsletter-signup";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  // `absolute` bypasses the root layout's "%s · Closer" title template so the
  // full, self-contained page title renders exactly as intended.
  title: {
    absolute: "Teardowns - Watch Real Sales Calls Get Dissected | Closer",
  },
  description:
    "Every week Closer breaks down a real sales call, moment by moment, the fumble, the save, and the exact line that turned it around. Watch the latest teardown, browse the archive, and get each new episode free.",
};

export default function TeardownPage() {
  return (
    <>
      {/* 1, coral */}
      <PageHero
        eyebrow="The Teardown Series"
        title="Watch real sales calls get taken apart"
        subtitle="Every week we drop one recorded deal on the table and dissect it line by line, the fumble, the recovery, and the exact move that swung it. Steal what works and skip the theory."
        cta={{ label: "Watch the latest", href: "#featured" }}
        secondaryCta={{ label: "Subscribe free", href: "#subscribe" }}
        align="left"
        background="coral"
      />

      {/* 2, ink */}
      <div id="featured" className="scroll-mt-24">
        <VideoFeature
          eyebrow="This week's teardown"
          title="The discovery call that almost died at hello"
          subtitle="A first-call opener face-plants, the rep goes quiet, then one reframe drags the whole conversation back from the edge. We slow it down and mark every turn."
          caption="Episode 48 · Discovery call · 12 min"
          layout="split"
          background="ink"
        />
      </div>

      {/* 3, cream */}
      <FeatureGrid
        eyebrow="What you'll steal"
        title="What you'll steal from every teardown"
        intro="Three things you walk away with, every single episode, no notebook required."
        columns={3}
        features={[
          {
            icon: Crosshair,
            title: "Spot the exact turn",
            body: "We freeze the one moment a call quietly tips from “maybe” to “yes,” so you start feeling it happen on your own dials.",
          },
          {
            icon: Quote,
            title: "Hear the reset line",
            body: "Catch the precise words a rep uses to unstick a stalled conversation, then keep them ready for your next objection.",
          },
          {
            icon: Zap,
            title: "Leave with a play",
            body: "Every teardown ends with one concrete move you can run on your very next call, not someday, tomorrow.",
          },
        ]}
        background="cream"
      />

      {/* 4, paper */}
      <PodcastList
        eyebrow="The teardown archive"
        title="Every teardown in one place"
        description="Browse the full run of dissected calls, real openers, real objections, real saves. Start with the latest, then binge the back catalog."
        featured
        id="teardowns"
        className="scroll-mt-24"
        episodes={[
          {
            number: 48,
            title: "The discovery call that almost died at hello",
            description:
              "A shaky opener nearly ends it in ten seconds, until one reframe resets the entire call.",
            duration: "12 min",
            date: "Jul 14, 2026",
            accent: "blue",
          },
          {
            number: 47,
            title: "Surviving “we're not interested” on a cold call",
            description:
              "The rep eats the brush-off, stays calm, and books a meeting anyway. Here's exactly how.",
            duration: "9 min",
            date: "Jul 7, 2026",
            accent: "coral",
          },
          {
            number: 46,
            title: "The demo that talked itself out of the deal",
            description:
              "Forty features, zero questions. We mark every place this walkthrough lost the room.",
            duration: "15 min",
            date: "Jun 30, 2026",
            accent: "yellow",
          },
          {
            number: 45,
            title: "Reviving a deal that went silent for three weeks",
            description:
              "One honest, no-pressure follow-up pulls a ghosted opportunity back to life.",
            duration: "11 min",
            date: "Jun 23, 2026",
            accent: "mint",
          },
          {
            number: 44,
            title: "The pricing call where holding firm won",
            description:
              "The buyer pushes for a discount three times. Watch the rep trade instead of fold.",
            duration: "13 min",
            date: "Jun 16, 2026",
            accent: "blue",
          },
          {
            number: 43,
            title: "A renewal that quietly became an upsell",
            description:
              "A routine check-in uncovers a bigger problem, and a bigger contract.",
            duration: "10 min",
            date: "Jun 9, 2026",
            accent: "coral",
          },
        ]}
        background="paper"
      />

      {/* 5, mint */}
      <LogoCloud
        label="Where our members are closing"
        companies={[
          "NORTHWIND",
          "CONTOSA",
          "MERIDIAN",
          "BLUEPEAK",
          "IRONCLAD",
          "SUMMIT NINE",
          "CORTEX",
          "HELIOS",
          "AVERSA",
          "VANTALOOP",
        ]}
        variant="marquee"
        background="mint"
      />

      {/* 6, blue */}
      <Testimonials
        eyebrow="Reps who watch, win"
        title="It changed how they run every call"
        testimonials={[
          {
            quote:
              "I watched one teardown on Friday and closed a stalled deal on Monday with the exact reset line. Wild.",
            name: "Renata Cole",
            role: "Account Executive",
            company: "Brightwave",
            avatarColor: "coral",
          },
          {
            quote:
              "Seeing a real call get marked up beats any script. I finally get why my openers kept falling flat.",
            name: "Devon Pryce",
            role: "SDR",
            company: "Lattice Point",
            avatarColor: "yellow",
          },
          {
            quote:
              "We play the newest teardown in our Monday standup. The whole team now hears the turns before they happen.",
            name: "Amara Idris",
            role: "Sales Manager",
            company: "Northgate",
            avatarColor: "ink",
          },
          {
            quote:
              "The pricing teardown paid for my whole quarter. I stopped caving the second a buyer pushed back.",
            name: "Luca Moretti",
            role: "Enterprise AE",
            company: "Cindergate",
            avatarColor: "mint",
          },
          {
            quote:
              "It's the only sales content I actually finish. Ten minutes, one call, one move I can steal.",
            name: "Priya Raman",
            role: "Founder",
            company: "Tempo",
            avatarColor: "blue",
          },
        ]}
        background="blue"
      />

      {/* 7, yellow (client: form state) */}
      <NewsletterSignup
        variant="inline"
        title="Get every new teardown in your inbox"
        subtitle="One fresh call, dissected and delivered every Friday. Free, no fluff, unsubscribe whenever."
        buttonLabel="Subscribe free"
        background="yellow"
        id="subscribe"
        className="scroll-mt-24"
      />

      {/* 8, coral (recolored off ink so the closing band doesn't fuse with the ink footer) */}
      <CtaBand
        title="Bring us your worst call"
        subtitle="Sitting on a recording that still makes you wince? Send it in. We'll tear it down on a future episode, names blurred, lessons loud."
        primaryCta={{ label: "Submit a call", href: "/submit" }}
        secondaryCta={{ label: "Browse teardowns", href: "#teardowns" }}
        align="center"
        badge="No call too messy"
        background="coral"
      />
    </>
  );
}
