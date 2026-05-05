import Link from "next/link";
import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import { PeopleYouMayKnow } from "@/features/dashboard/components/people-you-may-know";
import { EmptyState } from "@/components/social/EmptyState";
import { dashboardHref } from "@/features/dashboard/lib/load-alumni-dashboard";
import type { DashboardSchool } from "@/features/dashboard/lib/load-alumni-dashboard";
import { cn } from "@/lib/cn";

type PeopleYouMayKnowCardProps = {
  school: DashboardSchool | null;
  classmates: ClassmateRow[];
  interactionDisabled?: boolean;
  errorMessage?: string | null;
  className?: string;
};

export function PeopleYouMayKnowCard({
  school,
  classmates,
  interactionDisabled,
  errorMessage,
  className,
}: PeopleYouMayKnowCardProps) {
  if (errorMessage) {
    return (
      <section
        className={cn(
          "social-card rounded-2xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 sm:p-5",
          className,
        )}
      >
        <h2 className="mb-2 text-lg font-bold tracking-tight text-[#0b1c30] dark:text-stone-50">
          People you may know
        </h2>
        <EmptyState
          icon="👥"
          title="Directory hiccup"
          description={errorMessage}
          className="border-0 bg-transparent py-6 shadow-none"
          action={
            <Link
              href={dashboardHref("/dashboard/classmates", school)}
              className="text-sm font-medium text-[var(--accent-from)] underline-offset-4 hover:underline"
            >
              Try classmates
            </Link>
          }
        />
      </section>
    );
  }

  if (!school) {
    return (
      <section
        className={cn(
          "social-card rounded-2xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 sm:p-5",
          className,
        )}
      >
        <h2 className="mb-2 text-lg font-bold tracking-tight text-[#0b1c30] dark:text-stone-50">
          People you may know
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Approve your profile to see classmates here.
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "social-card rounded-2xl border border-stone-200/70 bg-gradient-to-b from-white to-stone-50/40 p-4 shadow-md shadow-stone-200/40 dark:border-stone-800 dark:bg-stone-950 dark:to-stone-900 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-[#0b1c30] dark:text-stone-50">
          People you may know
        </h2>
        <Link
          href={dashboardHref("/dashboard/classmates", school)}
          className="text-xs font-bold text-indigo-600 underline-offset-4 hover:underline"
        >
          See all →
        </Link>
      </div>
      {interactionDisabled ? (
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-amber-700/90 dark:text-amber-300/90">
          Preview
        </p>
      ) : null}
      <PeopleYouMayKnow
        schoolId={school.id}
        classmates={classmates}
        interactionDisabled={interactionDisabled}
      />
    </section>
  );
}
