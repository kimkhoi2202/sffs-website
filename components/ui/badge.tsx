import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border-[2.5px] border-ink font-sans font-bold uppercase tracking-wide leading-none",
  {
    variants: {
      color: {
        blue: "bg-blue text-ink",
        mint: "bg-mint text-ink",
        coral: "bg-coral text-ink",
        yellow: "bg-yellow text-ink",
        paper: "bg-paper text-ink",
        ink: "bg-ink text-paper",
      },
      size: {
        sm: "px-2.5 py-1 text-[0.65rem]",
        md: "px-3 py-1.5 text-xs",
      },
      shadow: {
        none: "",
        hard: "shadow-hard-xs",
      },
    },
    defaultVariants: { color: "yellow", size: "md", shadow: "none" },
  },
);

export function Badge({
  color,
  size,
  shadow,
  className,
  children,
}: VariantProps<typeof badgeVariants> & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn(badgeVariants({ color, size, shadow }), className)}>
      {children}
    </span>
  );
}
