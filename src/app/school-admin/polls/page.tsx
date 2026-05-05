import type { Metadata } from "next";
import { AdminPollList } from "@/features/polls/components/admin-poll-list";
import { PollCreateForm } from "@/features/polls/components/poll-create-form";
import { fetchPollsForSchool } from "@/features/polls/lib/queries";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";
import {
  fetchBatchesForSchool,
  fetchSectionsForSchool,
} from "@/features/school-batch-sections/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Polls",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function SchoolAdminPollsPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const ctx = await resolveSchoolManagementContext(
    "/school-admin/polls",
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
          Cannot open polls
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{ctx.error}</p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin/polls"
        title="Polls"
        description="Choose a school to create quick polls for approved alumni."
        actionLabel="Manage polls →"
      />
    );
  }

  const { schoolId, schools } = ctx;
  const schoolName = schools.find((s) => s.id === schoolId)?.name ?? "School";

  const supabase = await createSupabaseServerClient();

  const [
    { rows: polls, error: pollsErr },
    { data: batches, error: bErr },
    { data: sections, error: sErr },
  ] = await Promise.all([
    fetchPollsForSchool(supabase, schoolId),
    fetchBatchesForSchool(supabase, schoolId),
    fetchSectionsForSchool(supabase, schoolId),
  ]);

  const err = pollsErr ?? bErr ?? sErr;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Polls
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {schoolName} — lightweight polls (nostalgic, event, or batch). Alumni
          vote once; results stay private until they vote.
        </p>
      </div>

      {err ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 dark:border-red-900/50 dark:bg-red-950/40"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-300">{err}</p>
        </div>
      ) : (
        <>
          <PollCreateForm
            schools={schools}
            defaultSchoolId={schoolId}
            batches={batches ?? []}
            sections={sections ?? []}
          />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Your polls
            </h2>
            <AdminPollList schoolId={schoolId} polls={polls} />
          </section>
        </>
      )}
    </div>
  );
}
