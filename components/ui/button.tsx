import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
  The canonical 30MPC-style button, the reference for the whole design system.
  Signature: pill, thick black border, hard offset shadow, UPPERCASE DM Sans.
  Interaction (btn-press utility): LIFTS on hover, PRESSES on click. The shadow
  color is driven by --btn-shadow-color (ink by default; dark/colored surfaces
  set it to #fff), so the same offset animation composes with any surface.

  Keyboard focus (focus-visible only): a bespoke three-tone ring — paper halo →
  brand-blue band → ink keyline — painted as a box-shadow on the ::after
  pseudo-element (a SEPARATE element, so the button's own btn-press box-shadow is
  never overwritten). It's needed because every brand pastel only reaches ~2.6:1
  contrast on paper (fails WCAG 1.4.11's 3:1), so a single-color ring can't stay
  visible on paper AND coral AND the black CTA band: the ink keyline carries
  contrast on light surfaces, the paper halo/blue band carry it on dark ones, and
  the blue band keeps it reading as an intentional brand highlight (not a doubled
  black border). We still override the global bare :focus-visible outline with a
  transparent real outline so a focus ring survives forced-colors / Windows High
  Contrast, where box-shadows are dropped.
*/
export const buttonVariants = cva(
  "btn-press relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[2.5px] border-ink font-sans font-bold uppercase tracking-wide leading-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transparent focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:content-[''] focus-visible:after:-inset-[2.5px] focus-visible:after:rounded-full focus-visible:after:[box-shadow:0_0_0_2px_var(--color-paper),0_0_0_5px_var(--color-blue),0_0_0_7px_var(--color-ink)]",
  {
    variants: {
      variant: {
        blue: "bg-blue text-ink",
        coral: "bg-coral text-ink",
        yellow: "bg-yellow text-ink",
        mint: "bg-mint text-ink",
        green: "bg-green text-ink",
        ink: "bg-ink text-paper",
        paper: "bg-paper text-ink",
        outline: "bg-transparent text-ink",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "blue",
      size: "md",
    },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant, size, className, children } = props;
  const classes = cn(buttonVariants({ variant, size }), className);

  if (props.href !== undefined) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } =
      props as ButtonAsLink;
    const isExternal = /^https?:\/\//.test(href) || href.startsWith("mailto:");
    if (isExternal) {
      return (
        <a href={href} className={classes} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
