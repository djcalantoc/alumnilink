import Link from "next/link";
import type { DashboardMemoryHighlight } from "@/features/dashboard/lib/load-alumni-dashboard";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

type Props = {
  memories: DashboardMemoryHighlight[];
  memoriesWallHref: string;
  schoolLabel: string | null;
  mockMemories?: boolean;
};

function memoryHref(m: DashboardMemoryHighlight, wallHref: string): string {
  if (m.id.startsWith("mock-")) {
    return "/dashboard/memories";
  }
  return wallHref;
}

function MemoryReactionStrip({
  reactionsLabel,
}: {
  reactionsLabel: string | null;
}) {
  if (reactionsLabel?.trim()) {
    return (
      <p className="mt-3 text-sm font-medium leading-snug text-slate-600">
        {reactionsLabel}
      </p>
    );
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 px-3 py-1 text-sm shadow-inner ring-1 ring-violet-100/80">
        👍 <span className="sr-only">Like</span>
      </span>
      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-sm shadow-inner ring-1 ring-amber-100/70">
        😂 <span className="sr-only">Laugh</span>
      </span>
    </div>
  );
}

export function MemoryHighlights({
  memories,
  memoriesWallHref,
  schoolLabel,
  mockMemories,
}: Props) {
  const items = memories.slice(0, 6);

  return (
    <section className="space-y-5" aria-labelledby="member-memory-highlights">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="member-memory-highlights"
          className="text-xl font-bold tracking-tight text-[#0b1c30]"
        >
          Memory highlights
        </h2>
        <Link
          href="/dashboard/memories"
          className="shrink-0 text-sm font-bold text-indigo-600 hover:underline"
        >
          Explore
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 p-8 text-center shadow-lg">
          <p className="text-4xl" aria-hidden>
            📸
          </p>
          <p className="mt-3 font-semibold text-[#0b1c30]">No memories yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Share a throwback — your batch will smile.
          </p>
          <Link
            href="/dashboard/memories"
            className="mt-5 inline-flex rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
          >
            Open Memory Wall
          </Link>
        </div>
      ) : (
        <>
          {mockMemories ? (
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
              Preview
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {items.map((memory) => {
              const caption =
                memory.caption?.trim() || "A moment from the wall";
              const href = memoryHref(memory, memoriesWallHref);

              return (
                <Link
                  key={memory.id}
                  href={href}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-2xl border border-violet-100/90 bg-white shadow-lg shadow-violet-100/40 ring-1 ring-slate-100/80 transition-shadow duration-300 hover:shadow-xl hover:ring-violet-200/90",
                  )}
                >
                  <div
                    className="relative aspect-[3/4] min-h-[260px] w-full overflow-hidden bg-slate-100 sm:min-h-[280px] lg:min-h-[300px]"
                  >
                    <SafeImage
                      src={memory.imageUrl}
                      fallback={<PhotoFallback src={DEFAULT_MEMORY_IMAGE} />}
                      alt={caption ? `Memory: ${caption}` : "Memory highlight"}
                      className="h-full w-full rounded-[inherit]"
                      imgClassName="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:group-hover:scale-100"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
                  </div>

                  <div className="flex flex-1 flex-col border-t border-slate-100/90 bg-gradient-to-b from-white to-violet-50/30 p-4 sm:p-5">
                    {schoolLabel ? (
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-600">
                        {schoolLabel}
                      </p>
                    ) : null}
                    <p className="mt-1 line-clamp-3 text-base font-semibold leading-snug text-[#0b1c30]">
                      {caption}
                    </p>
                    <MemoryReactionStrip
                      reactionsLabel={memory.reactionsLabel ?? null}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
