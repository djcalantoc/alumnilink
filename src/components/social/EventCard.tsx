import type {
  EventRow,
  EventResponseValue,
  ResponseCounts,
} from "@/features/event-board/lib/types";
import { formatEventWhen } from "@/features/event-board/lib/format";
import { EventResponseBar } from "@/features/event-board/components/event-response-bar";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_EVENT_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

type Props = {
  event: EventRow;
  counts: ResponseCounts;
  myResponse: EventResponseValue | null;
};

function dateBadge(startsAt: string): { month: string; day: string } {
  try {
    const d = new Date(startsAt);
    return {
      month: new Intl.DateTimeFormat(undefined, { month: "short" }).format(d),
      day: String(d.getDate()),
    };
  } catch {
    return { month: "—", day: "—" };
  }
}

export function EventCard({ event, counts, myResponse }: Props) {
  const { primary, secondary } = formatEventWhen(event.starts_at, event.ends_at);
  const { month, day } = dateBadge(event.starts_at);
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const showRsvp = !isCancelled && event.status === "published";

  return (
    <article
      className={cn(
        "social-card overflow-hidden rounded-2xl border bg-white dark:bg-stone-950",
        isCancelled
          ? "border-stone-300 opacity-90 dark:border-stone-700"
          : "border-stone-200/80 dark:border-stone-800",
      )}
    >
      <div className="relative h-36 bg-gradient-to-br from-[var(--accent-soft)] via-stone-100 to-stone-200 dark:from-stone-900 dark:via-stone-800 dark:to-stone-950 sm:h-40">
        <SafeImage
          src={null}
          fallback={<PhotoFallback src={DEFAULT_EVENT_IMAGE} />}
          alt=""
          className="absolute inset-0 size-full rounded-none opacity-55"
          imgClassName="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/25 to-transparent dark:from-black/40" aria-hidden />
        <div className="absolute left-4 top-4 flex flex-col overflow-hidden rounded-xl border border-white/40 bg-white/95 text-center shadow-sm backdrop-blur-sm dark:border-stone-700/60 dark:bg-stone-950/90">
          <span className="bg-[var(--accent-from)] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {month}
          </span>
          <span className="px-3 py-1 text-xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
            {day}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold leading-snug text-stone-900 dark:text-stone-50">
            {event.title}
          </h2>
          {isCancelled ? (
            <span className="shrink-0 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-800 dark:bg-stone-800 dark:text-stone-200">
              Cancelled
            </span>
          ) : null}
          {isCompleted ? (
            <span className="shrink-0 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-800 dark:bg-stone-800 dark:text-stone-200">
              Completed
            </span>
          ) : null}
        </div>

        <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
          {primary}
        </p>
        {secondary ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">{secondary}</p>
        ) : null}

        {event.location ? (
          <p className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
            <span aria-hidden className="text-[var(--accent-from)]">
              ◎
            </span>
            <span>{event.location}</span>
          </p>
        ) : null}

        {event.description ? (
          <p className="line-clamp-3 text-sm text-stone-600 dark:text-stone-400">
            {event.description}
          </p>
        ) : null}

        <p className="text-xs text-stone-500 dark:text-stone-400">
          <span className="font-medium text-stone-700 dark:text-stone-300">
            {counts.going}
          </span>{" "}
          going ·{" "}
          <span className="font-medium text-stone-700 dark:text-stone-300">
            {counts.interested}
          </span>{" "}
          interested ·{" "}
          <span className="font-medium text-stone-700 dark:text-stone-300">
            {counts.notGoing}
          </span>{" "}
          not going
        </p>

        {showRsvp ? (
          <EventResponseBar
            eventId={event.id}
            myResponse={myResponse}
            variant="social"
          />
        ) : (
          <p className="text-xs text-stone-500 dark:text-stone-500">
            {isCancelled
              ? "Responses are closed for this event."
              : "Responses are closed."}
          </p>
        )}
      </div>
    </article>
  );
}
