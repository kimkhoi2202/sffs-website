"use client";

import { Accordion } from "@base-ui-components/react/accordion";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";

/** A single question/answer pair rendered as one accordion row. */
export interface FaqItem {
  /** The question shown on the always-visible trigger row. */
  q: string;
  /** The answer revealed inside the collapsible panel. */
  a: string;
}

/** Allowed section color blocks, derived from the shared `<Section>` primitive. */
type SectionBackground = NonNullable<React.ComponentProps<typeof Section>["background"]>;

export interface FaqProps {
  /** Small uppercase tracked label above the title. */
  eyebrow?: string;
  /** Anton display headline for the section. */
  title?: string;
  /** Q/A rows; ~6 read best. Falls back to a sensible default set. */
  items?: FaqItem[];
  /** Full-bleed color block behind the section. */
  background?: SectionBackground;
  /** Allow more than one row open at a time. Defaults to single-open. */
  multiple?: boolean;
  /** Optional anchor id (e.g. for a "#faq" nav link). */
  id?: string;
  /** Fade + rise the inner content on scroll while the section bg stays static. */
  revealContent?: boolean;
  className?: string;
}

const DEFAULT_ITEMS: FaqItem[] = [
  {
    q: "What exactly do I get with a Closer membership?",
    a: "Every membership unlocks the full course library, live monthly workshops, and the private community. Fresh lessons drop each month, so your playbook keeps growing long after you join.",
  },
  {
    q: "Is the newsletter really free?",
    a: "Yes, completely. The Closer newsletter lands in your inbox twice a week with tactical breakdowns, ready-to-steal call scripts, and real deal teardowns. No cost, no fluff, unsubscribe in one click.",
  },
  {
    q: "Do you offer refunds?",
    a: "We back every course with a 14-day money-back guarantee. If it doesn't help you book more meetings, email us within two weeks and we'll refund you in full, no awkward questions.",
  },
  {
    q: "How are the courses delivered?",
    a: "Everything is on-demand video you can watch at your own pace, paired with downloadable templates and scripts. Each module ends with a short action step, so you're practicing instead of just watching.",
  },
  {
    q: "Can I expense this or buy seats for my team?",
    a: "Absolutely. Team plans come with centralized billing and progress tracking, and we'll send an itemized invoice your finance team will happily approve.",
  },
  {
    q: "How long do I keep access?",
    a: "Your access stays live for as long as your membership is active, and anything you download is yours to keep. Pause or cancel whenever you like, you're always in control.",
  },
];

/**
 * FAQ section: an eyebrow + Anton headline over a bordered, hard-shadow card
 * holding an accessible Base UI accordion. Rows are split by thick black
 * dividers; the +/× indicator rotates and fills in on open. Renders complete
 * with zero props and accepts typed overrides for copy, rows, and color.
 */
export function Faq({
  eyebrow = "FAQ",
  title = "Questions, answered",
  items = DEFAULT_ITEMS,
  background = "cream",
  multiple = false,
  id,
  revealContent = true,
  className,
}: FaqProps = {}) {
  return (
    <Section background={background} id={id} className={className}>
      <Reveal stagger enabled={revealContent} className="mx-auto max-w-2xl text-center">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <Heading as={2} size="xl" className={cn(eyebrow && "mt-3")}>
            {title}
          </Heading>
        ) : null}
      </Reveal>

      {items.length > 0 ? (
        <Reveal enabled={revealContent} className="mx-auto mt-10 max-w-3xl text-ink md:mt-12">
          <Accordion.Root
            multiple={multiple}
            defaultValue={[0]}
            className="w-full space-y-5 md:space-y-6"
          >
            {items.map((item, index) => (
              <Accordion.Item
                key={`${item.q}-${index}`}
                value={index}
                className="overflow-hidden rounded-2xl border-[2.5px] border-ink bg-paper shadow-hard has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
              >
                <Accordion.Header className="m-0">
                  <Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-6 text-left transition-colors hover:bg-ink/5 data-[panel-open]:bg-ink/5 focus-visible:outline-none md:px-8 md:py-7">
                    <span className="font-sans text-base font-bold leading-snug text-ink md:text-lg">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink bg-yellow shadow-hard-xs transition-all duration-200 ease-press group-data-[panel-open]:bg-ink group-data-[panel-open]:shadow-none motion-reduce:transition-none md:size-9"
                    >
                      <Plus
                        strokeWidth={3}
                        className="size-4 text-ink transition-all duration-200 ease-press group-data-[panel-open]:rotate-45 group-data-[panel-open]:text-paper motion-reduce:transition-none md:size-[1.15rem]"
                      />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-ink transition-[height,opacity] duration-200 ease-press data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[starting-style]:h-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
                  <div className="px-6 pt-4 pb-6 md:px-8 md:pt-5 md:pb-7">
                    <p className="max-w-[60ch] text-[0.95rem] font-medium leading-relaxed text-ink/70 md:text-base">
                      {item.a}
                    </p>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Reveal>
      ) : null}
    </Section>
  );
}
