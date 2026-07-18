import { cn } from "@/lib/utils";

type ContainerSize = "page" | "prose" | "form" | "full";

const sizeMap: Record<ContainerSize, string> = {
  page: "max-w-[75rem]",
  prose: "max-w-[44rem]",
  form: "max-w-[31rem]",
  full: "max-w-none",
};

export function Container({
  size = "page",
  className,
  children,
}: {
  size?: ContainerSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}>
      {children}
    </div>
  );
}
