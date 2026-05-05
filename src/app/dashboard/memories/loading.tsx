import { MemoriesGridSkeleton } from "@/features/memory-wall/components/memories-grid-skeleton";

export default function DashboardMemoriesLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
      <div className="mb-10 h-64 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      <MemoriesGridSkeleton />
    </main>
  );
}
