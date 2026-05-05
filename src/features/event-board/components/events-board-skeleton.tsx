export function EventsBoardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading events">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800"
        />
      ))}
    </div>
  );
}
