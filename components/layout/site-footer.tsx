import Link from "next/link";
import { navGroups, socials, site, primaryCta } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t-[2.5px] border-ink bg-ink text-paper">
      {/* CTA band */}
      <div className="border-b-[2.5px] border-paper/20">
        <Container className="flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center">
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] uppercase leading-[1.05] text-paper">
            Get one tactic,
            <br />
            twice a week.
          </h2>
          <Button href={primaryCta.href} variant="yellow" size="lg">
            {primaryCta.label}
          </Button>
        </Container>
      </div>

      {/* Link columns */}
      <Container className="grid grid-cols-2 gap-8 py-14 md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-2">
          <div className="[&_a]:text-paper [&_span]:text-paper">
            <Logo />
          </div>
          <p className="mt-4 max-w-xs text-sm text-paper/70">{site.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="press rounded-full border-[2.5px] border-paper bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper hover:bg-paper hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="eyebrow mb-3 text-paper/60">{group.label}</p>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm font-medium text-paper/85 hover:text-yellow"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      {/* Bottom bar */}
      <div className="border-t-[2.5px] border-paper/20">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-sm text-paper/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. Design-system demo, placeholder brand.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-paper">
              Privacy
            </Link>
            <Link href="/sponsors" className="hover:text-paper">
              Sponsor
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
