import type { Metadata } from "next";
import { fetchMemoryTagsForMemories } from "@/features/memory-tagging/lib/queries";
import type { MemoryTagRow } from "@/features/memory-tagging/lib/types";
import { SchoolAdminMemoryList } from "@/features/memory-wall/components/school-admin-memory-list";
import { fetchPendingMemoriesForSchool } from "@/features/memory-wall/lib/queries";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Memories",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function SchoolAdminMemoriesPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const ctx = await resolveSchoolManagementContext(
    "/school-admin/memories",
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
          Cannot open memories
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{ctx.error}</p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin/memories"
        title="Memories"
        description="Choose a school to moderate submitted memory photos."
        actionLabel="Moderate memories →"
      />
    );
  }

  const { schoolId, schools } = ctx;
  const schoolName = schools.find((s) => s.id === schoolId)?.name ?? "School";

  const supabase = await createSupabaseServerClient();
  const { rows, error } = await fetchPendingMemoriesForSchool(supabase, schoolId, {});

  let tagsByMemoryId: Record<string, MemoryTagRow[]> = {};
  let tagErr: string | null = null;
  if (!error) {
    const memoryIds = rows.map((m) => m.id);
    const tagRes = await fetchMemoryTagsForMemories(supabase, memoryIds);
    tagsByMemoryId = tagRes.byMemory;
    tagErr = tagRes.error;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Memory moderation
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {schoolName} — approve or reject pending alumni photos.
        </p>
      </div>

      {error || tagErr ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 dark:border-red-900/50 dark:bg-red-950/40"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-300">
            {error ?? tagErr}
          </p>
        </div>
      ) : (
        <SchoolAdminMemoryList
          schoolId={schoolId}
          memories={rows}
          tagsByMemoryId={tagsByMemoryId}
        />
      )}
    </div>
  );
}
