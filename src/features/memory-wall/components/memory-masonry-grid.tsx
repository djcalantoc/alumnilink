import {
  type MemoryWithRelations,
  primaryImageUrl,
} from "@/features/memory-wall/lib/types";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";

type Props = {
  memories: MemoryWithRelations[];
  /** When set, wraps each card in a button for lightbox/detail */
  interactive?: boolean;
  onSelect?: (memory: MemoryWithRelations) => void;
};

export function MemoryMasonryGrid({
  memories,
  interactive = false,
  onSelect,
}: Props) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {memories.map((m) => {
        const src = primaryImageUrl(m.media_urls);
        const batch = m.batches?.name;
        const year =
          m.batches?.graduation_year != null
            ? ` (${m.batches.graduation_year})`
            : "";
        const section = m.sections?.name;

        const inner = (
          <>
            <SafeImage
              src={src}
              fallback={<PhotoFallback src={DEFAULT_MEMORY_IMAGE} />}
              alt={m.body?.trim() ? `Memory: ${m.body.trim()}` : "Memory"}
              className="w-full overflow-hidden rounded-t-2xl rounded-b-none"
              imgClassName="object-cover"
              loading="lazy"
            />
            <div className="p-3">
              {m.body ? (
                <p className="line-clamp-4 text-sm text-stone-800 dark:text-stone-200">
                  {m.body}
                </p>
              ) : null}
              {(batch || section) && (
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                  {[batch ? `${batch}${year}` : null, section].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </>
        );

        const shellClass =
          "mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm dark:border-stone-800 dark:bg-stone-950";

        if (interactive && onSelect) {
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className={`${shellClass} w-full cursor-pointer transition hover:border-stone-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:hover:border-stone-600`}
            >
              {inner}
            </button>
          );
        }

        return (
          <article key={m.id} className={shellClass}>
            {inner}
          </article>
        );
      })}
    </div>
  );
}
