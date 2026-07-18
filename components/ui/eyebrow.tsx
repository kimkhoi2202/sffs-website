import { cn } from "@/lib/utils";

/** Small uppercase tracked label used above headings. */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn("eyebrow inline-block", className)}>{children}</span>;
}
