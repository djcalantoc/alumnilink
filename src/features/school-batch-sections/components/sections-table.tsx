"use client";

import { Fragment, useMemo, useState } from "react";
import {
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { SectionCreateForm } from "@/features/school-batch-sections/components/section-create-form";
import { SectionRowEditor } from "@/features/school-batch-sections/components/section-row-editor";
import type {
  BatchRow,
  SectionWithBatch,
} from "@/features/school-batch-sections/lib/queries";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 30;

type Props = {
  sections: SectionWithBatch[];
  batches: BatchRow[];
  schoolId: string;
};

export function SectionsTable({ sections, batches, schoolId }: Props) {
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = sections;
    if (batchFilter) {
      rows = rows.filter((s) => s.batch_id === batchFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.batch_name.toLowerCase().includes(q) ||
          String(s.batch_graduation_year ?? "").includes(q),
      );
    }
    return [...rows].sort((a, b) => {
      const ay = a.batch_graduation_year ?? 0;
      const by = b.batch_graduation_year ?? 0;
      if (ay !== by) return by - ay;
      return a.name.localeCompare(b.name);
    });
  }, [sections, search, batchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const hasFilters = Boolean(search || batchFilter);

  function clearFilters() {
    setSearch("");
    setBatchFilter("");
    setPage(0);
  }

  const btnBase =
    "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1";
  const btnGhost =
    "border-stone-200 bg-white text-stone-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-400";
  const btnPage =
    "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400";

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search sections…"
            className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-8 text-sm outline-none ring-violet-500 transition focus:border-violet-400 focus:ring-1 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(0);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Batch filter */}
        {batches.length > 0 && (
          <select
            value={batchFilter}
            onChange={(e) => {
              setBatchFilter(e.target.value);
              setPage(0);
            }}
            className="h-8 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 outline-none ring-violet-500 transition focus:border-violet-400 focus:ring-1 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
          >
            <option value="">All batches</option>
            {[...batches]
              .sort(
                (a, b) =>
                  (b.graduation_year ?? 0) - (a.graduation_year ?? 0),
              )
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
                </option>
              ))}
          </select>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className={cn(btnBase, "border-stone-200 bg-white text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400")}
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        {/* Add Section button */}
        <button
          type="button"
          onClick={() => {
            setShowAdd((v) => !v);
            setEditingId(null);
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white hover:bg-violet-700 active:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Inline add form */}
      {showAdd && (
        <div className="border-b border-violet-100 bg-violet-50/60 px-4 py-4 dark:border-violet-900/30 dark:bg-violet-950/20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-300">
              New section
            </p>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SectionCreateForm
            schoolId={schoolId}
            batches={batches}
            compact
            defaultBatchId={batchFilter || undefined}
          />
        </div>
      )}

      {/* Summary row */}
      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-4 py-2 dark:border-stone-800 dark:bg-stone-900/30">
        <LayoutGrid className="h-3.5 w-3.5 text-stone-400" />
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {filtered.length}{" "}
          {filtered.length === 1 ? "section" : "sections"}
          {hasFilters ? " (filtered)" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/40">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Section
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Batch
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Grad Year
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Alumni
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-14 text-center text-sm text-stone-400 dark:text-stone-500"
                >
                  {hasFilters
                    ? "No sections match your filters."
                    : batches.length === 0
                      ? "Create a batch first, then add sections."
                      : "No sections yet — click Add Section above."}
                </td>
              </tr>
            ) : (
              paged.map((section) => (
                <Fragment key={section.id}>
                  <tr
                    className={cn(
                      "group border-b border-stone-100 transition-colors last:border-0 hover:bg-violet-50/40 dark:border-stone-800/60 dark:hover:bg-violet-950/20",
                      editingId === section.id &&
                        "bg-violet-50/60 dark:bg-violet-950/30",
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                      {section.name}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {section.batch_name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
                      {section.batch_graduation_year ?? (
                        <span className="text-stone-300 dark:text-stone-600">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
                      {section.alumni_count > 0 ? (
                        section.alumni_count
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-400 dark:bg-stone-800 dark:text-stone-500">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingId((id) =>
                            id === section.id ? null : section.id,
                          )
                        }
                        className={cn(btnBase, btnGhost)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {editingId === section.id ? "Close" : "Edit"}
                        </span>
                      </button>
                    </td>
                  </tr>

                  {editingId === section.id && (
                    <tr className="bg-violet-50/40 dark:bg-violet-950/20">
                      <td
                        colSpan={5}
                        className="border-b border-violet-100 px-4 py-4 dark:border-violet-900/30"
                      >
                        <SectionRowEditor
                          section={section}
                          schoolId={schoolId}
                          batches={batches}
                          onDone={() => setEditingId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {filtered.length} sections · page {safePage + 1} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className={cn(btnBase, btnPage)}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className={cn(btnBase, btnPage)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
