import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Marquee } from "@/components/ui/marquee";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

export type LogoCloudVariant = "marquee" | "grid";

/** Section background colors (mirrors the `<Section>` background union). */
export type LogoCloudBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

export interface LogoCloudProps {
  /** Small uppercase label above the logos. Pass `""` to hide it. */
  label?: string;
  /** Company wordmarks shown as bordered pills. Falls back to defaults when omitted or empty. */
  companies?: string[];
  /** `"marquee"` auto-scrolls the pills; `"grid"` wraps them in a centered row. */
  variant?: LogoCloudVariant;
  /** Full-bleed color block behind the strip. */
  background?: LogoCloudBackground;
  /** Extra classes for the outer section. */
  className?: string;
  /** Optional id for deep-linking. */
  id?: string;
  /** Fade + rise the label and (grid variant) stagger the pills on scroll. */
  revealContent?: boolean;
}

/** Original placeholder wordmarks, never real brand logos. */
const DEFAULT_COMPANIES = [
  "ACME",
  "GLOBEX",
  "INITECH",
  "HOOLI",
  "UMBRELLA",
  "SOYLENT",
  "PIED PIPER",
  "WAYSTAR",
  "STARK",
  "WONKA",
];

/** Edge fade so marquee pills scroll in/out instead of popping at the clip. */
const FADE_MASK = "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)";

function LogoPill({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full",
        "border-[2.5px] border-ink bg-paper px-5 py-2.5 shadow-hard-xs",
        "font-display text-base uppercase leading-none text-ink md:text-lg",
      )}
    >
      {name}
    </span>
  );
}

export function LogoCloud({
  label = "Trusted by reps at",
  companies,
  variant = "marquee",
  background = "cream",
  className,
  id,
  revealContent = true,
}: LogoCloudProps) {
  const items = companies && companies.length > 0 ? companies : DEFAULT_COMPANIES;

  return (
    <Section id={id} background={background} padding="md" className={className}>
      {label ? (
        <Reveal enabled={revealContent} className="text-center">
          <Eyebrow>{label}</Eyebrow>
        </Reveal>
      ) : null}

      {variant === "grid" ? (
        <Reveal
          as="ul"
          stagger
          enabled={revealContent}
          className={cn(
            "flex flex-wrap items-center justify-center gap-3 sm:gap-4",
            label && "mt-8",
          )}
        >
          {items.map((name, i) => (
            <li key={`${name}-${i}`}>
              <LogoPill name={name} />
            </li>
          ))}
        </Reveal>
      ) : (
        <div
          className={cn(label && "mt-8")}
          style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }}
        >
          <Marquee speed={40} gap="2rem" className="py-2">
            {items.map((name, i) => (
              <LogoPill key={`${name}-${i}`} name={name} />
            ))}
          </Marquee>
        </div>
      )}
    </Section>
  );
}
