export default function DashboardPollsLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="mt-8 h-10 w-full max-w-xs animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
      <div className="mt-6 space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      </div>
    </main>
  );
}
