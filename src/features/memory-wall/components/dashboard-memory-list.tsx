import type { MemoryWithRelations } from "@/features/memory-wall/lib/types";
import type { MemoryStatus } from "@/features/memory-wall/lib/types";
import { DashboardMemoryWallItem } from "@/features/memory-wall/components/dashboard-memory-wall-item";

function journeyLine(status: MemoryStatus): string {
  switch (status) {
    case "pending":
      return "Hang tight — a moderator is giving this a nostalgic once-over.";
    case "approved":
      return "On the wall for your whole batch to see.";
    case "rejected":
      return "This one did not make it — share another moment anytime.";
    case "hidden":
      return "Resting in your private stack for now.";
    default:
      return "";
  }
}

type Props = {
  memories: MemoryWithRelations[];
};

export function DashboardMemoryList({ memories }: Props) {
  if (memories.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-12 text-center dark:border-stone-600 dark:bg-stone-900/40"
        role="status"
      >
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
          Your memory reel is empty
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Drop a photo above — prom, field day, or that one cafeteria lunch.
        </p>
        <p className="mt-5">
          <a
            href="#share-memory"
            className="social-pill-btn inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-from)] dark:text-[var(--accent-to)]"
          >
            Share a memory
          </a>
        </p>
      </div>
    );
  }

  return (
    <div
      className="columns-1 gap-4 sm:columns-2 lg:columns-3"
      role="list"
    >
      {memories.map((m) => {
        const chips: string[] = [];
        if (m.batches?.name) {
          chips.push(
            m.batches.graduation_year != null
              ? `${m.batches.name} · ${m.batches.graduation_year}`
              : m.batches.name,
          );
        }
        if (m.sections?.name) {
          chips.push(m.sections.name);
        }

        return (
          <div
            key={m.id}
            className="mb-4 break-inside-avoid"
            role="listitem"
          >
            <DashboardMemoryWallItem
              memory={m}
              chips={chips}
              statusLine={journeyLine(m.status)}
            />
          </div>
        );
      })}
    </div>
  );
}
