import { MemoriesGridSkeleton } from "@/features/memory-wall/components/memories-grid-skeleton";

export default function SchoolMemoriesLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="h-4 max-w-md animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      </div>
      <MemoriesGridSkeleton />
    </main>
  );
}
