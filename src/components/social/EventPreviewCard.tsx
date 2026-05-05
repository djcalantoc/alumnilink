import Link from "next/link";
import type { DashboardUpcomingEvent } from "@/features/dashboard/lib/load-alumni-dashboard";
import { EmptyState } from "@/components/social/EmptyState";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_EVENT_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

type EventPreviewCardProps = {
  upcoming: DashboardUpcomingEvent | null;
  eventsHref: string;
  errorMessage?: string | null;
  isMock?: boolean;
  className?: string;
};

export function EventPreviewCard({
  upcoming,
  eventsHref,
  errorMessage,
  isMock,
  className,
}: EventPreviewCardProps) {
  if (errorMessage) {
    return (
      <EmptyState
        icon="📅"
        title="Couldn’t load events"
        description={errorMessage}
        className={cn("py-8", className)}
        action={
          <Link
            href={eventsHref}
            className="text-sm font-medium text-[var(--accent-from)] underline-offset-4 hover:underline"
          >
            Try again from Events
          </Link>
        }
      />
    );
  }

  if (!upcoming) {
    return (
      <EmptyState
        icon="📅"
        title="No upcoming events"
        description="Check back when your school posts a reunion."
        className={cn("py-8", className)}
        action={
          <Link
            href={eventsHref}
            className="text-sm font-medium text-[var(--accent-from)] underline-offset-4 hover:underline"
          >
            View events
          </Link>
        }
      />
    );
  }

  const e = upcoming.event;
  const isPlaceholder = e.id.startsWith("00000000-");

  return (
    <div className={cn("relative", className)}>
      {isMock ? (
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-amber-700/90 dark:text-amber-300/90">
          Preview
        </p>
      ) : null}
      <Link
        href={eventsHref}
        className="social-card block overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-950"
      >
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-violet-500/90 via-fuchsia-500/75 to-amber-400/65 sm:h-40">
          <SafeImage
            src={null}
            fallback={<PhotoFallback src={DEFAULT_EVENT_IMAGE} />}
            alt=""
            className="absolute inset-0 size-full rounded-none opacity-40 mix-blend-overlay"
            imgClassName="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            {e.title}
          </h3>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {upcoming.whenPrimary}
          </p>
          {upcoming.whenSecondary ? (
            <p className="text-xs text-stone-500 dark:text-stone-500">
              {upcoming.whenSecondary}
            </p>
          ) : null}
          <p className="mt-3 text-xs font-medium text-[var(--accent-from)]">
            {isPlaceholder
              ? "Example RSVP counts · open Events to plan yours"
              : `${upcoming.interested} interested${
                  upcoming.going > 0 ? ` · ${upcoming.going} going` : ""
                } · details`}
          </p>
        </div>
      </Link>
    </div>
  );
}
