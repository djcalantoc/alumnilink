import type { MonthStat } from "@/features/super-admin/lib/types";

type AlumniPerSchool = { school_name: string; count: number };

type Props = {
  monthlyRegs: MonthStat[];
  alumniPerSchool: AlumniPerSchool[];
};

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

export function PlatformReports({ monthlyRegs, alumniPerSchool }: Props) {
  const maxReg = Math.max(...monthlyRegs.map((m) => m.count), 1);
  const maxSchool = Math.max(...alumniPerSchool.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Registration trend */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-950">
        <h2 className="mb-1 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Registrations over time
        </h2>
        <p className="mb-5 text-xs text-stone-400">New user accounts — last 12 months</p>
        <div className="flex items-end gap-1 pb-2">
          {monthlyRegs.map((m) => {
            const pct = Math.round((m.count / maxReg) * 100);
            return (
              <div
                key={m.month}
                className="group flex flex-1 flex-col items-center gap-1"
                title={`${monthLabel(m.month)}: ${m.count}`}
              >
                <span className="hidden text-[10px] tabular-nums text-stone-500 group-hover:block">
                  {m.count}
                </span>
                <div
                  className="w-full rounded-t-md bg-violet-500/80 transition-all group-hover:bg-violet-600 dark:bg-violet-600/60"
                  style={{ height: `${Math.max(4, (pct / 100) * 120)}px` }}
                />
                <span className="text-[9px] tabular-nums text-stone-400">
                  {monthLabel(m.month)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-4 dark:border-stone-800">
          <div>
            <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {monthlyRegs.reduce((s, m) => s + m.count, 0)}
            </p>
            <p className="text-xs text-stone-400">total in period</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {Math.round(monthlyRegs.reduce((s, m) => s + m.count, 0) / 12)}
            </p>
            <p className="text-xs text-stone-400">avg / month</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {maxReg}
            </p>
            <p className="text-xs text-stone-400">peak month</p>
          </div>
        </div>
      </div>

      {/* Alumni per school */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-950">
        <h2 className="mb-1 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Alumni growth by school
        </h2>
        <p className="mb-5 text-xs text-stone-400">Approved alumni count per active school (top 10)</p>
        {alumniPerSchool.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-stone-400">No approved alumni profiles yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alumniPerSchool.map(({ school_name, count }) => {
              const pct = Math.round((count / maxSchool) * 100);
              return (
                <div key={school_name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-stone-700 dark:text-stone-300 max-w-[60%]">
                      {school_name}
                    </span>
                    <span className="tabular-nums font-semibold text-stone-600 dark:text-stone-400">
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
