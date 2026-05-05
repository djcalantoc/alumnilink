"use client";

import { useEffect, useId, useRef } from "react";
import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import type { MemoryTagRow } from "@/features/memory-tagging/lib/types";
import { MemoryTagField } from "@/features/memory-tagging/components/memory-tag-field";
import type { MemoryWithRelations } from "@/features/memory-wall/lib/types";
import { primaryImageUrl } from "@/features/memory-wall/lib/types";
import { ReactionBar } from "@/features/reactions/components/reaction-bar";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";

type Engagement = {
  currentUserId: string;
  schoolId: string;
  classmates: ClassmateRow[];
  tags: MemoryTagRow[];
};

type Props = {
  memory: MemoryWithRelations | null;
  onClose: () => void;
  engagement?: Engagement | null;
};

export function MemoryLightbox({ memory, onClose, engagement }: Props) {
  const labelId = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (memory) {
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [memory]);

  const showSocial =
    memory?.status === "approved" &&
    engagement &&
    memory.school_id === engagement.schoolId;

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="w-[calc(100vw-1.5rem)] max-w-lg rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-900/50 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
    >
      {memory ? (
        <div className="max-h-[90vh] overflow-y-auto">
          <SafeImage
            src={primaryImageUrl(memory.media_urls)}
            fallback={
              <PhotoFallback
                src={DEFAULT_MEMORY_IMAGE}
                className="object-contain"
              />
            }
            alt={
              memory.body?.trim()
                ? `Memory photo: ${memory.body.trim()}`
                : "Memory photo"
            }
            className="w-full rounded-none"
            imgClassName="object-contain"
          />
          <div className="space-y-2 p-4 sm:p-5">
            <h2
              id={labelId}
              className="text-base font-semibold text-stone-900 dark:text-stone-50"
            >
              Memory
            </h2>
            {memory.body ? (
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {memory.body}
              </p>
            ) : null}
            {(() => {
              const batch = memory.batches?.name;
              const year =
                memory.batches?.graduation_year != null
                  ? ` (${memory.batches.graduation_year})`
                  : "";
              const section = memory.sections?.name;
              const tag = [batch ? `${batch}${year}` : null, section]
                .filter(Boolean)
                .join(" · ");
              return tag ? (
                <p className="text-xs text-stone-500 dark:text-stone-400">{tag}</p>
              ) : null;
            })()}

            {showSocial && engagement.tags.length > 0 ? (
              <div className="pt-2">
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  Tagged
                </p>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {engagement.tags.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-800 dark:bg-stone-800 dark:text-stone-200"
                    >
                      {t.users?.full_name?.trim() || "Alumni"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {showSocial ? (
              <>
                <ReactionBar
                  targetType="memory"
                  targetId={memory.id}
                  schoolId={memory.school_id}
                />
                <MemoryTagField
                  memoryId={memory.id}
                  schoolId={memory.school_id}
                  currentUserId={engagement.currentUserId}
                  classmates={engagement.classmates}
                />
              </>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-10 rounded-xl bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
