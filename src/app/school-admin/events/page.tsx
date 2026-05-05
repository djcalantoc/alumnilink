import type { Metadata } from "next";
import { AdminEventRow } from "@/features/event-board/components/admin-event-row";
import { EventCreateForm } from "@/features/event-board/components/event-create-form";
import {
  aggregateResponses,
  fetchAllEventsForSchoolAdmin,
  fetchResponsesForEvents,
} from "@/features/event-board/lib/queries";
import type { ResponseCounts } from "@/features/event-board/lib/types";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Events",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string }>;
};

const emptyCounts = (): ResponseCounts => ({
  going: 0,
  interested: 0,
  notGoing: 0,
});

export default async function SchoolAdminEventsPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const ctx = await resolveSchoolManagementContext(
    "/school-admin/events",
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
          Cannot open events
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{ctx.error}</p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin/events"
        title="Events"
        description="Choose a school to create events and see RSVPs."
        actionLabel="Manage events →"
      />
    );
  }

  const { schoolId, schools } = ctx;
  const schoolName = schools.find((s) => s.id === schoolId)?.name ?? "School";

  const supabase = await createSupabaseServerClient();

  const { rows: events, error: evErr } =
    await fetchAllEventsForSchoolAdmin(supabase, schoolId);

  const eventIds = events.map((e) => e.id);
  const { rows: responses, error: respErr } =
    await fetchResponsesForEvents(supabase, eventIds);

  const { countsByEvent } = aggregateResponses(responses, "");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Event board
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {schoolName} — post reunions and gatherings for approved alumni.
        </p>
      </div>

      <EventCreateForm schools={schools} defaultSchoolId={schoolId} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
          All events
        </h2>
        {evErr || respErr ? (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 dark:border-red-900/50 dark:bg-red-950/40"
            role="alert"
          >
            <p className="text-sm text-red-800 dark:text-red-300">
              {evErr ?? respErr}
            </p>
          </div>
        ) : events.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-10 text-center text-sm text-stone-600 dark:border-stone-600 dark:bg-stone-900/40 dark:text-stone-400"
            role="status"
          >
            No events yet. Create one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <AdminEventRow
                key={event.id}
                event={event}
                schoolId={schoolId}
                counts={countsByEvent.get(event.id) ?? emptyCounts()}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
