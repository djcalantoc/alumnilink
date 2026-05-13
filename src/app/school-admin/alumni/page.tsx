import type { Metadata } from "next";
import { Suspense } from "react";
import { AlumniStatsCards } from "@/features/alumni-management/components/alumni-stats-cards";
import { AlumniTable } from "@/features/alumni-management/components/alumni-table";
import {
  fetchAlumniManagementStats,
  fetchAlumniPerYear,
  fetchPaginatedAlumni,
} from "@/features/alumni-management/lib/queries";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";
import {
  fetchBatchesForSchool,
  fetchSectionsForSchool,
} from "@/features/school-batch-sections/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Alumni Management" };

type PageProps = {
  searchParams: Promise<{
    schoolId?: string;
    search?: string;
    batchId?: string;
    sectionId?: string;
    status?: string;
    sortBy?: string;
    sortDir?: string;
    page?: string;
  }>;
};

function TableSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
      <div className="h-96 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}

export default async function AlumniManagementPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const ctx = await resolveSchoolManagementContext(
    "/school-admin/alumni",
    requested,
    { adminRoles: ["owner", "admin", "moderator"] },
  );

  if (!ctx.ok) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40" role="alert">
        <p className="font-medium text-red-900 dark:text-red-200">Cannot open Alumni Management</p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{ctx.error}</p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin/alumni"
        title="Choose a school"
        description="Select which school's alumni you want to manage."
      />
    );
  }

  const { schoolId, schools } = ctx;
  const schoolName = schools.find((s) => s.id === schoolId)?.name ?? "School";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Alumni Management
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {schoolName} — view, search, filter and manage all alumni records.
        </p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <AlumniContent schoolId={schoolId} sp={sp} />
      </Suspense>
    </div>
  );
}

async function AlumniContent({
  schoolId,
  sp,
}: {
  schoolId: string;
  sp: Awaited<PageProps["searchParams"]>;
}) {
  const supabase = await createSupabaseServerClient();

  const filters = {
    search: sp.search?.trim() || undefined,
    batchId: sp.batchId?.trim() || undefined,
    sectionId: sp.sectionId?.trim() || undefined,
    status: sp.status?.trim() || undefined,
    sortBy: (sp.sortBy as "name" | "date" | "batch" | undefined) || undefined,
    sortDir: (sp.sortDir as "asc" | "desc" | undefined) || undefined,
    page: sp.page ? parseInt(sp.page, 10) : 1,
  };

  const [stats, yearStats, data, batchesResult, sectionsResult] =
    await Promise.all([
      fetchAlumniManagementStats(supabase, schoolId),
      fetchAlumniPerYear(supabase, schoolId),
      fetchPaginatedAlumni(supabase, schoolId, filters),
      fetchBatchesForSchool(supabase, schoolId),
      fetchSectionsForSchool(supabase, schoolId),
    ]);

  return (
    <div className="space-y-6">
      <AlumniStatsCards stats={stats} yearStats={yearStats} />
      <AlumniTable
        schoolId={schoolId}
        data={data}
        batches={batchesResult.data ?? []}
        sections={sectionsResult.data ?? []}
      />
    </div>
  );
}
