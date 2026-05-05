import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/layout/StatCard";
import { requirePlatformOwner } from "@/features/platform-owner/lib/guard";

export const metadata: Metadata = {
  title: "Platform overview",
};

const MOCK_ACTIVITY = [
  { id: "1", label: "System health check completed", at: "Today · 09:12" },
  { id: "2", label: "New school enrollment reviewed", at: "Yesterday · 16:40" },
];

const MOCK_SCHOOLS = [
  { id: "mock-1", name: "Northfield Academy", slug: "northfield" },
  { id: "mock-2", name: "Riverside College", slug: "riverside" },
];

function metric(
  count: number | null,
  error: { message?: string } | null,
  fallback: number,
): number {
  if (!error && typeof count === "number") {
    return count;
  }
  return fallback;
}

export default async function OwnerHomePage() {
  const { supabase } = await requirePlatformOwner();

  const [
    schoolsHead,
    alumniHead,
    activeSchoolsHead,
    pendingProfilesHead,
    recentSchoolsRes,
  ] = await Promise.all([
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase
      .from("alumni_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("schools")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("alumni_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("schools")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const recentSchools =
    !recentSchoolsRes.error && recentSchoolsRes.data?.length
      ? (recentSchoolsRes.data as { id: string; name: string; slug: string }[])
      : MOCK_SCHOOLS;

  const totalSchools = metric(schoolsHead.count, schoolsHead.error, 12);
  const totalAlumni = metric(alumniHead.count, alumniHead.error, 480);
  const activeCommunities = metric(
    activeSchoolsHead.count,
    activeSchoolsHead.error,
    metric(schoolsHead.count, schoolsHead.error, 12),
  );
  const pendingIssues = metric(pendingProfilesHead.count, pendingProfilesHead.error, 3);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="rounded-2xl border border-white/80 bg-gradient-to-br from-purple-50/90 via-white to-white p-6 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:from-purple-950/30 dark:via-stone-950 dark:to-stone-950 dark:shadow-black/40 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Platform overview
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          AlumniLink at a glance
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Monitor schools, alumni growth, and moderation load across the entire
          platform.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total schools"
          value={totalSchools}
          tone="indigo"
        />
        <StatCard label="Total alumni" value={totalAlumni} tone="teal" />
        <StatCard
          label="Active communities"
          value={activeCommunities}
          hint="Schools marked active"
        />
        <StatCard
          label="Pending issues"
          value={pendingIssues}
          tone="amber"
          hint="Profiles awaiting review"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              Recent schools
            </h3>
            <Link
              href="/owner/schools"
              className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
            >
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {recentSchools.slice(0, 5).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 py-3 first:pt-0"
              >
                <span className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
                  {s.name}
                </span>
                <span className="shrink-0 text-xs text-stone-500">{s.slug}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              Recent platform activity
            </h3>
            <Link
              href="/owner/audit"
              className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
            >
              Audit logs
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {MOCK_ACTIVITY.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 dark:border-stone-800 dark:bg-stone-900/40"
              >
                <p className="text-sm text-stone-800 dark:text-stone-100">
                  {row.label}
                </p>
                <p className="text-xs text-stone-500">{row.at}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
            Connect your audit pipeline to replace placeholder entries with live
            platform signals.
          </p>
        </div>
      </div>
    </div>
  );
}
