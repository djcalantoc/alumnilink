"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MOCK_LANDING_BATCHES,
  isMockSchool,
} from "@/features/landing/lib/landing-mocks";
import type { LandingSchool } from "@/features/landing/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type Batch = {
  id: string;
  name: string;
  graduation_year: number | null;
  school_id: string;
};

type Props = {
  schools: LandingSchool[];
  className?: string;
};

export function FloatingSearchCard({ schools, className }: Props) {
  const router = useRouter();

  const [selectedSchoolId, setSelectedSchoolId] = useState(
    schools[0]?.id ?? "",
  );
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  const school = schools.find((s) => s.id === selectedSchoolId);

  // Fetch batches whenever the selected school changes
  useEffect(() => {
    setSelectedBatchId("");
    setBatches([]);

    if (!selectedSchoolId || !school) return;

    // Mock schools use local mock data — no DB call needed
    if (isMockSchool(school)) {
      setBatches(
        MOCK_LANDING_BATCHES.filter((b) => b.school_id === selectedSchoolId),
      );
      return;
    }

    setIsLoadingBatches(true);
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("batches")
      .select("id, name, graduation_year, school_id")
      .eq("school_id", selectedSchoolId)
      .order("graduation_year", { ascending: false })
      .then(({ data }) => {
        setBatches(data ?? []);
        setIsLoadingBatches(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchoolId]);

  const canNavigate = Boolean(
    school && selectedBatchId && !isMockSchool(school),
  );
  const isMock = school ? isMockSchool(school) : false;

  function handleGo() {
    if (isMock || !school?.slug) {
      router.push("/register");
      return;
    }
    if (!selectedBatchId) return;
    router.push(
      `/s/${school.slug}/join?batch_id=${encodeURIComponent(selectedBatchId)}`,
    );
  }

  let batchPlaceholder = "Your graduating class";
  if (isLoadingBatches) batchPlaceholder = "Loading batches…";
  else if (!selectedSchoolId) batchPlaceholder = "Pick a school first";
  else if (batches.length === 0) batchPlaceholder = "No batches available yet";

  return (
    <div
      id="start-here"
      className={cn(
        "relative z-30 scroll-mt-24 rounded-2xl border border-white/70 bg-white p-6 shadow-lg ring-1 ring-violet-100/80 sm:p-8 md:p-10",
        className,
      )}
    >
      <p className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
        Start here. Find your people.
      </p>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5">
        {/* School selector */}
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
            Select School
          </span>
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="min-h-14 w-full rounded-2xl border border-stone-200/90 bg-stone-50 px-4 text-base font-semibold text-stone-900 shadow-inner outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/40"
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {/* Batch selector */}
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
            Select Batch
          </span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            disabled={isLoadingBatches || batches.length === 0}
            className="min-h-14 w-full rounded-2xl border border-stone-200/90 bg-stone-50 px-4 text-base font-semibold text-stone-900 shadow-inner outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <option value="">{batchPlaceholder}</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.graduation_year != null ? ` · ${b.graduation_year}` : ""}
              </option>
            ))}
          </select>
        </label>

        {/* CTA button */}
        <button
          type="button"
          onClick={handleGo}
          disabled={!isMock && !canNavigate}
          className={cn(
            "inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl",
            "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500",
            "px-8 text-base font-bold text-white",
            "shadow-lg shadow-fuchsia-500/35",
            "transition duration-300 ease-out",
            "hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
            "motion-reduce:transition-none",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg",
            "lg:min-w-[220px]",
          )}
        >
          See my classmates →
        </button>
      </div>
    </div>
  );
}
