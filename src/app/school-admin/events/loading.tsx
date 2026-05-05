import { EventsBoardSkeleton } from "@/features/event-board/components/events-board-skeleton";

export default function SchoolAdminEventsLoading() {
  return (
    <div className="space-y-10" aria-busy="true">
      <div className="h-24 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      <EventsBoardSkeleton />
    </div>
  );
}
