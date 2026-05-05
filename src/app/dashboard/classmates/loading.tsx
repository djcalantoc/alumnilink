export default function DashboardClassmatesLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div
        className="mb-6 space-y-3 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-900/40"
        aria-busy="true"
        aria-label="Loading classmates"
      >
        <div className="h-4 w-32 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />
        <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="h-11 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />
          <div className="h-11 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />
          <div className="h-11 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800"
          />
        ))}
      </div>
    </main>
  );
}
