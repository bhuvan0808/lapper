import Link from "next/link";

import { cn } from "@/lib/utils";

/** The Lapper wordmark: a stone "L" tile + name. Links home by default. */
export function Brand({
  className,
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-base font-bold text-primary-foreground shadow-soft"
      >
        L
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Lapper
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          by BCM10 News
        </span>
      </span>
    </span>
  );

  if (href === null) return content;

  return (
    <Link
      href={href}
      className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="Lapper home"
    >
      {content}
    </Link>
  );
}
