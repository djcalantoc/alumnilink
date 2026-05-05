import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * Friendly empty placeholder — card-style, no raw tables or wall of text.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "social-card flex flex-col items-center rounded-2xl border border-dashed border-stone-300/90 bg-white/80 px-6 py-12 text-center dark:border-stone-600 dark:bg-stone-950/60",
        className,
      )}
      role="status"
    >
      {icon ? (
        <div className="mb-3 text-3xl leading-none text-stone-400 dark:text-stone-500" aria-hidden>
          {icon}
        </div>
      ) : (
        <div
          className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-xl"
          aria-hidden
        >
          ✨
        </div>
      )}
      <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
