export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading admin">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
      <div className="h-32 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}
