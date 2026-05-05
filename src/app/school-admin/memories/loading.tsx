export default function SchoolAdminMemoriesLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
      <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
    </div>
  );
}
