import Link from "next/link";
import type { DashboardActivityItem } from "@/features/dashboard/lib/load-alumni-dashboard";
import { EmptyState } from "@/components/social/EmptyState";
import { cn } from "@/lib/cn";

type RecentActivityCardProps = {
  items: DashboardActivityItem[];
  notificationsHref?: string;
  errorMessage?: string | null;
  isMock?: boolean;
  className?: string;
};

export function RecentActivityCard({
  items,
  notificationsHref = "/dashboard/notifications",
  errorMessage,
  isMock,
  className,
}: RecentActivityCardProps) {
  if (errorMessage) {
    return (
      <div className={cn("social-card rounded-2xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 sm:p-5", className)}>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--accent-from)]">
          Recent activity
        </h2>
        <EmptyState
          icon="✦"
          title="Activity unavailable"
          description={errorMessage}
          className="border-0 bg-transparent py-6 shadow-none"
          action={
            <Link
              href={notificationsHref}
              className="text-sm font-medium text-[var(--accent-from)] underline-offset-4 hover:underline"
            >
              Open notifications
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <section
      className={cn(
        "social-card rounded-2xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 sm:p-5",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-from)]">
          Recent activity
        </h2>
        <Link
          href={notificationsHref}
          className="text-xs font-medium text-stone-600 underline-offset-4 hover:underline dark:text-stone-400"
        >
          All →
        </Link>
      </div>
      {isMock ? (
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-amber-700/90 dark:text-amber-300/90">
          Preview
        </p>
      ) : null}
      {items.length === 0 ? (
        <EmptyState
          title="All quiet"
          description="Say hi — your feed fills up fast."
          className="border-0 bg-stone-50/50 py-8 shadow-none dark:bg-stone-900/30"
          action={
            <Link
              href={notificationsHref}
              className="text-sm font-medium text-[var(--accent-from)] underline-offset-4 hover:underline"
            >
              Notifications
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.slice(0, 8).map((item) => (
            <li
              key={item.id}
              className="flex gap-3 border-b border-stone-100 pb-3 last:border-0 last:pb-0 dark:border-stone-800"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm"
                aria-hidden
              >
                ✦
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-800 dark:text-stone-200">
                  {item.line}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-500">
                  {item.timeLabel}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
