import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarColor = "blue" | "mint" | "coral" | "yellow" | "gray" | "ink";

const colorMap: Record<AvatarColor, string> = {
  blue: "bg-blue text-ink",
  mint: "bg-mint text-ink",
  coral: "bg-coral text-ink",
  yellow: "bg-yellow text-ink",
  gray: "bg-gray-100 text-ink",
  ink: "bg-ink text-paper",
};

const sizeMap = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-20 w-20 text-lg",
} as const;

/** Circular bordered avatar with initials (placeholder for people photos). */
export function Avatar({
  initials,
  color = "blue",
  size = "md",
  className,
  ...rest
}: {
  initials: string;
  color?: AvatarColor;
  size?: keyof typeof sizeMap;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, "className" | "children" | "color">) {
  // Decorative by default: avatars sit beside the person's visible name, so the
  // initials are redundant to screen readers unless a caller sets aria-label.
  const isDecorative = rest["aria-label"] === undefined;
  return (
    <span
      {...rest}
      aria-hidden={isDecorative ? true : rest["aria-hidden"]}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border-[2.5px] border-ink font-sans font-bold uppercase",
        colorMap[color],
        sizeMap[size],
        className,
      )}
    >
      {initials.slice(0, 2)}
    </span>
  );
}
