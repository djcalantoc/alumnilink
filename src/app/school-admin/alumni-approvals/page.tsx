import type { Metadata } from "next";
import { Suspense } from "react";
import { AlumniApprovalsList } from "@/features/alumni-approvals/components/alumni-approvals-list";
import {
  fetchAllProfilesForSchool,
  fetchApprovalsStats,
} from "@/features/alumni-approvals/lib/queries";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";
import {
  fetchBatchesForSchool,
} from "@/features/school-batch-sections/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Alumni approvals",
};

type PageProps = {
  searchParams: Promise<{
    schoolId?: string;
    batchId?: string;
    sectionId?: string;
  }>;
};

function ApprovalsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-900"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}

export default async function AlumniApprovalsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;
  const batchId = sp.batchId?.trim() || undefined;
  const sectionId = sp.sectionId?.trim() || undefined;

  const ctx = await resolveSchoolManagementContext(
    "/school-admin/alumni-approvals",
    requested,
    { adminRoles: ["owner", "admin", "moderator"] },
  );

  if (!ctx.ok) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Cannot open alumni approvals
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">
          {ctx.error}
        </p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin/alumni-approvals"
        title="Choose a school"
        description="Select which school's pending alumni you want to review."
      />
    );
  }

  const { schoolId, schools } = ctx;
  const schoolName =
    schools.find((s) => s.id === schoolId)?.name ?? "School";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Alumni approvals
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {schoolName} — review, route, and approve incoming alumni profiles.
        </p>
      </div>

      <Suspense fallback={<ApprovalsSkeleton />}>
        <ApprovalsContent
          schoolId={schoolId}
          batchId={batchId}
          sectionId={sectionId}
        />
      </Suspense>
    </div>
  );
}

async function ApprovalsContent({
  schoolId,
  batchId,
  sectionId,
}: {
  schoolId: string;
  batchId: string | undefined;
  sectionId: string | undefined;
}) {
  const supabase = await createSupabaseServerClient();

  const [profilesResult, statsResult, batchesResult] = await Promise.all([
    fetchAllProfilesForSchool(supabase, schoolId, {
      batchId,
      sectionId,
      statuses: ["pending", "approved", "rejected"],
    }),
    fetchApprovalsStats(supabase, schoolId),
    fetchBatchesForSchool(supabase, schoolId),
  ]);

  if (profilesResult.error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        {profilesResult.error}
      </p>
    );
  }

  return (
    <AlumniApprovalsList
      schoolId={schoolId}
      profiles={profilesResult.rows}
      batches={batchesResult.data ?? []}
      stats={
        statsResult.data ?? {
          total_pending: 0,
          needs_routing: 0,
          ready_for_approval: 0,
          total_approved: 0,
        }
      }
    />
  );
}
