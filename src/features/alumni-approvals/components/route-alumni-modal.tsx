"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, GitBranch } from "lucide-react";
import { routeAlumniProfile } from "@/features/alumni-approvals/actions/approval-actions";
import type { ReviewableProfileRow } from "@/features/alumni-approvals/lib/types";
import type { BatchRow } from "@/features/school-batch-sections/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type SectionOption = { id: string; name: string };

type Props = {
  profile: ReviewableProfileRow;
  batches: BatchRow[];
  onClose: () => void;
};

const selectCls =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-violet-500 transition focus:border-violet-400 focus:ring-1 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export function RouteAlumniModal({ profile, batches, onClose }: Props) {
  const [selectedBatchId, setSelectedBatchId] = useState(
    profile.batch_id ?? (batches[0]?.id ?? ""),
  );
  const [selectedSectionId, setSelectedSectionId] = useState(
    profile.section_id ?? "",
  );
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  const [state, action, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, fd: FormData) =>
      routeAlumniProfile(fd),
    null,
  );

  // Close on success
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  // Load sections when batch changes
  useEffect(() => {
    if (!selectedBatchId) {
      setSections([]);
      setSelectedSectionId("");
      return;
    }
    setLoadingSections(true);
    setSelectedSectionId("");
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("sections")
      .select("id, name")
      .eq("batch_id", selectedBatchId)
      .order("name")
      .then(({ data }) => {
        setSections((data ?? []) as SectionOption[]);
        setLoadingSections(false);
      });
  }, [selectedBatchId]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus trap ref
  const firstFocusRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  const displayName = profile.display_name?.trim() || "Unnamed alumni";
  const email =
    (profile.users as { email?: string | null } | null)?.email ?? null;

  const sortedBatches = [...batches].sort(
    (a, b) => (b.graduation_year ?? 0) - (a.graduation_year ?? 0),
  );

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Assign batch and section for ${displayName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-stone-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
              <GitBranch className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </span>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-50">
                Route Alumni
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Assign batch &amp; section
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alumni info */}
        <div className="border-b border-stone-100 bg-stone-50/60 px-5 py-3 dark:border-stone-800 dark:bg-stone-900/40">
          <p className="font-medium text-stone-900 dark:text-stone-100">
            {displayName}
          </p>
          {email && (
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {email}
            </p>
          )}
          {profile.headline && (
            <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
              {profile.headline}
            </p>
          )}
        </div>

        {/* Form */}
        <form action={action} className="space-y-4 px-5 py-5">
          <input type="hidden" name="profile_id" value={profile.id} />
          <input type="hidden" name="school_id" value={profile.school_id} />

          {/* Batch */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Batch
              <span className="ml-1 text-red-500">*</span>
            </label>
            <select
              ref={firstFocusRef}
              name="batch_id"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              required
              className={selectCls}
            >
              <option value="" disabled>
                Select batch
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Section
              {loadingSections && (
                <span className="ml-2 text-xs text-stone-400">Loading…</span>
              )}
            </label>
            <select
              name="section_id"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={loadingSections || sections.length === 0}
              className={selectCls}
            >
              <option value="">
                {sections.length === 0 && !loadingSections
                  ? "No sections in this batch"
                  : "No section assigned"}
              </option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {sections.length === 0 && !loadingSections && selectedBatchId && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                This batch has no sections yet. Add sections in the Sections
                admin page first.
              </p>
            )}
          </div>

          {/* Error */}
          {state && !state.ok && (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
              role="alert"
            >
              {state.error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !selectedBatchId}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-medium text-white transition",
                "bg-violet-600 hover:bg-violet-700 active:bg-violet-800",
                "disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
              )}
            >
              {pending ? "Saving…" : "Save Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
