import { cn } from "@/lib/utils";
import { Reveal } from "@/components/quiz/reveal";
import { Container } from "./container";

type SectionBg =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

const bgMap: Record<SectionBg, string> = {
  paper: "bg-paper text-ink",
  cream: "bg-cream text-ink",
  ink: "bg-ink text-paper",
  blue: "bg-blue text-ink",
  mint: "bg-mint text-ink",
  coral: "bg-coral text-ink",
  yellow: "bg-yellow text-ink",
  gray: "bg-gray-100 text-ink",
};

type SectionPadding = "sm" | "md" | "lg" | "none";

const padMap: Record<SectionPadding, string> = {
  none: "",
  sm: "py-10 md:py-14",
  md: "py-14 md:py-20",
  lg: "py-16 md:py-28",
};

export function Section({
  as: Tag = "section",
  background = "paper",
  padding = "lg",
  bordered = false,
  container = "page",
  containerClassName,
  className,
  id,
  revealContent = false,
  children,
}: {
  as?: "section" | "div" | "header" | "footer";
  background?: SectionBg;
  padding?: SectionPadding;
  /** Adds thick black top+bottom borders (the color-block divider look). */
  bordered?: boolean;
  container?: "page" | "prose" | "form" | "full" | false;
  containerClassName?: string;
  className?: string;
  id?: string;
  /**
   * Opt-in: fade + rise the inner content on scroll (via <Reveal>) while the
   * colored section background stays painted and perfectly static, so no white
   * ever flashes behind the band during its reveal. Off by default, so existing
   * pages are unaffected. Reduced-motion is respected by <Reveal>.
   */
  revealContent?: boolean;
  children: React.ReactNode;
}) {
  const content =
    container === false ? (
      children
    ) : (
      <Container size={container} className={containerClassName}>
        {children}
      </Container>
    );

  return (
    <Tag
      id={id}
      className={cn(
        "relative w-full",
        bgMap[background],
        padMap[padding],
        bordered && "border-y-[2.5px] border-ink",
        className,
      )}
    >
      {revealContent ? <Reveal>{content}</Reveal> : content}
    </Tag>
  );
}
