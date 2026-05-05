export default function DashboardNetworkLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 h-16 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
      <div
        className="mb-8 h-36 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800"
        aria-busy="true"
        aria-label="Loading alumni web"
      />
      <div className="mb-6 h-32 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      <div className="h-64 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
    </main>
  );
}
