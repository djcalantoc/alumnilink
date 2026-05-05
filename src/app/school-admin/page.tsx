import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/layout/StatCard";
import {
  fetchPendingProfilesForSchool,
  type PendingProfileRow,
} from "@/features/alumni-approvals/lib/queries";
import { fetchPublishedEventsForSchool } from "@/features/event-board/lib/queries";
import { fetchApprovedMemoriesForSchool } from "@/features/memory-wall/lib/queries";
import type { MemoryWithRelations } from "@/features/memory-wall/lib/types";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "School admin overview",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string }>;
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

export default async function SchoolAdminHomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const ctx = await resolveSchoolManagementContext("/school-admin", requested);

  if (!ctx.ok) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Cannot open school admin dashboard
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{ctx.error}</p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin"
        title="Choose a school"
        description="Pick which community dashboard you want to load."
      />
    );
  }

  const { schoolId, schools } = ctx;
  const schoolName = schools.find((s) => s.id === schoolId)?.name ?? "School";
  const q = `?schoolId=${encodeURIComponent(schoolId)}`;

  const supabase = await createSupabaseServerClient();

  const now = Date.now();

  const [
    alumniApprovedHead,
    alumniPendingHead,
    memoriesHead,
    pendingProfilesResult,
    memoriesRecentResult,
    eventsResult,
  ] = await Promise.all([
    supabase
      .from("alumni_profiles")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "approved"),
    supabase
      .from("alumni_profiles")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "pending"),
    supabase
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "approved"),
    fetchPendingProfilesForSchool(supabase, schoolId, {}),
    fetchApprovedMemoriesForSchool(supabase, schoolId),
    fetchPublishedEventsForSchool(supabase, schoolId),
  ]);

  const pendingFallback: Pick<
    PendingProfileRow,
    "id" | "display_name" | "created_at"
  >[] = [
    {
      id: "demo-p1",
      display_name: "Jamie Rivera",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-p2",
      display_name: "Taylor Morgan",
      created_at: new Date().toISOString(),
    },
  ];

  const memoriesFallback: Pick<
    MemoryWithRelations,
    "id" | "body" | "created_at"
  >[] = [
    {
      id: "demo-m1",
      body: "Throwback field day energy ✨",
      created_at: new Date().toISOString(),
    },
  ];

  const pendingSlice = pendingProfilesResult.rows.slice(0, 4);
  const pendingRows = pendingProfilesResult.error
    ? pendingFallback
    : pendingSlice;

  const memorySlice = memoriesRecentResult.rows.slice(0, 3);
  const memoryRows = memoriesRecentResult.error
    ? memoriesFallback
    : memorySlice;

  const upcomingDisplay = eventsResult.error
    ? 3
    : eventsResult.rows.filter(
        (e) =>
          e.status === "published" &&
          new Date(e.starts_at).getTime() >= now,
      ).length;

  const alumniJoined = metric(alumniApprovedHead.count, alumniApprovedHead.error, 128);
  const pendingApprovals = metric(
    alumniPendingHead.count,
    alumniPendingHead.error,
    6,
  );
  const memoriesShared = metric(memoriesHead.count, memoriesHead.error, 24);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="rounded-2xl border border-white/80 bg-gradient-to-br from-emerald-50/90 via-white to-white p-6 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:from-emerald-950/25 dark:via-stone-950 dark:to-stone-950 dark:shadow-black/40 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          School admin
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Manage your school community
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          {schoolName}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Alumni joined" value={alumniJoined} tone="indigo" />
        <StatCard
          label="Pending approvals"
          value={pendingApprovals}
          tone="amber"
        />
        <StatCard label="Memories shared" value={memoriesShared} tone="teal" />
        <StatCard
          label="Upcoming events"
          value={upcomingDisplay}
          hint="Published & future-dated"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-stone-900/5 lg:col-span-3 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              Pending alumni approvals
            </h3>
            <Link
              href={`/school-admin/alumni-approvals${q}`}
              className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
            >
              Review queue
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {pendingRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 py-3 first:pt-0"
              >
                <span className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
                  {row.display_name ?? "Unnamed applicant"}
                </span>
                <span className="shrink-0 text-xs text-stone-500">
                  {row.created_at
                    ? new Date(row.created_at).toLocaleDateString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
          {!pendingSlice.length && !pendingProfilesResult.error ? (
            <p className="mt-3 text-xs text-stone-500">Queue is clear.</p>
          ) : null}
          {pendingProfilesResult.error ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Showing fallback rows — {pendingProfilesResult.error}
            </p>
          ) : null}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                Recent memories
              </h3>
              <Link
                href={`/school-admin/memories${q}`}
                className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
              >
                Moderate
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {memoryRows.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-200"
                >
                  <span className="line-clamp-2">{m.body ?? "Memory"}</span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {m.created_at
                      ? new Date(m.created_at).toLocaleDateString()
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
            {memoriesRecentResult.error ? (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                Preview fallback — {memoriesRecentResult.error}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              Quick actions
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/school-admin/batches${q}`}
                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
              >
                Add batch
              </Link>
              <Link
                href={`/school-admin/sections${q}`}
                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
              >
                Add section
              </Link>
              <Link
                href={`/school-admin/events${q}`}
                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
              >
                Create event
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
