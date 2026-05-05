import Link from "next/link";
import type { DashboardSchool } from "@/features/dashboard/lib/load-alumni-dashboard";
import { dashboardHref } from "@/features/dashboard/lib/load-alumni-dashboard";

type Props = {
  school: DashboardSchool | null;
  className?: string;
};

export function NetworkPrompt({ school, className }: Props) {
  const href = dashboardHref("/dashboard/network", school);

  return (
    <section
      className={
        className ??
        "relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 p-8 shadow-xl shadow-fuchsia-400/25 ring-1 ring-white/20 sm:p-10"
      }
    >
      <div
        className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-white/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-xl">
          <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Expand your network
          </h3>
          <p className="mt-3 text-base leading-relaxed text-white/88">
            Connect with more classmates and grow your alumni web.
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-bold text-violet-700 shadow-lg transition hover:bg-violet-50 hover:shadow-xl active:scale-[0.98]"
        >
          Explore Alumni Web →
        </Link>
      </div>
    </section>
  );
}
