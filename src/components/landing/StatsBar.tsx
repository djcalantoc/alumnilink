import {
  Calendar,
  Image,
  Landmark,
  UsersRound,
} from "lucide-react";
import type { LandingStats } from "@/features/landing/lib/queries";
import { cn } from "@/lib/cn";

type Props = {
  stats: LandingStats;
  className?: string;
};

function formatNum(n: number): string {
  if (n >= 10_000) {
    return `${Math.round(n / 1000)}k+`;
  }
  if (n > 1) {
    return `${n.toLocaleString()}+`;
  }
  return n.toLocaleString();
}

const ITEMS = [
  {
    key: "alumniJoined" as keyof LandingStats,
    label: "Alumni joined",
    Icon: UsersRound,
    iconBg: "bg-gradient-to-br from-violet-100 to-violet-200",
    iconColor: "text-violet-600",
  },
  {
    key: "schools" as keyof LandingStats,
    label: "Schools",
    Icon: Landmark,
    iconBg: "bg-gradient-to-br from-indigo-100 to-indigo-200",
    iconColor: "text-indigo-600",
  },
  {
    key: "memories" as keyof LandingStats,
    label: "Memories shared",
    Icon: Image,
    iconBg: "bg-gradient-to-br from-fuchsia-100 to-pink-200",
    iconColor: "text-fuchsia-600",
  },
  {
    key: "events" as keyof LandingStats,
    label: "Events & reunions",
    Icon: Calendar,
    iconBg: "bg-gradient-to-br from-amber-100 to-orange-200",
    iconColor: "text-amber-600",
  },
] as const;

export function StatsBar({ stats, className }: Props) {
  return (
    <section className={cn("w-full", className)} aria-label="Community stats">
      <div className="mx-auto max-w-6xl rounded-3xl border border-violet-100 bg-white p-6 shadow-lg md:p-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0">
          {ITEMS.map(({ key, label, Icon, iconBg, iconColor }, idx) => (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center px-4 py-2 text-center",
                "transition duration-200 hover:-translate-y-1",
                // Desktop dividers — right border on first 3 items
                idx < ITEMS.length - 1 && "md:border-r md:border-stone-100",
              )}
            >
              {/* Icon container */}
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  iconBg,
                )}
                aria-hidden
              >
                <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={2} />
              </div>

              {/* Number */}
              <p className="mt-4 text-4xl font-bold tabular-nums tracking-tight text-stone-900 sm:text-5xl">
                {formatNum(stats[key])}
              </p>

              {/* Label */}
              <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
