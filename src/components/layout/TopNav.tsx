import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TopNavProps = {
  /** Brand / logo area (left) */
  brand: ReactNode;
  /** Nav links, actions (right) */
  trailing: ReactNode;
  className?: string;
  innerClassName?: string;
};

/**
 * Sticky top bar — social-style, blurred backdrop. Pair with `content-max` / `max-w-7xl` inner.
 */
export function TopNav({
  brand,
  trailing,
  className,
  innerClassName,
}: TopNavProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-stone-200/70 bg-[var(--background)]/85 backdrop-blur-lg dark:border-stone-800/90",
        className,
      )}
    >
      <div
        className={cn(
          "content-max flex h-14 items-center justify-between gap-3 px-4 sm:px-6 md:px-8",
          innerClassName,
        )}
      >
        <div className="min-w-0 shrink-0">{brand}</div>
        <div className="flex min-w-0 items-center justify-end">{trailing}</div>
      </div>
    </header>
  );
}
