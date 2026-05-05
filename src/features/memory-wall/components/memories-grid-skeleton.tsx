export function MemoriesGridSkeleton() {
  return (
    <div
      className="columns-1 gap-4 sm:columns-2 lg:columns-3"
      aria-busy="true"
      aria-label="Loading memories"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="mb-4 h-80 break-inside-avoid animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800"
        />
      ))}
    </div>
  );
}
