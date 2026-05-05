import Link from "next/link";
import type { LandingMemoryPreview } from "@/features/landing/lib/queries";
import { primaryImageUrl } from "@/features/memory-wall/lib/types";
import { isMockMemory } from "@/features/landing/lib/landing-mocks";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

type MemoryPreviewGridProps = {
  memories: LandingMemoryPreview[];
  className?: string;
};

function resolveHref(m: LandingMemoryPreview): string {
  if (isMockMemory(m)) {
    return "#start-here";
  }
  const slug = m.schools?.slug;
  if (slug) {
    return `/s/${slug}/memories`;
  }
  return "#start-here";
}

export function MemoryPreviewGrid({
  memories,
  className,
}: MemoryPreviewGridProps) {
  return (
    <section className={cn("w-full", className)}>
      <div className="mb-10 flex flex-col gap-2 sm:mb-12">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl md:text-[2.35rem]">
          Moments you might remember ❤️
        </h2>
      </div>

      <div
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-2 [scrollbar-width:thin] sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:gap-8 lg:px-0"
        role="list"
      >
        {memories.map((m) => {
          const src = primaryImageUrl(m.media_urls);
          const caption = m.body?.trim() || "A moment worth keeping";
          const mock = isMockMemory(m);

          return (
            <Link
              key={m.id}
              href={resolveHref(m)}
              role="listitem"
              className={cn(
                "group relative w-[min(90vw,460px)] shrink-0 snap-start sm:w-[min(82vw,500px)] md:w-[min(72vw,520px)] lg:w-[480px]",
                "overflow-hidden rounded-2xl border border-white/90 bg-white shadow-xl shadow-stone-300/50",
                "transition duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl motion-reduce:transition-none",
              )}
            >
              <div className="relative h-[clamp(360px,78vw,560px)] w-full overflow-hidden bg-stone-100 sm:h-[clamp(400px,70vw,600px)] lg:h-[560px]">
                <SafeImage
                  src={src}
                  fallback={<PhotoFallback src={DEFAULT_MEMORY_IMAGE} />}
                  alt={caption ? `Memory preview: ${caption}` : "Memory preview"}
                  className="h-full w-full rounded-[inherit]"
                  imgClassName="scale-105 transition duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                {mock ? (
                  <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    Sample
                  </span>
                ) : null}
              </div>
              <div className="border-t border-stone-100 bg-white p-5 sm:p-6">
                {m.schools?.name ? (
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-600">
                    {m.schools.name}
                  </p>
                ) : null}
                <p className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-stone-900 sm:text-xl">
                  {caption}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
