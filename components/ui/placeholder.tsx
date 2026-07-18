import * as React from "react";
import { cn } from "@/lib/utils";

type PlaceholderColor = "blue" | "mint" | "coral" | "yellow" | "cream" | "gray" | "ink";

const colorMap: Record<PlaceholderColor, string> = {
  blue: "bg-blue text-ink",
  mint: "bg-mint text-ink",
  coral: "bg-coral text-ink",
  yellow: "bg-yellow text-ink",
  cream: "bg-cream text-ink",
  gray: "bg-gray-100 text-ink",
  ink: "bg-ink text-paper",
};

/**
 * Consistent placeholder for imagery/video across the clone (we ship no
 * proprietary media). Renders a bordered color block with a label.
 */
export function Placeholder({
  color = "gray",
  aspect = "16/9",
  label,
  rounded = "rounded-2xl",
  bordered = true,
  className,
  children,
  ...rest
}: {
  color?: PlaceholderColor;
  aspect?: string;
  label?: string;
  rounded?: string;
  bordered?: boolean;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "color">) {
  // Decorative by default: only expose to assistive tech when a caller opts in
  // with a role or accessible name (e.g. role="img" + aria-label).
  const isDecorative = rest["aria-label"] === undefined && rest.role === undefined;
  return (
    <div
      {...rest}
      aria-hidden={isDecorative ? true : rest["aria-hidden"]}
      style={{ aspectRatio: aspect }}
      className={cn(
        "relative grid w-full place-items-center overflow-hidden",
        colorMap[color],
        rounded,
        bordered && "border-[2.5px] border-ink",
        className,
      )}
    >
      {/* diagonal hatch to read clearly as a placeholder */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0 2px, transparent 2px 12px)",
        }}
      />
      {children ?? (
        <span className="relative z-10 px-4 text-center font-sans text-sm font-bold uppercase tracking-wide opacity-70">
          {label ?? "Image"}
        </span>
      )}
    </div>
  );
}
