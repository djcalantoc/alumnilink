import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";
import { PlatformStats } from "@/features/super-admin/components/platform-stats";
import {
  fetchMonthlyRegistrations,
  fetchPlatformStats,
  fetchSchoolsByStatus,
} from "@/features/super-admin/lib/queries";

export const metadata: Metadata = { title: "Super Admin — Overview" };

export default async function AdminHomePage() {
  const { supabase } = await requireSuperAdmin();

  const [stats, schoolsByStatus, monthlyRegs] = await Promise.all([
    fetchPlatformStats(supabase),
    fetchSchoolsByStatus(supabase),
    fetchMonthlyRegistrations(supabase),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Hero */}
      <section className="rounded-2xl border border-white/80 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:from-slate-950/40 dark:via-stone-950 dark:to-stone-950 dark:shadow-black/40 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Super Admin
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Manage AlumniLink communities
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Platform-level overview — schools, users, alumni, and moderation across all communities.
        </p>
      </section>

      {/* Stats cards + charts */}
      <PlatformStats
        stats={stats}
        schoolsByStatus={schoolsByStatus}
        monthlyRegs={monthlyRegs}
      />

      {/* Quick actions */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-950">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">School directory</h3>
            <Link href="/admin/schools" className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {[
              { label: "Active Schools", value: stats.active_schools, href: "/admin/schools" },
              { label: "Total Registered Users", value: stats.total_users, href: "/admin/users" },
              { label: "Approved Alumni", value: stats.total_alumni, href: "/admin/users" },
              { label: "Pending Alumni", value: stats.pending_alumni, href: "/admin/users" },
              { label: "School Admins", value: stats.active_school_admins, href: "/admin/school-admins" },
            ].map(({ label, value, href }) => (
              <li key={label} className="flex items-center justify-between py-3 first:pt-0">
                <Link href={href} className="text-sm text-stone-700 hover:text-purple-600 dark:text-stone-300 dark:hover:text-purple-400">
                  {label}
                </Link>
                <span className="text-sm font-bold tabular-nums text-stone-900 dark:text-stone-50">
                  {value.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-950">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Quick actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            {[
              { href: "/admin/schools/new", label: "Create school" },
              { href: "/admin/school-admins", label: "Assign school admin" },
              { href: "/admin/users", label: "Manage users" },
              { href: "/admin/reports", label: "View reports" },
              { href: "/admin/settings", label: "Platform settings" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
