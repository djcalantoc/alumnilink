import Link from "next/link";
import type { DashboardMemoryHighlight } from "@/features/dashboard/lib/load-alumni-dashboard";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

type Props = {
  memory: DashboardMemoryHighlight;
  href: string;
  schoolLabel?: string | null;
  authorLine?: string | null;
  className?: string;
};

export function MemoryFeaturedHero({
  memory,
  href,
  schoolLabel,
  authorLine,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-xl shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <SafeImage
        src={memory.imageUrl}
        fallback={<PhotoFallback src={DEFAULT_MEMORY_IMAGE} />}
        alt={
          memory.caption?.trim()
            ? `Memory: ${memory.caption.trim()}`
            : "Featured memory"
        }
        className="size-full rounded-[inherit]"
        imgClassName="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
          Featured memory
        </span>
        <p className="text-sm font-medium leading-snug text-white">
          {memory.caption ? `“${memory.caption}”` : "A moment from the wall"}
        </p>
        {(schoolLabel || authorLine) && (
          <div className="mt-3 flex items-center gap-2">
            <div className="size-6 rounded-full border border-white/50 bg-white/20" />
            <span className="text-xs text-white/80">
              {authorLine ?? schoolLabel ?? ""}
            </span>
          </div>
        )}
      </div>
      <Link
        href={href}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white hover:text-pink-600"
        aria-label="View memory"
      >
        <MaterialIcon name="favorite" filled className="text-xl" />
      </Link>
    </div>
  );
}
