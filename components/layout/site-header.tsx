"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui-components/react/dialog";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNav, navGroups, primaryCta } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close the mobile menu on route change. Adjusting state during render by
  // tracking the previous pathname is React's recommended replacement for a
  // setState-in-effect (it avoids the cascading-render lint error).
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[75rem] items-center justify-between gap-4 rounded-full border-[2.5px] border-ink bg-paper py-2 pl-4 pr-2 shadow-hard-sm sm:pl-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 font-sans text-sm font-bold uppercase tracking-wide transition-colors",
                  active ? "bg-ink text-paper" : "text-ink hover:bg-gray-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button href={primaryCta.href} variant="blue" size="md" className="hidden sm:inline-flex">
            {primaryCta.label}
          </Button>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              aria-label="Open menu"
              className="press grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-ink bg-yellow text-ink shadow-hard-xs lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={2.5} />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
              <Dialog.Popup className="fixed inset-x-3 top-3 z-50 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl border-[2.5px] border-ink bg-paper p-5 shadow-hard-lg transition-all data-[ending-style]:-translate-y-2 data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-2 data-[starting-style]:opacity-0">
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <div className="flex items-center justify-between">
                  <Logo onNavigate={() => setOpen(false)} />
                  <Dialog.Close
                    aria-label="Close menu"
                    className="press grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-ink bg-paper shadow-hard-xs"
                  >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  </Dialog.Close>
                </div>

                <div className="mt-6 space-y-6">
                  {navGroups.map((group) => (
                    <div key={group.label}>
                      <p className="eyebrow mb-2 text-gray-600">{group.label}</p>
                      <ul className="space-y-1">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="flex items-center justify-between rounded-xl px-3 py-2.5 font-sans font-bold text-ink hover:bg-gray-100"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <Button
                  href={primaryCta.href}
                  variant="blue"
                  size="lg"
                  className="mt-6 w-full"
                >
                  {primaryCta.label}
                </Button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
