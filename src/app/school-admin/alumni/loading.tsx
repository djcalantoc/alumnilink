export default function AlumniManagementLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div>
        <div className="h-8 w-64 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-900" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-900" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
      <div className="h-96 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}
