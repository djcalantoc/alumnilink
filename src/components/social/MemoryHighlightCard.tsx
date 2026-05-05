import Link from "next/link";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

export type MemoryHighlightItem = {
  id: string;
  caption: string | null;
  imageUrl: string | null;
  reactionsLabel: string | null;
};

type MemoryHighlightCardProps = {
  memory: MemoryHighlightItem;
  href: string;
  className?: string;
};

export function MemoryHighlightCard({
  memory,
  href,
  className,
}: MemoryHighlightCardProps) {
  const isMock = memory.id.startsWith("mock-");

  return (
    <Link
      href={href}
      className={cn(
        "social-card overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-950",
        className,
      )}
    >
      <SafeImage
        src={memory.imageUrl}
        fallback={<PhotoFallback src={DEFAULT_MEMORY_IMAGE} />}
        alt={
          memory.caption?.trim()
            ? `Memory: ${memory.caption.trim()}`
            : "Memory highlight"
        }
        className={cn(
          "aspect-square w-full overflow-hidden rounded-[inherit]",
          isMock && "opacity-95",
        )}
        imgClassName="object-cover"
      />
      <div className="p-2">
        {memory.caption ? (
          <p className="line-clamp-2 text-[11px] leading-snug text-stone-700 dark:text-stone-300">
            {memory.caption}
          </p>
        ) : null}
        {memory.reactionsLabel ? (
          <p className="mt-1 text-[10px] text-stone-500 dark:text-stone-400">
            {memory.reactionsLabel}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
