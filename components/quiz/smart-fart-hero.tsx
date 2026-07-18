"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { scrollToQuizHash } from "@/components/quiz/smooth-scroll";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Split a word into per-character spans so GSAP can stagger them. */
function Chars({ text, className }: { text: string; className?: string }) {
  return (
    <span aria-label={text} className={cn("inline-block", className)}>
      {text.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          aria-hidden
          className="char inline-block"
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

/**
 * One decorative background shape. The motion is split across two nested layers
 * so it stays compositor-only and never fights itself: the outer `.fella-shape`
 * gently FLOATS (a looping translate whose distance/direction come from the
 * per-shape `--fella-float-*` vars) while its child `.fella-shape-spin`
 * continuously ROTATES — each animates a *different* element's `transform`, so
 * they compose cleanly. The innermost layer carries the visual plus a fixed
 * `tilt` that stays put when motion is reduced (the animations are disabled in
 * globals.css under prefers-reduced-motion). Size, position, and every timing
 * value are passed in so no two shapes are the same size, spot, or speed.
 */
function FloatingShape({
  style,
  floatX = "0px",
  floatY = "-16px",
  floatDuration = "9s",
  floatDelay = "0s",
  spinDuration = "22s",
  spinReverse = false,
  spinDelay = "0s",
  tilt = "0deg",
  children,
}: {
  style: CSSProperties;
  floatX?: string;
  floatY?: string;
  floatDuration?: string;
  floatDelay?: string;
  spinDuration?: string;
  spinReverse?: boolean;
  spinDelay?: string;
  tilt?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="fella-shape absolute"
      style={
        {
          ...style,
          "--fella-float-x": floatX,
          "--fella-float-y": floatY,
          "--fella-float-duration": floatDuration,
          animationDelay: floatDelay,
        } as CSSProperties
      }
    >
      <div
        className="fella-shape-spin size-full"
        style={
          {
            "--fella-spin-duration": spinDuration,
            animationDirection: spinReverse ? "reverse" : "normal",
            animationDelay: spinDelay,
          } as CSSProperties
        }
      >
        <div className="size-full" style={{ transform: `rotate(${tilt})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export interface SmartFartHeroProps {
  eyebrow?: string;
  lead?: string;
  smartWord?: string;
  orWord?: string;
  fartWord?: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
}

/**
 * Full-viewport, GSAP-animated hero. "ARE YOU A" rises in, then "SMART FELLA"
 * and "FART FELLA?" reveal with a per-character 3D stagger, the "OR" pops, and
 * the CTAs + scroll cue fade up. A scrubbed parallax lifts the whole stack as
 * you scroll away. Fully reduced-motion aware.
 */
export function SmartFartHero({
  eyebrow = "The 60-second fella diagnostic",
  lead = "Are you a",
  smartWord = "Smart Fella",
  orWord = "or",
  fartWord = "Fart Smella?",
  subtitle = "A brutally honest 27-question diagnostic that scores your fella-ness and tells you exactly which one you are. Backed by vibes, peer pressure, and questionable science.",
  primaryCta = { label: "Take the test", href: "#pricing" },
}: SmartFartHeroProps = {}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(".fella-eyebrow", { y: 24, autoAlpha: 0, duration: 0.5 })
          .from(".fella-lead", { y: 40, autoAlpha: 0, skewY: 4, duration: 0.5 }, "-=0.2")
          .from(
            ".fella-smart .char",
            { yPercent: 120, autoAlpha: 0, rotateX: -85, stagger: 0.03, duration: 0.6 },
            "-=0.1",
          )
          .from(
            ".fella-or",
            { scale: 0, autoAlpha: 0, rotate: -12, ease: "back.out(2.2)", duration: 0.45 },
            "-=0.15",
          )
          .from(
            ".fella-fart .char",
            { yPercent: 120, autoAlpha: 0, rotateX: -85, stagger: 0.03, duration: 0.6 },
            "-=0.2",
          )
          .from(".fella-sub", { y: 24, autoAlpha: 0, duration: 0.5 }, "-=0.2")
          .from(".fella-cta", { y: 24, autoAlpha: 0, duration: 0.5 }, "-=0.3")
          .from(".fella-cue", { autoAlpha: 0, duration: 0.5 }, "-=0.2");

        // Parallax lift as the hero scrolls away.
        gsap.to(".fella-inner", {
          yPercent: -14,
          autoAlpha: 0.7,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Bobbing scroll cue.
        gsap.to(".fella-cue-arrow", {
          y: 8,
          repeat: -1,
          yoyo: true,
          duration: 0.7,
          ease: "sine.inOut",
        });
      });
    },
    { scope: root },
  );

  // Global "press T to take the test" shortcut. The hero stays mounted for the
  // whole page, so this window listener works anywhere. It ignores modifier
  // combos and keystrokes typed into form fields, then smooth-scrolls to the
  // pricing/test section via the SAME nav-height-aware helper the "Take the
  // test" CTA uses (components/quiz/smooth-scroll.tsx), so the shortcut and the
  // click land on the exact same spot below the fixed nav — and it composes
  // cleanly with Lenis (falling back to native scroll under reduced motion).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "t") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      if (!document.getElementById("pricing")) return;
      event.preventDefault();
      scrollToQuizHash("#pricing");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section
      ref={root}
      className="fella-hero relative flex min-h-[100svh] flex-col items-center overflow-hidden border-b-[5px] border-ink bg-yellow px-4 py-8 sm:py-12 text-center selection:bg-ink selection:text-paper"
    >
      {/*
        BASE background layer — perspective "synthwave floor" grid backdrop.
        Pure CSS: a repeating grid painted on a rotateX-tilted plane (inside a
        perspective wrapper) makes the cells foreshorten into trapezoids receding
        to a horizon, and the pattern drifts slowly toward the viewer (keyframes
        in globals.css). It lives in its own layer behind everything else (z-auto
        < the shapes' z-[1] < the z-10 content), is pointer-events-none, and is
        clipped by overflow-hidden so the tilt never spills out or covers the
        CTAs. Reduced-motion pauses the drift and leaves a static tilted grid.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ perspective: "560px", perspectiveOrigin: "50% 34%" }}
      >
        <div className="absolute inset-x-[-50%] top-[34%] bottom-[-45%] overflow-hidden [transform:rotateX(70deg)] [transform-origin:50%_0%]">
          <div
            className="fella-floor absolute inset-[-120%] opacity-[0.09]"
            style={{
              backgroundImage:
                "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>
        {/* Fade the far convergence into the yellow field for a clean horizon. */}
        <div
          className="absolute inset-x-0 top-0 h-[56%]"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--color-yellow) 0%, var(--color-yellow) 24%, rgba(252,229,82,0) 100%)",
          }}
        />
      </div>

      {/*
        MID layer — decorative brutalist shapes scattered around the edges/corners
        to FRAME the title, sitting OVER the grid (z-[1]) but UNDER the z-10
        content. Each slowly rotates and gently floats (CSS keyframes in
        globals.css — compositor-only transforms, staggered so they never move in
        unison). The layer is pointer-events-none; the hero's overflow-hidden
        clips any shape that drifts past an edge, so nothing can ever cause a
        scrollbar. Solid fills + thick ink borders keep them crisp over the faint
        grid. Colors avoid yellow (the hero field) and green (the CTA).
        Reduced-motion freezes the shapes into a static, tilted arrangement.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        {/* Large blue circle — top-left, tucked just inside the corner. */}
        <FloatingShape
          style={{
            top: "2rem",
            left: "1rem",
            width: "clamp(150px, 20vw, 224px)",
            height: "clamp(150px, 20vw, 224px)",
          }}
          floatX="6px"
          floatY="-10px"
          floatDuration="10s"
          floatDelay="-1s"
          spinDuration="28s"
          spinDelay="-6s"
        >
          <div className="size-full rounded-full border-[3px] border-ink bg-blue shadow-hard" />
        </FloatingShape>

        {/* Medium coral rounded square — top-right. */}
        <FloatingShape
          style={{
            top: "5rem",
            right: "3.5rem",
            width: "clamp(92px, 12vw, 134px)",
            height: "clamp(92px, 12vw, 134px)",
          }}
          floatX="-8px"
          floatY="12px"
          floatDuration="8s"
          floatDelay="-3s"
          spinDuration="18s"
          spinReverse
          spinDelay="-5s"
          tilt="-8deg"
        >
          <div className="size-full rounded-[26%] border-[3px] border-ink bg-coral shadow-hard" />
        </FloatingShape>

        {/* Large mint blob — bottom-left, lifted fully inside the clip. */}
        <FloatingShape
          style={{
            bottom: "3.5rem",
            left: "3.5rem",
            width: "clamp(124px, 16vw, 190px)",
            height: "clamp(124px, 16vw, 190px)",
          }}
          floatX="10px"
          floatY="-10px"
          floatDuration="11s"
          floatDelay="-5s"
          spinDuration="30s"
          spinDelay="-12s"
          tilt="6deg"
        >
          <div
            className="size-full border-[3px] border-ink bg-mint shadow-hard"
            style={{ borderRadius: "62% 38% 55% 45% / 55% 52% 48% 45%" }}
          />
        </FloatingShape>

        {/* Small coral triangle — mid-left, nudged in off the edge. */}
        <FloatingShape
          style={{
            top: "44%",
            left: "2rem",
            width: "clamp(60px, 9vw, 90px)",
            height: "clamp(60px, 9vw, 90px)",
          }}
          floatX="8px"
          floatY="10px"
          floatDuration="7s"
          floatDelay="-2s"
          spinDuration="16s"
          spinReverse
          spinDelay="-3s"
        >
          <svg
            viewBox="0 0 100 100"
            className="size-full overflow-visible"
            style={{ filter: "drop-shadow(5px 5px 0 #000)" }}
          >
            <polygon
              points="50,6 94,90 6,90"
              fill="var(--color-coral)"
              stroke="#000"
              strokeWidth={8}
              strokeLinejoin="round"
            />
          </svg>
        </FloatingShape>

        {/* Medium paper pill — bottom-right, fully inside the corner. */}
        <FloatingShape
          style={{
            bottom: "5.5rem",
            right: "2rem",
            width: "clamp(104px, 13vw, 144px)",
            height: "clamp(46px, 6vw, 64px)",
          }}
          floatX="-8px"
          floatY="-10px"
          floatDuration="9s"
          floatDelay="-4s"
          spinDuration="24s"
          spinDelay="-9s"
          tilt="12deg"
        >
          <div className="size-full rounded-full border-[3px] border-ink bg-paper shadow-hard" />
        </FloatingShape>
      </div>

      <div className="fella-inner relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
        <Badge color="coral" size="md" shadow="hard" className="fella-eyebrow rotate-[-2deg]">
          {eyebrow}
        </Badge>

        <p className="fella-lead mt-[clamp(1rem,3.4vh,2.5rem)] font-display text-[clamp(1.375rem,4.2vw,2.6rem)] uppercase leading-none tracking-[-0.01em]">
          {lead}
        </p>

        <h1 className="mt-[clamp(1rem,3.4vh,2.5rem)] flex flex-col items-center gap-[clamp(0.6rem,1.9vh,1.5rem)] font-display uppercase leading-[0.85] tracking-[-0.02em] [perspective:800px]">
          <Chars
            text={smartWord}
            className="fella-smart text-[clamp(2.5rem,min(15vw,14vh),12rem)] text-blue [-webkit-text-stroke:3px_#000] [text-shadow:0.04em_0.04em_0_#000]"
          />
          <span className="fella-or inline-block rounded-full border-[2.5px] border-ink bg-paper px-5 py-1 font-display text-[clamp(1.05rem,3vw,2.15rem)] uppercase leading-none shadow-hard-sm">
            {orWord}
          </span>
          <Chars
            text={fartWord}
            className="fella-fart text-[clamp(2.5rem,min(15vw,14vh),12rem)] text-coral [-webkit-text-stroke:3px_#000] [text-shadow:0.04em_0.04em_0_#000]"
          />
        </h1>

        <p className="fella-sub mt-[clamp(1rem,3.4vh,2.5rem)] max-w-3xl text-pretty text-base font-medium leading-snug sm:text-lg">
          {subtitle}
        </p>

        <div className="fella-cta mt-[clamp(1rem,3.4vh,2.5rem)] flex flex-col items-center gap-[clamp(1.15rem,3.8vh,2.85rem)]">
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-ink/70">
            <span>Press</span>
            <kbd className="inline-flex size-7 items-center justify-center rounded-md border-2 border-ink bg-paper font-sans text-sm font-bold leading-none text-ink shadow-hard-xs">
              T
            </kbd>
            <span>anytime to take the test</span>
          </p>
          <Button href={primaryCta.href} variant="green" size="lg">
            {primaryCta.label}
          </Button>
        </div>
      </div>

      <a
        href="#how"
        aria-label="Scroll to how it works"
        className="fella-cue relative z-10 mt-[clamp(1rem,3vh,2.5rem)] shrink-0 text-xs font-bold uppercase tracking-[0.14em]"
      >
        <span className="flex flex-col items-center gap-1.5">
          Scroll
          <span className="fella-cue-arrow grid size-9 place-items-center rounded-full border-[2.5px] border-ink bg-paper shadow-hard-xs">
            <ArrowDown className="size-4" strokeWidth={2.5} aria-hidden />
          </span>
        </span>
      </a>
    </section>
  );
}
