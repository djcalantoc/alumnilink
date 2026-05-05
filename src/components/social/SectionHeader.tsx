import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * Consistent section title row — accent eyebrow, optional trailing action.
 */
export function SectionHeader({
  title,
  eyebrow,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-from)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0 self-start sm:mt-0 sm:self-center">{action}</div>
      ) : null}
    </div>
  );
}
