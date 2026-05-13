import { SectionsTable } from "@/features/school-batch-sections/components/sections-table";
import { requireSchoolAdminAreaUser } from "@/features/school-batch-sections/lib/access";
import {
  fetchBatchesForSchool,
  fetchSectionsWithBatch,
} from "@/features/school-batch-sections/lib/queries";

type Props = {
  schoolId: string;
};

export async function SectionsPanel({ schoolId }: Props) {
  const { supabase } = await requireSchoolAdminAreaUser();

  const [batchRes, sectionRes] = await Promise.all([
    fetchBatchesForSchool(supabase, schoolId),
    fetchSectionsWithBatch(supabase, schoolId),
  ]);

  if (batchRes.error || sectionRes.error) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Could not load data
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">
          {batchRes.error ?? sectionRes.error}
        </p>
      </div>
    );
  }

  return (
    <SectionsTable
      sections={sectionRes.data ?? []}
      batches={batchRes.data ?? []}
      schoolId={schoolId}
    />
  );
}
