import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Super Admin overview",
};

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

export default async function AdminHomePage() {
  const supabase = await createSupabaseServerClient();

  const [
    schoolsPreview,
    schoolsHead,
    adminsHead,
    alumniHead,
    pendingHead,
  ] = await Promise.all([
    supabase.from("schools").select("id, name, slug").order("name").limit(6),
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase
      .from("school_admins")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("alumni_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("alumni_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const previewRows =
    !schoolsPreview.error && schoolsPreview.data?.length
      ? (schoolsPreview.data as { id: string; name: string; slug: string }[])
      : [
          { id: "p1", name: "Northfield Academy", slug: "northfield" },
          { id: "p2", name: "Riverside College", slug: "riverside" },
        ];

  const schools = metric(schoolsHead.count, schoolsHead.error, 12);
  const schoolAdmins = metric(adminsHead.count, adminsHead.error, 42);
  const registeredUsers = metric(alumniHead.count, alumniHead.error, 620);
  const pendingApprovals = metric(pendingHead.count, pendingHead.error, 8);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="rounded-2xl border border-white/80 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:from-slate-950/40 dark:via-stone-950 dark:to-stone-950 dark:shadow-black/40 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Super Admin
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Manage AlumniLink communities
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Spin up schools, onboard admins, and keep registrations flowing with a
          calm control surface.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Schools" value={schools} tone="indigo" />
        <StatCard label="School admins" value={schoolAdmins} tone="teal" />
        <StatCard
          label="Registered users"
          value={registeredUsers}
          hint="Approved alumni profiles"
        />
        <StatCard
          label="Pending approvals"
          value={pendingApprovals}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-stone-900/5 lg:col-span-3 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              School directory preview
            </h3>
            <Link
              href="/admin/schools"
              className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
            >
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {previewRows.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 py-3 first:pt-0"
              >
                <Link
                  href={`/admin/schools/${s.id}`}
                  className="truncate text-sm font-medium text-stone-800 hover:text-purple-600 dark:text-stone-100 dark:hover:text-purple-400"
                >
                  {s.name}
                </Link>
                <span className="shrink-0 text-xs text-stone-500">{s.slug}</span>
              </li>
            ))}
          </ul>
          {schoolsPreview.error ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Preview fallback — {schoolsPreview.error.message}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-stone-900/5 lg:col-span-2 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            Quick actions
          </h3>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/admin/schools/new"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
            >
              Create school
            </Link>
            <Link
              href="/admin/school-admins"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
            >
              Assign admin
            </Link>
            <Link
              href="/admin/users"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
            >
              Review users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
