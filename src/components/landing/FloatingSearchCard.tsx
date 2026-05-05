"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LandingBatch } from "@/features/landing/lib/queries";
import type { LandingSchool } from "@/features/landing/lib/queries";
import { isMockSchool } from "@/features/landing/lib/landing-mocks";
import { cn } from "@/lib/cn";

type Props = {
  schools: LandingSchool[];
  batches: LandingBatch[];
  className?: string;
};

export function FloatingSearchCard({ schools, batches, className }: Props) {
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [batchId, setBatchId] = useState("");

  const school = schools.find((s) => s.id === schoolId);
  const batchOptions = useMemo(
    () => batches.filter((b) => b.school_id === schoolId),
    [batches, schoolId],
  );

  const href = useMemo(() => {
    if (!school) {
      return "/register";
    }
    if (isMockSchool(school) || !school.slug) {
      return "/register";
    }
    const q = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : "";
    return `/s/${school.slug}/join${q}`;
  }, [school, batchId]);

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
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
            Select School
          </span>
          <select
            value={schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value);
              setBatchId("");
            }}
            className="min-h-14 w-full rounded-2xl border border-stone-200/90 bg-stone-50 px-4 text-base font-semibold text-stone-900 shadow-inner outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/40"
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
            Select Batch
          </span>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            disabled={batchOptions.length === 0}
            className="min-h-14 w-full rounded-2xl border border-stone-200/90 bg-stone-50 px-4 text-base font-semibold text-stone-900 shadow-inner outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <option value="">
              {batchOptions.length === 0
                ? "No batches yet — pick a school"
                : "Your graduating class"}
            </option>
            {batchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.graduation_year != null ? ` · ${b.graduation_year}` : ""}
              </option>
            ))}
          </select>
        </label>

        <Link
          href={href}
          className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-8 text-base font-bold text-white shadow-lg shadow-fuchsia-500/35 transition duration-300 ease-out hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] motion-reduce:transition-none lg:min-w-[220px]"
        >
          See my classmates →
        </Link>
      </div>
    </div>
  );
}
