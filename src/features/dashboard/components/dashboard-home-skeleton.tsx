export function DashboardHomeSkeleton() {
  return (
    <div
      className="mx-auto max-w-[1440px] animate-pulse space-y-10 pb-6 lg:space-y-12"
      aria-busy="true"
    >
      <div className="space-y-6">
        <div className="grid gap-0 overflow-hidden rounded-2xl bg-slate-200/90 lg:grid-cols-[1fr_34%]">
          <div className="min-h-[240px] lg:min-h-[280px]" />
          <div className="hidden lg:block lg:bg-slate-300/50" />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md">
          <div className="mb-4 flex justify-between">
            <div className="h-4 w-44 rounded bg-slate-200/80" />
            <div className="h-4 w-16 rounded bg-slate-200/70" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex min-w-[200px] shrink-0 gap-3 rounded-xl bg-slate-100/90 p-3"
              >
                <div className="size-10 shrink-0 rounded-full bg-slate-200/90" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-full rounded bg-slate-200/80" />
                  <div className="h-3 w-3/4 rounded bg-slate-200/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-5 h-7 w-36 rounded-md bg-slate-200/90" />
        <div className="-mx-4 flex gap-4 overflow-hidden px-4 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:px-0">
          <div className="h-40 min-w-[156px] shrink-0 rounded-2xl bg-gradient-to-br from-indigo-300/90 to-fuchsia-300/85 lg:min-w-0 lg:w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-36 min-w-[132px] shrink-0 rounded-2xl bg-slate-200/85 lg:min-w-0 lg:w-full"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-10">
          <div className="space-y-5">
            <div className="flex justify-between">
              <div className="h-7 w-44 rounded-md bg-slate-200/90" />
              <div className="h-4 w-14 rounded bg-slate-200/80" />
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg">
              <div className="h-36 rounded-xl bg-slate-200/80" />
              <div className="mt-4 h-36 rounded-xl bg-slate-200/75" />
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex justify-between">
              <div className="h-7 w-48 rounded-md bg-slate-200/90" />
              <div className="h-4 w-16 rounded bg-slate-200/80" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-md"
                >
                  <div className="aspect-[3/4] min-h-[220px] bg-slate-200/80" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded-md bg-slate-200/85" />
                    <div className="h-3 w-1/2 rounded bg-slate-200/75" />
                    <div className="flex gap-2 pt-1">
                      <div className="h-8 w-12 rounded-full bg-slate-200/70" />
                      <div className="h-8 w-12 rounded-full bg-slate-200/70" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full shrink-0 space-y-8 lg:w-[320px]">
          <div className="h-72 rounded-2xl bg-slate-200/85 shadow-lg" />
          <div className="h-80 rounded-2xl bg-slate-200/85 shadow-lg" />
        </div>
      </div>

      <div className="h-36 rounded-2xl bg-slate-300/70 shadow-xl sm:h-40" />
    </div>
  );
}
