"use client";

import {
  useId,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
} from "react";
import { ArrowRight, Check, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Input, Label } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";

/** Full-bleed section color block (mirrors the `Section` primitive's options). */
type SectionBackground = NonNullable<ComponentProps<typeof Section>["background"]>;

/** Bright accents used for the little check circles. */
type Accent = "blue" | "mint" | "coral" | "yellow";

/** Submit state for the local (no-backend) form. */
type Status = "idle" | "error" | "success";

export interface NewsletterSignupProps {
  /** Layout: `hero` is a full color-blocked block; `inline` is a compact embed. */
  variant?: "hero" | "inline";
  /** Full-bleed color block behind the section (defaults: hero → blue, inline → cream). */
  background?: SectionBackground;
  /** Anton display headline. */
  title?: string;
  /**
   * Semantic heading level for the section title. Pass `1` when this section is
   * the page's top-most hero (so the page has a single `<h1>`); defaults to `2`.
   */
  headingLevel?: 1 | 2;
  /** Supporting sentence under the headline. */
  subtitle?: string;
  /** Email input placeholder. */
  placeholder?: string;
  /** Submit button label. */
  buttonLabel?: string;
  /** Small uppercase label above the headline (hero shows a default; inline hidden unless set). */
  eyebrow?: string;
  /** Benefit bullets shown in the `hero` variant. Pass `[]` to hide. */
  benefits?: string[];
  /** Show the avatar stack + social-proof line in the `hero` variant. */
  showSocialProof?: boolean;
  /** Caption next to the avatar stack. */
  socialProofLabel?: string;
  /** Message shown after a successful submit. */
  successMessage?: string;
  /** Optional anchor id (e.g. for a "#newsletter" nav link). */
  id?: string;
  /** Extra classes on the outer `<Section>`. */
  className?: string;
  /** Fade + rise the content on scroll; disable to render statically. */
  revealContent?: boolean;
}

/** Static bg classes per accent (kept literal so Tailwind's JIT can scan them). */
const accentBg: Record<Accent, string> = {
  blue: "bg-blue",
  mint: "bg-mint",
  coral: "bg-coral",
  yellow: "bg-yellow",
};

/** Contrast-safe check-circle accent per section color block. */
const checkAccent: Record<SectionBackground, Accent> = {
  paper: "mint",
  cream: "mint",
  blue: "yellow",
  mint: "coral",
  coral: "yellow",
  yellow: "coral",
  ink: "yellow",
  gray: "mint",
};

const DEFAULT_BENEFITS = [
  "One tactic you can run today",
  "A 5-minute read, zero fluff",
  "Real scripts from working reps",
];

/** Placeholder social-proof faces (initials only, no real people). */
const SOCIAL_AVATARS: { initials: string; color: Accent }[] = [
  { initials: "AR", color: "coral" },
  { initials: "JS", color: "yellow" },
  { initials: "MK", color: "mint" },
  { initials: "TL", color: "blue" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The email-capture form itself: a pill `<Input>` with a leading mail icon and
 * a submit `<Button>`, side-by-side from `sm` up and stacked on mobile. Shows an
 * inline error message when the guard fails. Presentational, all state is owned
 * by `NewsletterSignup`.
 */
function SubscribeForm({
  fieldId,
  errorId,
  status,
  email,
  placeholder,
  buttonLabel,
  buttonVariant,
  size,
  onChange,
  onSubmit,
}: {
  fieldId: string;
  errorId: string;
  status: Status;
  email: string;
  placeholder: string;
  buttonLabel: string;
  buttonVariant: "ink" | "yellow";
  size: "md" | "lg";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const invalid = status === "error";
  return (
    <form noValidate onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Label htmlFor={fieldId} className="sr-only">
            Email address
          </Label>
          <Mail
            aria-hidden="true"
            strokeWidth={2.5}
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink"
          />
          <Input
            id={fieldId}
            name="email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            placeholder={placeholder}
            value={email}
            onChange={onChange}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            className={cn("pl-12 shadow-hard-sm", size === "lg" ? "h-14" : "h-12")}
          />
        </div>
        <Button
          type="submit"
          variant={buttonVariant}
          size={size}
          className="w-full shrink-0 sm:w-auto"
        >
          {buttonLabel}
          <ArrowRight aria-hidden="true" className="size-5" />
        </Button>
      </div>
      {invalid ? (
        <p id={errorId} role="alert" className="mt-3 text-sm font-semibold text-ink">
          Please enter a valid email address.
        </p>
      ) : null}
    </form>
  );
}

/** Post-submit confirmation card, on-brand with a bordered check + hard shadow. */
function SuccessNote({
  message,
  accent,
}: {
  message: string;
  accent: Accent;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-4 rounded-2xl border-[2.5px] border-ink bg-paper px-5 py-4 text-left text-ink shadow-hard"
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full border-[2.5px] border-ink shadow-hard-xs",
          accentBg[accent],
        )}
      >
        <Check className="size-5 text-ink" strokeWidth={3} aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-lg uppercase leading-none">{message}</p>
        <p className="mt-1.5 text-sm font-medium text-gray-600">
          Your first play lands in your inbox on Monday.
        </p>
      </div>
    </div>
  );
}

/**
 * Newsletter email-capture section.
 *
 * - `hero` (default): a color-blocked `<Section>` with an eyebrow, big Anton
 *   headline, subcopy, benefit bullets, the form, a "no spam" pill, and an
 *   optional avatar-stack social-proof line.
 * - `inline`: a compact, low-chrome row (title/subtitle beside the form) meant
 *   for embedding at the bottom of a page.
 *
 * On submit it `preventDefault`s, runs a basic empty/invalid email guard, and
 * flips to a local success state, no backend. Renders great with zero props
 * and accepts typed overrides for all copy and color.
 */
export function NewsletterSignup({
  variant = "hero",
  background,
  title,
  headingLevel = 2,
  subtitle,
  placeholder = "you@company.com",
  buttonLabel = "Join free",
  eyebrow,
  benefits = DEFAULT_BENEFITS,
  showSocialProof = true,
  socialProofLabel = "Join 250k+ sellers leveling up.",
  successMessage = "You're in! Check your inbox.",
  id,
  className,
  revealContent = true,
}: NewsletterSignupProps = {}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    // Clear a previous error/success as soon as the user edits the field.
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(EMAIL_PATTERN.test(email.trim()) ? "success" : "error");
  };

  const isInline = variant === "inline";
  const bg: SectionBackground = background ?? (isInline ? "cream" : "blue");
  // Match the site's rule: black pill on bright blocks, yellow on the ink block.
  const buttonVariant = bg === "ink" ? "yellow" : "ink";
  const accent = checkAccent[bg];
  const succeeded = status === "success";

  if (isInline) {
    const resolvedTitle = title ?? "Never miss a play";
    const resolvedSubtitle =
      subtitle ?? "Get one actionable sales tip in your inbox every Monday. Free, no fluff.";

    return (
      <Section as="section" id={id} background={bg} padding="md" bordered className={className}>
        <Reveal stagger enabled={revealContent} className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
            <Heading as={headingLevel} size="md">
              {resolvedTitle}
            </Heading>
            {resolvedSubtitle ? (
              <p className="mt-2 text-base font-medium">{resolvedSubtitle}</p>
            ) : null}
          </div>

          <div className="w-full md:max-w-md md:shrink-0">
            {succeeded ? (
              <SuccessNote message={successMessage} accent={accent} />
            ) : (
              <SubscribeForm
                fieldId={fieldId}
                errorId={errorId}
                status={status}
                email={email}
                placeholder={placeholder}
                buttonLabel={buttonLabel}
                buttonVariant={buttonVariant}
                size="md"
                onChange={handleChange}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </Reveal>
      </Section>
    );
  }

  const resolvedEyebrow = eyebrow ?? "Free weekly newsletter";
  const resolvedTitle = title ?? "Get sharper at selling every Monday";
  const resolvedSubtitle =
    subtitle ??
    "One field-tested sales play in your inbox each week, prospecting, discovery, and closing tactics you can run on your very next call.";

  return (
    <Section as="section" id={id} background={bg} padding="lg" bordered className={className}>
      <Reveal stagger enabled={revealContent} className="mx-auto max-w-2xl text-center">
        {resolvedEyebrow ? <Eyebrow>{resolvedEyebrow}</Eyebrow> : null}

        {resolvedTitle ? (
          <Heading as={headingLevel} size="xl" className={cn("text-balance", resolvedEyebrow && "mt-4")}>
            {resolvedTitle}
          </Heading>
        ) : null}

        {resolvedSubtitle ? (
          <p className="mx-auto mt-4 max-w-prose text-pretty text-lg font-medium">
            {resolvedSubtitle}
          </p>
        ) : null}

        {benefits.length > 0 ? (
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="inline-flex items-center gap-2 text-sm font-semibold"
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border-[2.5px] border-ink",
                    accentBg[accent],
                  )}
                >
                  <Check className="size-3 text-ink" strokeWidth={3.5} aria-hidden="true" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mx-auto mt-8 max-w-md">
          {succeeded ? (
            <SuccessNote message={successMessage} accent={accent} />
          ) : (
            <SubscribeForm
              fieldId={fieldId}
              errorId={errorId}
              status={status}
              email={email}
              placeholder={placeholder}
              buttonLabel={buttonLabel}
              buttonVariant={buttonVariant}
              size="lg"
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {succeeded ? null : (
          <div className="mt-5 flex justify-center">
            <Badge color="paper" size="sm" shadow="hard">
              No spam · Unsubscribe anytime
            </Badge>
          </div>
        )}

        {showSocialProof && !succeeded ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="flex -space-x-3">
              {SOCIAL_AVATARS.map((person) => (
                <Avatar
                  key={person.initials}
                  initials={person.initials}
                  color={person.color}
                  size="sm"
                />
              ))}
            </div>
            <p className="text-sm font-semibold">{socialProofLabel}</p>
          </div>
        ) : null}
      </Reveal>
    </Section>
  );
}
