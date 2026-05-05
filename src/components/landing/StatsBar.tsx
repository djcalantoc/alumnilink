import type { LandingStats } from "@/features/landing/lib/queries";
import { cn } from "@/lib/cn";

type Props = {
  stats: LandingStats;
  className?: string;
};

function formatNum(n: number): string {
  if (n >= 10000) {
    return `${Math.round(n / 1000)}k+`;
  }
  return n.toLocaleString();
}

const items: {
  key: keyof LandingStats;
  label: string;
  icon: string;
}[] = [
  { key: "alumniJoined", label: "Alumni joined", icon: "🎓" },
  { key: "schools", label: "Schools", icon: "🏫" },
  { key: "memories", label: "Memories", icon: "📸" },
  { key: "events", label: "Events", icon: "🎉" },
];

export function StatsBar({ stats, className }: Props) {
  return (
    <section className={cn("w-full", className)} aria-label="Community stats">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-white via-violet-50/70 to-fuchsia-50/80 p-8 shadow-xl shadow-violet-200/40 sm:p-10",
        )}
      >
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6 lg:gap-10">
          {items.map(({ key, label, icon }) => (
            <div
              key={key}
              className="flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl shadow-inner sm:h-16 sm:w-16 sm:text-3xl"
                aria-hidden
              >
                {icon}
              </span>
              <p className="mt-4 text-4xl font-bold tabular-nums tracking-tight text-stone-900 sm:text-5xl">
                {formatNum(stats[key])}
              </p>
              <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.14em] text-violet-700/90">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
