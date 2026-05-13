import { BatchesTable } from "@/features/school-batch-sections/components/batches-table";
import { requireSchoolAdminAreaUser } from "@/features/school-batch-sections/lib/access";
import {
  fetchBatchesWithCounts,
  fetchSchoolAdminStats,
} from "@/features/school-batch-sections/lib/queries";

type Props = {
  schoolId: string;
};

export async function BatchesPanel({ schoolId }: Props) {
  const { supabase } = await requireSchoolAdminAreaUser();

  const [batchRes, statsRes] = await Promise.all([
    fetchBatchesWithCounts(supabase, schoolId),
    fetchSchoolAdminStats(supabase, schoolId),
  ]);

  if (batchRes.error) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Could not load batches
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">
          {batchRes.error}
        </p>
      </div>
    );
  }

  return (
    <BatchesTable
      batches={batchRes.data ?? []}
      schoolId={schoolId}
      stats={
        statsRes.data ?? {
          total_batches: 0,
          total_sections: 0,
          total_approved_alumni: 0,
          total_pending_alumni: 0,
        }
      }
    />
  );
}
