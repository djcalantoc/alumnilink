import Link from "next/link";
import { UpcomingEventsStack } from "@/components/dashboard/UpcomingEventsStack";
import type { DashboardSchool } from "@/features/dashboard/lib/load-alumni-dashboard";
import {
  dashboardHref,
  type DashboardUpcomingEvent,
} from "@/features/dashboard/lib/load-alumni-dashboard";

type EventDetail = NonNullable<DashboardUpcomingEvent>;

type Props = {
  school: DashboardSchool | null;
  events: EventDetail[];
  errorMessage?: string | null;
  isMock?: boolean;
};

export function UpcomingEvents({
  school,
  events,
  errorMessage,
  isMock,
}: Props) {
  const eventsHref = dashboardHref("/dashboard/events", school);

  return (
    <section className="space-y-5" aria-labelledby="member-upcoming-events">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="member-upcoming-events"
          className="text-xl font-bold tracking-tight text-[#0b1c30]"
        >
          Upcoming events
        </h2>
        <Link
          href={eventsHref}
          className="shrink-0 text-sm font-bold text-indigo-600 hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="rounded-2xl border border-violet-100/90 bg-white/90 p-5 shadow-lg shadow-violet-200/30 backdrop-blur-sm sm:p-6">
        <UpcomingEventsStack
          events={events}
          eventsHref={eventsHref}
          errorMessage={errorMessage ?? null}
          isMock={isMock}
        />
      </div>
    </section>
  );
}
