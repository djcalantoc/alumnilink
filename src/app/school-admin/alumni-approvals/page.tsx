import type { Metadata } from "next";
import { Suspense } from "react";
import { AlumniApprovalsFilters } from "@/features/alumni-approvals/components/alumni-approvals-filters";
import { AlumniApprovalsList } from "@/features/alumni-approvals/components/alumni-approvals-list";
import { fetchPendingProfilesForSchool } from "@/features/alumni-approvals/lib/queries";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";
import {
  fetchBatchesForSchool,
  fetchSectionsForSchool,
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
    profileId?: string;
  }>;
};

function ApprovalsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
      <div className="h-40 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}

export default async function AlumniApprovalsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;
  const batchId = sp.batchId?.trim() || undefined;
  const sectionId = sp.sectionId?.trim() || undefined;
  const profileId = sp.profileId?.trim() || undefined;

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
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{ctx.error}</p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin/alumni-approvals"
        title="Choose a school"
        description="Select which school’s pending alumni you want to review."
      />
    );
  }

  const { schoolId, schools } = ctx;
  const schoolName = schools.find((s) => s.id === schoolId)?.name ?? "School";

  const filterParts: string[] = [];
  if (batchId) {
    filterParts.push(`batchId=${encodeURIComponent(batchId)}`);
  }
  if (sectionId) {
    filterParts.push(`sectionId=${encodeURIComponent(sectionId)}`);
  }
  const filterSuffix = filterParts.length ? `&${filterParts.join("&")}` : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Alumni approvals
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {schoolName} — review pending profiles, then approve or reject.
        </p>
      </div>

      <Suspense fallback={<ApprovalsSkeleton />}>
        <ApprovalsContent
          schoolId={schoolId}
          batchId={batchId}
          sectionId={sectionId}
          expandedProfileId={profileId ?? null}
          filterSuffix={filterSuffix}
        />
      </Suspense>
    </div>
  );
}

async function ApprovalsContent({
  schoolId,
  batchId,
  sectionId,
  expandedProfileId,
  filterSuffix,
}: {
  schoolId: string;
  batchId: string | undefined;
  sectionId: string | undefined;
  expandedProfileId: string | null;
  filterSuffix: string;
}) {
  const supabase = await createSupabaseServerClient();

  const [batchResult, sectionResult, pendingResult] = await Promise.all([
    fetchBatchesForSchool(supabase, schoolId),
    fetchSectionsForSchool(supabase, schoolId),
    fetchPendingProfilesForSchool(supabase, schoolId, { batchId, sectionId }),
  ]);

  if (pendingResult.error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        {pendingResult.error}
      </p>
    );
  }

  const batches = batchResult.data ?? [];
  const sections = sectionResult.data ?? [];

  return (
    <div className="space-y-6">
      <AlumniApprovalsFilters
        schoolId={schoolId}
        batches={batches}
        sections={sections}
        batchId={batchId}
        sectionId={sectionId}
      />
      <AlumniApprovalsList
        schoolId={schoolId}
        profiles={pendingResult.rows}
        expandedProfileId={expandedProfileId}
        filterSuffix={filterSuffix}
      />
    </div>
  );
}
