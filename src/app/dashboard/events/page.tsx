import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/social/EventCard";
import { resolveAlumniEventSchoolContext } from "@/features/event-board/lib/access";
import {
  aggregateResponses,
  fetchPublishedEventsForSchool,
  fetchResponsesForEvents,
} from "@/features/event-board/lib/queries";
import type { ResponseCounts } from "@/features/event-board/lib/types";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
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

export default async function DashboardEventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return null;
  }

  const ctx = await resolveAlumniEventSchoolContext(
    "/dashboard/events",
    requested,
  );

  if (!ctx.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Events
        </h1>
        <div
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p>{ctx.error}</p>
          <p className="mt-3">
            <Link
              href="/dashboard/profile"
              className="font-medium text-amber-950 underline-offset-4 hover:underline dark:text-amber-50"
            >
              Your profile
            </Link>
            {" · "}
            <Link
              href="/dashboard"
              className="font-medium text-amber-950 underline-offset-4 hover:underline dark:text-amber-50"
            >
              Dashboard
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <SchoolPicker
          schools={ctx.schools}
          targetPath="/dashboard/events"
          title="Events"
          description="Choose a school to see reunions and gatherings for alumni."
          actionLabel="View events →"
        />
      </main>
    );
  }

  const { schoolId, schools } = ctx;
  const schoolMeta = schools.find((s) => s.id === schoolId);

  const { rows: events, error: evErr } =
    await fetchPublishedEventsForSchool(supabase, schoolId);

  const eventIds = events.map((e) => e.id);
  const { rows: responses, error: respErr } =
    await fetchResponsesForEvents(supabase, eventIds);

  const { countsByEvent, myResponseByEvent } = aggregateResponses(
    responses,
    user.id,
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {schoolMeta?.name ?? "School"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Events & reunions
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          RSVP so organizers know who is interested.
        </p>
        {schools.length > 1 ? (
          <p className="mt-2">
            <Link
              href="/dashboard/events"
              className="text-sm font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-200"
            >
              Change school
            </Link>
          </p>
        ) : null}
      </div>

      {evErr || respErr ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 dark:border-red-900/50 dark:bg-red-950/40"
          role="alert"
        >
          <p className="text-sm font-medium text-red-900 dark:text-red-200">
            Could not load events
          </p>
          <p className="mt-1 text-sm text-red-800 dark:text-red-300">
            {evErr ?? respErr}
          </p>
        </div>
      ) : events.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-14 text-center dark:border-stone-600 dark:bg-stone-900/40"
          role="status"
        >
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            No events yet.
          </p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            When your school posts a reunion or gathering, it will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard
                event={event}
                counts={countsByEvent.get(event.id) ?? emptyCounts()}
                myResponse={myResponseByEvent.get(event.id) ?? null}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-center text-sm text-stone-500 dark:text-stone-400">
        <Link
          href="/dashboard"
          className="font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-200"
        >
          Dashboard
        </Link>
      </p>
    </main>
  );
}
