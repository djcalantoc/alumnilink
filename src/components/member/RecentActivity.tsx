import Link from "next/link";
import type { DashboardActivityItem } from "@/features/dashboard/lib/load-alumni-dashboard";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";
import { EmptyState } from "@/components/social/EmptyState";
import { cn } from "@/lib/cn";

type Props = {
  items: DashboardActivityItem[];
  notificationsHref?: string;
  errorMessage?: string | null;
  isMock?: boolean;
  className?: string;
};

const ACCENTS = [
  {
    wrap: "bg-indigo-50 text-indigo-600",
    icon: "notifications" as const,
  },
  {
    wrap: "bg-pink-50 text-pink-600",
    icon: "favorite" as const,
  },
  {
    wrap: "bg-sky-50 text-sky-600",
    icon: "chat" as const,
  },
];

export function RecentActivity({
  items,
  notificationsHref = "/dashboard/notifications",
  errorMessage,
  isMock,
  className,
}: Props) {
  if (errorMessage) {
    return (
      <section
        className={cn(
          "rounded-2xl border border-violet-100/90 bg-white p-6 shadow-lg shadow-violet-200/40",
          className,
        )}
      >
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
          Recent activity
        </h2>
        <EmptyState
          icon="✨"
          title="Activity paused"
          description={errorMessage}
          className="mt-4 border-0 bg-transparent py-6 shadow-none"
          action={
            <Link
              href={notificationsHref}
              className="text-sm font-bold text-indigo-600 underline-offset-4 hover:underline"
            >
              Notifications
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-violet-100/90 bg-white p-6 shadow-lg shadow-violet-200/40",
        className,
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
          Recent activity
        </h2>
        <Link
          href={notificationsHref}
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          All →
        </Link>
      </div>
      {isMock ? (
        <p className="mb-4 text-[10px] font-bold uppercase tracking-wide text-amber-700">
          Preview
        </p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="All quiet for now"
          description="Say hi — your feed fills up fast."
          className="border-0 bg-violet-50/50 py-8 shadow-none"
          action={
            <Link
              href={notificationsHref}
              className="text-sm font-bold text-indigo-600 underline-offset-4 hover:underline"
            >
              Notifications
            </Link>
          }
        />
      ) : (
        <div className="relative space-y-0 pl-1">
          <div
            className="absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-violet-200 via-pink-200 to-indigo-200"
            aria-hidden
          />
          <ul className="space-y-5">
            {items.slice(0, 8).map((item, i) => {
              const a = ACCENTS[i % ACCENTS.length];
              return (
                <li key={item.id} className="relative flex gap-4">
                  <span
                    className={cn(
                      "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-2 ring-white",
                      a.wrap,
                    )}
                    aria-hidden
                  >
                    <MaterialIcon name={a.icon} className="text-xl" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm leading-snug text-slate-700">
                      {item.line}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      {item.timeLabel}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
