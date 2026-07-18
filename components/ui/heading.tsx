import { cn } from "@/lib/utils";

type Level = 1 | 2 | 3 | 4;
type Size = "display" | "xl" | "lg" | "md" | "sm";

const sizeMap: Record<Size, string> = {
  display: "text-display",
  xl: "font-display text-[clamp(2.25rem,4vw,4rem)] leading-[1.05] tracking-[-0.01em]",
  lg: "font-display text-[clamp(2rem,3vw,3rem)] leading-[1.1] tracking-[-0.01em]",
  md: "font-display text-[clamp(1.5rem,2.2vw,2.25rem)] leading-[1.1]",
  sm: "font-display text-[clamp(1.25rem,1.6vw,1.75rem)] leading-[1.15]",
};

/**
 * Display heading in Anton. `uppercase` defaults on for the 30MPC look.
 */
export function Heading({
  as,
  size = "lg",
  uppercase = true,
  className,
  children,
}: {
  as?: Level;
  size?: Size;
  uppercase?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = (`h${as ?? (size === "display" || size === "xl" ? 1 : size === "lg" ? 2 : 3)}`) as
    | "h1"
    | "h2"
    | "h3"
    | "h4";
  return (
    <Tag className={cn(sizeMap[size], uppercase && "uppercase", className)}>
      {children}
    </Tag>
  );
}
