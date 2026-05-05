"use client";

import type { ReactNode } from "react";
import { primaryImageUrl } from "@/features/memory-wall/lib/types";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

export type MemoryCardProps = {
  caption: string | null;
  mediaUrls: unknown;
  schoolName?: string;
  /** Short label above caption (e.g. memory title) */
  eyebrow?: string | null;
  /** Small labels, e.g. batch / section */
  chips?: string[];
  /** Friendly line (e.g. moderation journey) */
  statusLine?: string;
  footerRight?: ReactNode;
  reactions?: ReactNode;
  /** Freeform line, e.g. tagged names when available */
  taggedLine?: string;
  /** Taller imagery for masonry / wall layouts */
  variant?: "default" | "wall";
  className?: string;
  onOpen?: () => void;
};

export function MemoryCard({
  caption,
  mediaUrls,
  schoolName,
  eyebrow,
  chips = [],
  statusLine,
  footerRight,
  reactions,
  taggedLine,
  variant = "default",
  className,
  onOpen,
}: MemoryCardProps) {
  const src = primaryImageUrl(mediaUrls);
  const imageHeight =
    variant === "wall"
      ? "min-h-[14rem] sm:min-h-[17rem] h-auto max-h-[28rem]"
      : "h-56";

  const body = (
    <>
      <SafeImage
        src={src}
        fallback={<PhotoFallback src={DEFAULT_MEMORY_IMAGE} />}
        alt={caption?.trim() ? `Memory: ${caption.trim()}` : "Memory photo"}
        className={cn("block w-full overflow-hidden rounded-[inherit]", imageHeight)}
        imgClassName="object-cover"
      />
      <div className="p-4">
        {schoolName ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--accent-from)]">
            {schoolName}
          </p>
        ) : null}
        {eyebrow?.trim() ? (
          <p className="mt-1 text-xs font-medium text-stone-700 dark:text-stone-200">
            {eyebrow.trim()}
          </p>
        ) : null}
        {caption ? (
          <p className="mt-1 text-sm leading-snug text-stone-800 dark:text-stone-100">
            {caption}
          </p>
        ) : (
          <p className="mt-1 text-sm italic text-stone-400 dark:text-stone-500">
            A quiet moment from the yearbook…
          </p>
        )}
        {chips.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300"
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}
        {statusLine ? (
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            {statusLine}
          </p>
        ) : null}
        {reactions || taggedLine ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-wrap gap-2">{reactions}</div>
            {taggedLine ? (
              <span className="max-w-full text-[11px] text-stone-500 dark:text-stone-400 sm:max-w-[55%] sm:text-right">
                <span className="font-medium text-stone-600 dark:text-stone-300">
                  Tagged:{" "}
                </span>
                {taggedLine}
              </span>
            ) : null}
          </div>
        ) : null}
        {footerRight ? (
          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            {footerRight}
          </div>
        ) : null}
      </div>
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "social-card w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-white text-left dark:border-stone-800 dark:bg-stone-950",
          className,
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <article
      className={cn(
        "social-card overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-950",
        className,
      )}
    >
      {body}
    </article>
  );
}
