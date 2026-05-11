"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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

  // Lock body scroll while the lightbox is open
  useEffect(() => {
    if (!memory) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [memory]);

  // Escape key closes the lightbox
  useEffect(() => {
    if (!memory) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [memory, onClose]);

  // Nothing to show, or running on the server
  if (!memory || typeof window === "undefined") return null;

  const showSocial =
    memory.status === "approved" &&
    engagement &&
    memory.school_id === engagement.schoolId;

  const batchLabel = (() => {
    const batch = memory.batches?.name;
    const year =
      memory.batches?.graduation_year != null
        ? ` (${memory.batches.graduation_year})`
        : "";
    const section = memory.sections?.name;
    return [batch ? `${batch}${year}` : null, section]
      .filter(Boolean)
      .join(" · ");
  })();

  return createPortal(
    /* ── Overlay ── */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* ── Modal panel — stop click propagation so overlay-click closes but panel-click does not ── */}
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-stone-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close memory"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto">
          {/* Image — capped height so caption is always visible */}
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
            className="max-h-[55vh] w-full overflow-hidden rounded-none"
            imgClassName="object-contain"
          />

          {/* Caption + social */}
          <div className="space-y-3 p-5">
            <h2
              id={labelId}
              className="text-base font-semibold text-stone-900 dark:text-stone-50"
            >
              Memory
            </h2>

            {memory.body ? (
              <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                {memory.body}
              </p>
            ) : null}

            {batchLabel ? (
              <p className="text-xs text-stone-400 dark:text-stone-500">
                {batchLabel}
              </p>
            ) : null}

            {showSocial && engagement.tags.length > 0 ? (
              <div className="pt-1">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Tagged
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {engagement.tags.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-200"
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
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
