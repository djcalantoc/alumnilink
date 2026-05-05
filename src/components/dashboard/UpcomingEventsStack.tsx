import Link from "next/link";
import type { DashboardUpcomingEvent } from "@/features/dashboard/lib/load-alumni-dashboard";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import {
  DEFAULT_EVENT_IMAGE,
  DEFAULT_MEMORY_IMAGE,
} from "@/lib/images";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";
import { EmptyState } from "@/components/social/EmptyState";
import { cn } from "@/lib/cn";

type EventDetail = NonNullable<DashboardUpcomingEvent>;

type Props = {
  events: EventDetail[];
  eventsHref: string;
  errorMessage?: string | null;
  isMock?: boolean;
};

export function UpcomingEventsStack({
  events,
  eventsHref,
  errorMessage,
  isMock,
}: Props) {
  if (errorMessage) {
    return (
      <EmptyState
        icon="📅"
        title="Couldn’t load events"
        description={errorMessage}
        className="py-8"
        action={
          <Link
            href={eventsHref}
            className="text-sm font-semibold text-indigo-600 underline-offset-4 hover:underline"
          >
            Try events page
          </Link>
        }
      />
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No upcoming events"
        description="When your school posts a reunion, it shows up here."
        className="py-8"
        action={
          <Link
            href={eventsHref}
            className="text-sm font-semibold text-indigo-600 underline-offset-4 hover:underline"
          >
            Browse events
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {isMock ? (
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
          Preview
        </p>
      ) : null}
      {events.map((up, idx) => {
        const e = up.event;
        const isPlaceholder = e.id.startsWith("00000000-");
        const accent = idx === 1;
        const fallbackThumb =
          idx === 0 ? DEFAULT_EVENT_IMAGE : DEFAULT_MEMORY_IMAGE;
        return (
          <Link
            key={e.id}
            href={eventsHref}
            className={cn(
              "flex gap-4 rounded-xl bg-white p-4 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md",
              accent && "border-t-4 border-pink-500",
            )}
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <SafeImage
                src={null}
                fallback={<PhotoFallback src={fallbackThumb} />}
                alt=""
                className="size-full rounded-[inherit]"
                imgClassName="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold text-[#0b1c30]">
                {e.title}
              </h4>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <MaterialIcon name="calendar_today" className="text-sm" />
                <span>{up.whenPrimary}</span>
              </div>
              {e.location ? (
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <MaterialIcon name="location_on" className="text-sm" />
                  <span className="truncate">{e.location}</span>
                </div>
              ) : null}
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                  {accent ? "Register" : "RSVP"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isPlaceholder
                    ? "Sample counts"
                    : `${up.going} going · ${up.interested} interested`}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
