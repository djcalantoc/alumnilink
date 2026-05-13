import {
  CheckCircle2,
  Clock,
  GitBranch,
  Users,
  XCircle,
} from "lucide-react";
import type { AlumniManagementStats, YearStat } from "@/features/alumni-management/lib/types";

type Props = {
  stats: AlumniManagementStats;
  yearStats: YearStat[];
};

const CARDS = [
  {
    key: "total" as const,
    label: "Total Alumni",
    Icon: Users,
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400",
    border: "border-violet-100 dark:border-violet-900/40",
  },
  {
    key: "pending" as const,
    label: "Pending",
    Icon: Clock,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/40",
  },
  {
    key: "approved" as const,
    label: "Approved",
    Icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/40",
  },
  {
    key: "rejected" as const,
    label: "Rejected",
    Icon: XCircle,
    color: "text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400",
    border: "border-red-100 dark:border-red-900/40",
  },
  {
    key: "needs_routing" as const,
    label: "Needs Routing",
    Icon: GitBranch,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-900/40",
  },
];

export function AlumniStatsCards({ stats, yearStats }: Props) {
  const maxCount = Math.max(...yearStats.map((y) => y.count), 1);
  const chartRows = yearStats.slice(-20); // last 20 years

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map(({ key, label, Icon, color, border }) => (
          <div
            key={key}
            className={`flex flex-col gap-2 rounded-2xl border bg-white px-4 py-4 dark:bg-stone-950 ${border}`}
          >
            <div
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {stats[key].toLocaleString()}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Alumni per graduation year chart */}
      {chartRows.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-950">
          <p className="mb-4 text-sm font-semibold text-stone-700 dark:text-stone-300">
            Approved alumni per graduation year
          </p>
          <div className="flex items-end gap-1 overflow-x-auto pb-2">
            {chartRows.map((y) => {
              const pct = Math.round((y.count / maxCount) * 100);
              return (
                <div
                  key={y.label}
                  className="group flex min-w-[28px] flex-1 flex-col items-center gap-1"
                  title={`${y.label}: ${y.count} alumni`}
                >
                  <span className="mb-1 hidden text-[10px] tabular-nums text-stone-500 group-hover:block dark:text-stone-400">
                    {y.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-violet-500/80 transition-all group-hover:bg-violet-600 dark:bg-violet-600/70 dark:group-hover:bg-violet-500"
                    style={{ height: `${Math.max(4, pct)}px`, minHeight: "4px", maxHeight: "80px" }}
                    role="img"
                    aria-label={`${y.label}: ${y.count}`}
                  />
                  <span className="text-[9px] tabular-nums text-stone-400 dark:text-stone-500">
                    {y.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
