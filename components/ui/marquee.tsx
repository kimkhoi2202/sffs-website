import { cn } from "@/lib/utils";

/**
 * Seamless horizontal marquee (logo/word strips). Duplicates children so the
 * loop is continuous. Uses the `.marquee-track` utility from globals.css.
 */
export function Marquee({
  speed = 30,
  gap = "2rem",
  reverse = false,
  className,
  children,
}: {
  speed?: number;
  gap?: string;
  reverse?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("group relative w-full overflow-hidden", className)}>
      <div
        className="marquee-track items-center"
        style={
          {
            "--marquee-duration": `${speed}s`,
            gap,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-center" style={{ gap }}>
          {children}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap }} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
