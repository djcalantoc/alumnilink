"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import type { BatchRow, SectionRow } from "@/features/school-batch-sections/lib/queries";
import { cn } from "@/lib/cn";

type Props = {
  schoolId: string;
  batches: BatchRow[];
  sections: SectionRow[];
  batchId: string | undefined;
  sectionId: string | undefined;
};

export function AlumniApprovalsFilters({
  schoolId,
  batches,
  sections,
  batchId,
  sectionId,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const sectionOptions = useMemo(() => {
    if (!batchId) {
      return [];
    }
    return sections.filter((s) => s.batch_id === batchId);
  }, [batchId, sections]);

  function pushFilters(next: { batchId?: string; sectionId?: string }) {
    const p = new URLSearchParams();
    p.set("schoolId", schoolId);
    const b = next.batchId !== undefined ? next.batchId : batchId;
    const s = next.sectionId !== undefined ? next.sectionId : sectionId;
    if (b) {
      p.set("batchId", b);
    }
    if (s) {
      p.set("sectionId", s);
    }
    startTransition(() => {
      router.push(`/school-admin/alumni-approvals?${p.toString()}`);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end",
        pending && "opacity-70",
      )}
    >
      <label className="block min-w-[10rem] flex-1">
        <span className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
          Batch
        </span>
        <select
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          value={batchId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            pushFilters({ batchId: v || undefined, sectionId: undefined });
          }}
        >
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-[10rem] flex-1">
        <span className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
          Section
        </span>
        <select
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 disabled:opacity-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          disabled={!batchId || sectionOptions.length === 0}
          value={sectionId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            pushFilters({ sectionId: v || undefined });
          }}
        >
          <option value="">All sections</option>
          {sectionOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
