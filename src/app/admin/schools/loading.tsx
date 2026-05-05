export default function AdminSchoolsLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
      <div className="h-48 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}
