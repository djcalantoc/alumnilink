"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";

export type BatchOption = { id: string; name: string; graduation_year: number | null };
export type SectionOption = { id: string; name: string; batch_id: string };

type Props = {
  schoolSlug: string;
  schoolName: string;
  batches: BatchOption[];
  sections: SectionOption[];
};

const selectCls =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none ring-violet-500 transition focus:border-violet-400 focus:ring-1 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export function JoinBatchPicker({ schoolSlug, schoolName, batches, sections }: Props) {
  const router = useRouter();
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const sortedBatches = useMemo(
    () => [...batches].sort((a, b) => (b.graduation_year ?? 0) - (a.graduation_year ?? 0)),
    [batches],
  );

  const sectionOptions = useMemo(
    () => sections.filter((s) => s.batch_id === selectedBatchId),
    [sections, selectedBatchId],
  );

  function handleBatchChange(value: string) {
    setSelectedBatchId(value);
    setSelectedSectionId("");
  }

  function handleContinue() {
    if (!selectedBatchId) return;
    const params = new URLSearchParams();
    params.set("batchId", selectedBatchId);
    if (selectedSectionId) params.set("sectionId", selectedSectionId);
    router.push(`/s/${schoolSlug}/join?${params.toString()}`);
  }

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/20">
          <GraduationCap className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Join {schoolName}
        </h2>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          Select your graduating batch to get started.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
          1
        </span>
        <span className="h-px w-8 bg-stone-200 dark:bg-stone-700" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-xs font-medium text-stone-400 dark:border-stone-700">
          2
        </span>
        <span className="h-px w-8 bg-stone-200 dark:bg-stone-700" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-xs font-medium text-stone-400 dark:border-stone-700">
          3
        </span>
      </div>

      {/* Form */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-950">
        <div className="space-y-4 px-5 py-6">
          {batches.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              No batches have been added yet. Ask your school admin to set them up.
            </p>
          ) : (
            <>
              {/* Batch */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
                  Graduating Batch
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className={selectCls}
                >
                  <option value="" disabled>
                    Select your batch
                  </option>
                  {sortedBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              {selectedBatchId && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
                    Section
                    <span className="ml-1.5 text-xs font-normal text-stone-400">
                      optional
                    </span>
                  </label>
                  {sectionOptions.length === 0 ? (
                    <p className="rounded-xl bg-stone-50 px-3 py-2.5 text-xs text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                      No sections for this batch — you can skip this.
                    </p>
                  ) : (
                    <select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">No specific section</option>
                      {sectionOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-stone-100 bg-stone-50/60 px-5 py-4 dark:border-stone-800 dark:bg-stone-900/40">
          {selectedBatch && (
            <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
              Joining as{" "}
              <span className="font-semibold text-stone-700 dark:text-stone-200">
                {selectedBatch.name}
                {selectedBatch.graduation_year != null
                  ? ` (${selectedBatch.graduation_year})`
                  : ""}
              </span>
            </p>
          )}
          <button
            type="button"
            disabled={!selectedBatchId}
            onClick={handleContinue}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition",
              "bg-gradient-to-r from-violet-600 to-fuchsia-500",
              "hover:from-violet-700 hover:to-fuchsia-600 hover:shadow-md hover:shadow-violet-500/25",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
            )}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
