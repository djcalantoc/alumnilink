import { EventsBoardSkeleton } from "@/features/event-board/components/events-board-skeleton";

export default function DashboardEventsLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 h-20 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      <EventsBoardSkeleton />
    </main>
  );
}
