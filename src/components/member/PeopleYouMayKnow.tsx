import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import { PeopleYouMayKnowCard } from "@/components/social/PeopleYouMayKnowCard";
import type { DashboardSchool } from "@/features/dashboard/lib/load-alumni-dashboard";

type Props = {
  school: DashboardSchool | null;
  classmates: ClassmateRow[];
  interactionDisabled?: boolean;
  errorMessage?: string | null;
  className?: string;
};

/** Right-rail suggestions card — social framing, not a directory table. */
export function PeopleYouMayKnow({
  school,
  classmates,
  interactionDisabled,
  errorMessage,
  className,
}: Props) {
  return (
    <PeopleYouMayKnowCard
      school={school}
      classmates={classmates}
      interactionDisabled={interactionDisabled}
      errorMessage={errorMessage ?? null}
      className={
        className ??
        "rounded-2xl border border-violet-100/80 bg-gradient-to-b from-white via-violet-50/30 to-fuchsia-50/25 p-5 shadow-lg shadow-violet-200/35 ring-1 ring-violet-100/40 backdrop-blur-[2px] sm:p-6"
      }
    />
  );
}
