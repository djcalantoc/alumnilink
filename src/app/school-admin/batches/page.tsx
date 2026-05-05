import type { Metadata } from "next";
import { Suspense } from "react";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { BatchesPanel } from "@/features/school-batch-sections/components/batches-panel";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";

export const metadata: Metadata = {
  title: "Batches",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string }>;
};

function BatchesSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-32 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
      <div className="h-48 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}

export default async function SchoolAdminBatchesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const ctx = await resolveSchoolManagementContext(
    "/school-admin/batches",
    requested,
  );

  if (!ctx.ok) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Cannot open batches
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{ctx.error}</p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin/batches"
        title="Choose a school"
        description="Select which school’s batches you want to manage."
      />
    );
  }

  const { schoolId, schools } = ctx;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Batches
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {schools.find((s) => s.id === schoolId)?.name ?? "School"}
        </p>
      </div>
      <Suspense fallback={<BatchesSkeleton />}>
        <BatchesPanel schoolId={schoolId} />
      </Suspense>
    </div>
  );
}
