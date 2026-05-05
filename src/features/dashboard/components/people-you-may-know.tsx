"use client";

import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import { ClassmateSayHiButton } from "@/features/classmate-discovery/components/classmate-action-buttons";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { cn } from "@/lib/cn";

const MAX_VISIBLE = 5;

type Props = {
  schoolId: string;
  classmates: ClassmateRow[];
  /** When true (e.g. mock classmates), hide Say Hi actions */
  interactionDisabled?: boolean;
};

export function PeopleYouMayKnow({
  schoolId,
  classmates,
  interactionDisabled = false,
}: Props) {
  const rows = classmates.slice(0, MAX_VISIBLE);

  if (rows.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-slate-500">
        More faces appear as classmates join.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((c) => {
        const name = c.display_name?.trim() || "Alumni";
        const batch =
          c.batches?.name && c.batches?.graduation_year != null
            ? `${c.batches.name} · ${c.batches.graduation_year}`
            : (c.batches?.name ?? "");
        const section = c.sections?.name ?? "";
        const line = [batch, section].filter(Boolean).join(" · ") || "Your school";

        return (
          <li key={c.id}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl bg-white/95 p-3.5 shadow-sm shadow-violet-100/80 ring-1 ring-violet-100/70 transition hover:bg-white hover:shadow-md hover:ring-violet-200/90",
                "dark:bg-stone-900/80 dark:ring-stone-700/80 dark:hover:ring-stone-600",
              )}
            >
              <SafeImage
                src={c.photo_url}
                fallback={<DefaultAvatar />}
                alt={`${name} profile photo`}
                className="size-11 shrink-0 rounded-full ring-2 ring-white shadow-sm ring-violet-100/80"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#0b1c30] dark:text-stone-50">
                  {name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-stone-400">
                  {line}
                </p>
              </div>
              {interactionDisabled ? (
                <span
                  className="inline-flex shrink-0 rounded-full bg-slate-100/95 px-3 py-1.5 text-[11px] font-semibold text-slate-400 ring-1 ring-slate-200/90 dark:bg-stone-800 dark:text-stone-500"
                  aria-hidden
                >
                  Say Hi 👋
                </span>
              ) : (
                <ClassmateSayHiButton schoolId={schoolId} peerUserId={c.user_id} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
