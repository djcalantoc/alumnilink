import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type GradientVariant = "accent" | "warm" | "subtle";

const variantClass: Record<GradientVariant, string> = {
  accent: "social-gradient text-white",
  warm: "bg-gradient-to-br from-amber-200/90 via-orange-200/70 to-rose-200/80 text-stone-900 dark:from-amber-900/40 dark:via-orange-950/50 dark:to-rose-950/40 dark:text-stone-100",
  subtle:
    "bg-gradient-to-br from-[var(--accent-soft)] via-white to-stone-50/90 text-stone-900 dark:via-stone-950 dark:to-stone-900 dark:text-stone-50",
};

type GradientCardProps = {
  children: ReactNode;
  variant?: GradientVariant;
  /** Extra classes on outer card */
  className?: string;
  /** Band height for top-only gradient (optional visual header) */
  headerHeightClass?: string;
  /** Optional content only in the gradient band */
  header?: ReactNode;
  /** Main body below header (or full card if no header) */
  bodyClassName?: string;
};

/**
 * Rounded-2xl card with soft shadow + gradient band — heroes, highlights, CTAs.
 */
export function GradientCard({
  children,
  variant = "accent",
  className,
  headerHeightClass = "h-24 sm:h-28",
  header,
  bodyClassName,
}: GradientCardProps) {
  if (header != null) {
    return (
      <div
        className={cn(
          "social-card overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-950",
          className,
        )}
      >
        <div
          className={cn(variantClass[variant], headerHeightClass, "relative")}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative p-4 sm:p-5">{header}</div>
        </div>
        <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "social-card overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800",
        variantClass[variant],
        className,
      )}
    >
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
