import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  School,
  Shield,
  Users,
} from "lucide-react";
import type {
  MonthStat,
  PlatformStats,
  SchoolStatusStat,
} from "@/features/super-admin/lib/types";

const STAT_CARDS = [
  {
    key: "total_schools" as const,
    label: "Total Schools",
    Icon: School,
    href: "/admin/schools",
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    border: "border-indigo-100 dark:border-indigo-900/40",
  },
  {
    key: "total_users" as const,
    label: "Registered Users",
    Icon: Users,
    href: "/admin/users",
    color: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    border: "border-violet-100 dark:border-violet-900/40",
  },
  {
    key: "total_alumni" as const,
    label: "Approved Alumni",
    Icon: CheckCircle2,
    href: "/admin/users",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/40",
  },
  {
    key: "pending_alumni" as const,
    label: "Pending Approvals",
    Icon: Clock,
    href: "/admin/users",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/40",
  },
  {
    key: "active_school_admins" as const,
    label: "School Admins",
    Icon: Shield,
    href: "/admin/school-admins",
    color: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
    border: "border-teal-100 dark:border-teal-900/40",
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-stone-400",
  pending: "bg-amber-500",
  archived: "bg-slate-400",
};

type Props = {
  stats: PlatformStats;
  schoolsByStatus: SchoolStatusStat[];
  monthlyRegs: MonthStat[];
};

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, {
    month: "short",
  });
}

export function PlatformStats({ stats, schoolsByStatus, monthlyRegs }: Props) {
  const maxReg = Math.max(...monthlyRegs.map((m) => m.count), 1);
  const totalStatusCount = schoolsByStatus.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map(({ key, label, Icon, href, color, border }) => (
          <Link
            key={key}
            href={href}
            className={`group flex flex-col gap-2 rounded-2xl border bg-white px-4 py-4 transition hover:shadow-md dark:bg-stone-950 ${border}`}
          >
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {stats[key].toLocaleString()}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly registrations */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-950">
          <p className="mb-4 text-sm font-semibold text-stone-700 dark:text-stone-300">
            User registrations — last 12 months
          </p>
          <div className="flex items-end gap-1 pb-2">
            {monthlyRegs.map((m) => {
              const pct = Math.round((m.count / maxReg) * 100);
              return (
                <div
                  key={m.month}
                  className="group flex flex-1 flex-col items-center gap-1"
                  title={`${monthLabel(m.month)}: ${m.count}`}
                >
                  <span className="hidden text-[10px] tabular-nums text-stone-500 group-hover:block">
                    {m.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-violet-500/80 transition-all group-hover:bg-violet-600 dark:bg-violet-600/70"
                    style={{
                      height: `${Math.max(4, (pct / 100) * 80)}px`,
                    }}
                    aria-label={`${m.month}: ${m.count}`}
                  />
                  <span className="text-[9px] tabular-nums text-stone-400">
                    {monthLabel(m.month)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schools by status */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-950">
          <p className="mb-4 text-sm font-semibold text-stone-700 dark:text-stone-300">
            Schools by status
          </p>
          <div className="space-y-3">
            {schoolsByStatus.length === 0 ? (
              <p className="text-xs text-stone-400">No schools yet.</p>
            ) : (
              schoolsByStatus.map(({ status, count }) => {
                const pct = Math.round((count / totalStatusCount) * 100);
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize font-medium text-stone-700 dark:text-stone-300">
                        {status}
                      </span>
                      <span className="tabular-nums text-stone-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div
                        className={`h-full rounded-full ${STATUS_COLORS[status] ?? "bg-stone-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
