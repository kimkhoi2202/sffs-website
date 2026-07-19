import { Container } from "@/components/ui/container";
import { SocialButton } from "@/components/social/social-button";
import { SOCIALS } from "@/lib/socials";

/**
 * Slim, on-brand footer that grounds the bottom of the page: the brain mark
 * (a #top home link), the social icon buttons, and a copyright line, on a bold
 * brand-BLUE block — never black (honoring the "no black-filled surfaces" rule)
 * and set off from the yellow "Follow us" section directly above by a 2.5px ink
 * rule. Blue reads the multicolor brain logo, the white social chips, and the
 * ink copyright clearly, and it's bright enough that the chips keep the default
 * black hard shadow (surface="light").
 */
export function SiteFooter() {
  return (
    <footer className="border-t-[2.5px] border-ink bg-blue text-ink">
      {/* Balanced (equal) top/bottom padding, kept tall enough that the copyright
          clears the fixed music toggle (bottom-right puck) at every breakpoint. */}
      <Container className="flex flex-col items-center gap-6 py-24 text-center sm:flex-row sm:justify-between sm:text-left">
        <a
          href="#top"
          aria-label="Smart Fella or Fart Smella — home"
          className="inline-flex shrink-0 items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static /public asset */}
          <img
            src="/logo.png"
            alt=""
            draggable={false}
            className="h-10 w-auto select-none md:h-12"
          />
        </a>

        <ul className="flex list-none items-center gap-4">
          {SOCIALS.map((social) => (
            <li key={social.label}>
              <SocialButton social={social} size="md" surface="light" />
            </li>
          ))}
        </ul>

        <p className="text-sm font-medium text-ink/70">
          © 2026 Smart Fella or Fart Smella
        </p>
      </Container>
    </footer>
  );
}
