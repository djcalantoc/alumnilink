import { BatchCreateForm } from "@/features/school-batch-sections/components/batch-create-form";
import { BatchRowEditor } from "@/features/school-batch-sections/components/batch-row-editor";
import { requireSchoolAdminAreaUser } from "@/features/school-batch-sections/lib/access";
import { fetchBatchesForSchool } from "@/features/school-batch-sections/lib/queries";

type Props = {
  schoolId: string;
};

export async function BatchesPanel({ schoolId }: Props) {
  const { supabase } = await requireSchoolAdminAreaUser();
  const { data: batches, error } = await fetchBatchesForSchool(
    supabase,
    schoolId,
  );

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Could not load batches
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BatchCreateForm schoolId={schoolId} />

      <div className="rounded-2xl border border-stone-200 dark:border-stone-800">
        <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            Existing batches
          </h2>
        </div>
        {!batches?.length ? (
          <p className="px-4 py-10 text-center text-sm text-stone-500 dark:text-stone-500">
            No batches yet. Add one above.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {batches.map((batch) => (
              <div key={batch.id} className="px-4">
                <BatchRowEditor batch={batch} schoolId={schoolId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
