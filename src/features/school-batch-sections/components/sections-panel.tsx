import { SectionCreateForm } from "@/features/school-batch-sections/components/section-create-form";
import { SectionRowEditor } from "@/features/school-batch-sections/components/section-row-editor";
import { requireSchoolAdminAreaUser } from "@/features/school-batch-sections/lib/access";
import {
  fetchBatchesForSchool,
  fetchSectionsForSchool,
} from "@/features/school-batch-sections/lib/queries";

type Props = {
  schoolId: string;
};

export async function SectionsPanel({ schoolId }: Props) {
  const { supabase } = await requireSchoolAdminAreaUser();

  const [batchRes, sectionRes] = await Promise.all([
    fetchBatchesForSchool(supabase, schoolId),
    fetchSectionsForSchool(supabase, schoolId),
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

  const batches = batchRes.data ?? [];
  const sections = sectionRes.data ?? [];

  const grouped = new Map<string, typeof sections>();
  for (const s of sections) {
    const list = grouped.get(s.batch_id) ?? [];
    list.push(s);
    grouped.set(s.batch_id, list);
  }

  return (
    <div className="space-y-8">
      <SectionCreateForm schoolId={schoolId} batches={batches} />

      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
          Sections by batch
        </h2>

        {!batches.length ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-500">
            Create a batch first, then add sections.
          </p>
        ) : (
          batches.map((batch) => {
            const batchSections = grouped.get(batch.id) ?? [];
            return (
              <div
                key={batch.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-800"
              >
                <div className="border-b border-stone-200 bg-stone-50/80 px-4 py-3 dark:border-stone-800 dark:bg-stone-900/40">
                  <p className="font-medium text-stone-900 dark:text-stone-50">
                    {batch.name}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-500">
                    {batch.graduation_year != null
                      ? `Graduation year: ${batch.graduation_year}`
                      : "No graduation year set"}
                  </p>
                </div>
                {!batchSections.length ? (
                  <p className="px-4 py-6 text-sm text-stone-500 dark:text-stone-500">
                    No sections in this batch yet.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {batchSections.map((section) => (
                      <div key={section.id} className="px-4">
                        <SectionRowEditor
                          section={section}
                          schoolId={schoolId}
                          batches={batches}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
