import { Fragment } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Placeholder } from "@/components/ui/placeholder";
import { Reveal } from "@/components/quiz/reveal";

/** A single numbered step in the "how it works" flow. */
export interface StepItem {
  title: string;
  body: string;
  /** Optional small eyebrow/badge rendered above the step title. */
  label?: string;
  /** Optional caption; when set, renders a small bordered `<Placeholder>` under the step. */
  mediaLabel?: string;
}

/** A labelled link rendered as the section's trailing call-to-action. */
export interface StepsCta {
  /** Button text, e.g. "Buy the book". */
  label: string;
  /** Destination, internal path (e.g. "#pricing") or absolute URL. */
  href: string;
  /** Optional button variant override; defaults to a per-background contrast color. */
  variant?: ButtonVariant;
}

/** Allowed section color blocks, derived from the shared `<Section>` primitive. */
type SectionBackground = NonNullable<React.ComponentProps<typeof Section>["background"]>;
/** Button color options, derived from the shared `<Button>` primitive. */
type ButtonVariant = NonNullable<React.ComponentProps<typeof Button>["variant"]>;

export interface StepsProps {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  /** Anton display headline for the section. */
  title?: string;
  /** 3-4 steps render best; each is a numbered circle + heading + body. */
  steps?: StepItem[];
  /** Full-bleed color block behind the section. */
  background?: SectionBackground;
  /** Optional anchor id (e.g. for "#how-it-works" navigation). */
  id?: string;
  /**
   * Optional trailing call-to-action rendered as a centered pill button below
   * the steps (e.g. a recurring "Buy the book" link). Omit to hide it.
   */
  cta?: StepsCta;
  /** Fade + rise the inner content on scroll while the section bg stays static. */
  revealContent?: boolean;
  className?: string;
}

/**
 * Bright accent fills for the numbered circles, rotated per step. Kept light so
 * the black Anton number and black border always read at high contrast, even
 * when the section itself sits on a dark `ink` block.
 */
const CIRCLE_COLORS = ["bg-yellow", "bg-coral", "bg-mint", "bg-blue"] as const;

/**
 * Per-background button variant so the trailing CTA pill always contrasts with
 * the section block it sits on (mirrors the shared `CtaBand` recipe).
 */
const CTA_VARIANT: Record<SectionBackground, ButtonVariant> = {
  paper: "ink",
  cream: "ink",
  blue: "ink",
  mint: "ink",
  coral: "ink",
  yellow: "ink",
  gray: "ink",
  ink: "yellow",
};

const DEFAULT_STEPS: StepItem[] = [
  {
    title: "Map the account",
    body: "Pinpoint the handful of accounts most likely to buy, then build a simple plan for each before you ever pick up the phone.",
  },
  {
    title: "Run the play",
    body: "Open with a sharp, relevant hook, ask the questions that surface real pain, and let the prospect talk their way to the problem.",
  },
  {
    title: "Close with confidence",
    body: "Recap the value, meet objections head-on, and lock in a clear next step so the deal never stalls in limbo.",
  },
];

/**
 * "How it works" section: numbered accent circles connected by arrows on
 * desktop, stacked cleanly on mobile. Renders complete with zero props and
 * accepts typed overrides for copy, steps, color, and a trailing CTA.
 */
export function Steps({
  eyebrow = "How it works",
  title = "Your fastest path to closed won",
  steps = DEFAULT_STEPS,
  background = "blue",
  id,
  cta,
  revealContent = true,
  className,
}: StepsProps = {}) {
  return (
    <Section background={background} id={id} className={className}>
      <Reveal stagger enabled={revealContent} className="mx-auto max-w-2xl text-center">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading as={2} size="lg" className="mt-3">
          {title}
        </Heading>
      </Reveal>

      <Reveal
        as="ol"
        stagger
        enabled={revealContent}
        className="mt-12 flex flex-col gap-10 lg:mt-16 lg:flex-row lg:items-start lg:gap-4"
      >
        {steps.map((step, i) => (
          <Fragment key={`${step.title}-${i}`}>
            <li className="flex flex-1 flex-col items-center text-center">
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full border-[2.5px] border-ink shadow-hard-sm",
                  CIRCLE_COLORS[i % CIRCLE_COLORS.length],
                )}
              >
                <span className="font-display text-3xl leading-none text-ink">
                  {i + 1}
                </span>
              </div>
              {step.label ? (
                <Badge color="paper" size="sm" shadow="hard" className="mt-5">
                  {step.label}
                </Badge>
              ) : null}
              <Heading as={3} size="sm" className={step.label ? "mt-3" : "mt-5"}>
                {step.title}
              </Heading>
              <p className="mt-2 max-w-sm text-base leading-relaxed opacity-80">
                {step.body}
              </p>
              {step.mediaLabel ? (
                <div className="mt-6 w-full max-w-sm">
                  <Placeholder
                    aspect="16/9"
                    label={step.mediaLabel}
                    rounded="rounded-xl"
                  />
                </div>
              ) : null}
            </li>

            {i < steps.length - 1 && (
              <li
                aria-hidden
                className="hidden h-16 shrink-0 items-center justify-center lg:flex"
              >
                <ArrowRight className="h-8 w-8" strokeWidth={2.5} />
              </li>
            )}
          </Fragment>
        ))}
      </Reveal>

      {cta ? (
        <div className="mt-12 flex justify-center lg:mt-16">
          <Button href={cta.href} variant={cta.variant ?? CTA_VARIANT[background]} size="lg">
            {cta.label}
          </Button>
        </div>
      ) : null}
    </Section>
  );
}
