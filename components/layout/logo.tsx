import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/** Placeholder wordmark for the design clone (original mark, not 30MPC's). */
export function Logo({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      aria-label={`${site.name} home`}
      className={cn(
        "group inline-flex items-center gap-2 font-display text-2xl uppercase leading-none tracking-tight text-ink",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-md border-[2.5px] border-ink bg-coral text-paper shadow-hard-xs transition-transform group-hover:-rotate-6"
      >
        <span className="font-display text-lg leading-none">C</span>
      </span>
      <span>{site.name}</span>
    </Link>
  );
}
