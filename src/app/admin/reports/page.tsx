import type { Metadata } from "next";
import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";
import { PlatformReports } from "@/features/super-admin/components/platform-reports";
import {
  fetchAlumniPerSchool,
  fetchMonthlyRegistrations,
  fetchPlatformStats,
} from "@/features/super-admin/lib/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  CheckCircle2,
  Clock,
  School,
  Users,
} from "lucide-react";

export const metadata: Metadata = { title: "Reports — Super Admin" };

export default async function AdminReportsPage() {
  const { supabase } = await requireSuperAdmin();

  const [stats, monthlyRegs, alumniPerSchool] = await Promise.all([
    fetchPlatformStats(supabase),
    fetchMonthlyRegistrations(supabase),
    fetchAlumniPerSchool(supabase),
  ]);

  const summaryCards = [
    {
      label: "Total Schools",
      value: stats.total_schools,
      Icon: School,
      cls: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    },
    {
      label: "Total Users",
      value: stats.total_users,
      Icon: Users,
      cls: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    },
    {
      label: "Approved Alumni",
      value: stats.total_alumni,
      Icon: CheckCircle2,
      cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      label: "Pending Approvals",
      value: stats.pending_alumni,
      Icon: Clock,
      cls: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Reports"
        description="Platform KPIs, registration trends, and alumni growth by school."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map(({ label, value, Icon, cls }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-4 dark:border-stone-800 dark:bg-stone-950"
          >
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${cls}`}>
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <PlatformReports monthlyRegs={monthlyRegs} alumniPerSchool={alumniPerSchool} />
    </div>
  );
}
