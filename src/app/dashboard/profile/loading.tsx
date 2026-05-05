export default function DashboardProfileLoading() {
  return (
    <main className="w-full flex-1" aria-busy="true" aria-label="Loading profile">
      <div className="h-8 w-44 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      <div className="mt-8 h-72 max-w-2xl animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      <div className="mt-6 h-[28rem] max-w-2xl animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
    </main>
  );
}
