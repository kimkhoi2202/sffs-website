import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const cardVariants = cva(
  "border-[2.5px] border-ink rounded-2xl",
  {
    variants: {
      color: {
        paper: "bg-paper text-ink selection:bg-blue selection:text-ink",
        cream: "bg-cream text-ink selection:bg-coral selection:text-ink",
        blue: "bg-blue text-ink selection:bg-yellow selection:text-ink",
        mint: "bg-mint text-ink selection:bg-coral selection:text-ink",
        coral: "bg-coral text-ink selection:bg-yellow selection:text-ink",
        yellow: "bg-yellow text-ink selection:bg-coral selection:text-ink",
        ink: "bg-ink text-paper selection:bg-yellow selection:text-ink",
      },
      shadow: {
        none: "",
        sm: "shadow-hard-sm",
        md: "shadow-hard",
        lg: "shadow-hard-lg",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "press-lg cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      color: "paper",
      shadow: "md",
      padding: "md",
      interactive: false,
    },
  },
);

export function Card({
  color,
  shadow,
  padding,
  interactive,
  className,
  children,
  ...rest
}: VariantProps<typeof cardVariants> &
  React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(cardVariants({ color, shadow, padding, interactive }), className)}
      {...rest}
    >
      {children}
    </div>
  );
}
