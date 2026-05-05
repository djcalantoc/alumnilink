"use client";

import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import { ClassmateSayHiButton } from "@/features/classmate-discovery/components/classmate-action-buttons";
import { KnowPersonButton } from "@/features/alumni-network/components/know-person-button";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { cn } from "@/lib/cn";

type Props = {
  classmate: ClassmateRow;
  schoolId: string;
  currentProfileId: string;
  onOpenDetail: () => void;
};

function batchSectionLine(c: ClassmateRow): string {
  const parts: string[] = [];
  if (c.batches?.name) {
    parts.push(
      c.batches.graduation_year != null
        ? `${c.batches.name} · ${c.batches.graduation_year}`
        : c.batches.name,
    );
  }
  if (c.sections?.name) {
    parts.push(c.sections.name);
  }
  return parts.length > 0 ? parts.join(" · ") : "Your school";
}

export function ClassmateCard({
  classmate: c,
  schoolId,
  currentProfileId,
  onOpenDetail,
}: Props) {
  const name = c.display_name?.trim() || "Alumni";
  const status = c.headline?.trim();
  const meta = batchSectionLine(c);

  return (
    <article
      className={cn(
        "social-card flex flex-col items-center rounded-2xl border border-stone-200/80 bg-white p-4 text-center dark:border-stone-800 dark:bg-stone-950",
      )}
    >
      <button
        type="button"
        onClick={onOpenDetail}
        className="group flex w-full flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-from)] focus-visible:ring-offset-2"
      >
        <SafeImage
          src={c.photo_url}
          fallback={<DefaultAvatar />}
          alt={`${name} profile photo`}
          className="mb-3 size-20 rounded-full ring-2 ring-stone-100 transition group-hover:ring-[var(--accent-soft)] dark:ring-stone-800"
        />
        <h3 className="font-semibold text-stone-900 dark:text-stone-50">
          {name}
        </h3>
        <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">
          {meta}
        </p>
        {status ? (
          <p className="mt-2 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
            &ldquo;{status}&rdquo;
          </p>
        ) : (
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            Open for a closer look
          </p>
        )}
        <span className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--accent-from)] opacity-80">
          Tap for more
        </span>
      </button>

      <div className="mt-4 flex w-full flex-col gap-2">
        <div className="flex w-full flex-col gap-2">
          <ClassmateSayHiButton schoolId={schoolId} peerUserId={c.user_id} />
          <KnowPersonButton
            schoolId={schoolId}
            myProfileId={currentProfileId}
            peerProfileId={c.id}
            compact
          />
        </div>
      </div>
    </article>
  );
}
