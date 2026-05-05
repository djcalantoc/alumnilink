import Link from "next/link";
import type { DashboardActivityItem } from "@/features/dashboard/lib/load-alumni-dashboard";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { cn } from "@/lib/cn";

export type SocialStripItem = {
  id: string;
  text: string;
  initials: string;
  avatarUrl?: string | null;
};

const FALLBACK: SocialStripItem[] = [
  { id: "strip-fallback-1", text: "Maria joined Batch 2016", initials: "M" },
  { id: "strip-fallback-2", text: "John uploaded a memory", initials: "J" },
  { id: "strip-fallback-3", text: "Ana said hi 👋", initials: "A" },
];

function initialsFromActivityLine(line: string): string {
  const trimmed = line.trim();
  const m = trimmed.match(/^([A-Za-z])/);
  if (m) {
    return m[1].toUpperCase();
  }
  if (/^someone\s/i.test(trimmed)) {
    return "✨";
  }
  return "?";
}

/** Builds strip rows from notification-derived activity, or friendly demo copy when empty. */
export function buildSocialStripItems(
  activity: DashboardActivityItem[],
): SocialStripItem[] {
  if (activity.length === 0) {
    return FALLBACK;
  }
  return activity.slice(0, 8).map((a) => ({
    id: a.id,
    text: a.line,
    initials: initialsFromActivityLine(a.line),
  }));
}

type Props = {
  items: SocialStripItem[];
  notificationsHref?: string;
  className?: string;
};

export function RecentSocialActivityStrip({
  items,
  notificationsHref = "/dashboard/notifications",
  className,
}: Props) {
  const list = items.length > 0 ? items : FALLBACK;

  return (
    <section
      className={cn(
        "rounded-2xl border border-violet-100/90 bg-white/95 p-4 shadow-md shadow-violet-100/40 backdrop-blur-sm sm:p-5",
        className,
      )}
      aria-label="Recent social activity"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
          Recent social activity
        </h2>
        <Link
          href={notificationsHref}
          className="shrink-0 text-xs font-bold text-indigo-600 hover:underline"
        >
          See all →
        </Link>
      </div>

      <div
        className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:thin] snap-x snap-mandatory md:-mx-0 md:flex-wrap md:overflow-visible md:px-0 md:snap-none md:gap-4"
      >
        {list.map((item) => (
          <article
            key={item.id}
            className={cn(
              "flex min-w-[min(300px,calc(100vw-4rem))] shrink-0 snap-start items-center gap-3 rounded-xl bg-gradient-to-br from-slate-50/95 to-violet-50/40 px-4 py-3 ring-1 ring-slate-100/90 sm:min-w-[260px] md:min-w-0 md:flex-1 md:basis-[clamp(200px,28%,320px)]",
            )}
          >
            <SafeImage
              src={item.avatarUrl}
              fallback={<DefaultAvatar />}
              alt={
                item.text.trim()
                  ? `Avatar for activity: ${item.text}`
                  : "Activity avatar"
              }
              className="size-10 shrink-0 rounded-full ring-2 ring-white shadow-sm"
            />
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-800">
              {item.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
