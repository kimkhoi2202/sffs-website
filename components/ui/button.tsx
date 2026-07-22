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

  Keyboard focus (focus-visible only): a two-tone ring — a bold brand-blue band
  wrapped in a thin ink keyline — painted as a box-shadow on the ::after
  pseudo-element (a SEPARATE element, so the button's own btn-press box-shadow is
  never overwritten). Blue is the visible brand indicator; the outer ink keyline
  keeps the ring at WCAG 1.4.11's 3:1 on light/pastel page surfaces (where the
  blue alone only reaches ~2.6:1 and would wash out), while the blue itself
  carries the contrast on dark/ink surfaces — so at least one band always stands
  out, with no white halo. We still override the global bare :focus-visible
  outline with a transparent real outline so a focus ring survives forced-colors
  / Windows High Contrast, where box-shadows are dropped.
*/
export const buttonVariants = cva(
  "btn-press relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[2.5px] border-ink font-sans font-bold uppercase tracking-wide leading-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transparent focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:content-[''] focus-visible:after:-inset-[2.5px] focus-visible:after:rounded-full focus-visible:after:[box-shadow:0_0_0_4px_var(--color-blue),0_0_0_6px_var(--color-ink)]",
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
