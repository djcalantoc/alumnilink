"use client";

import { Fragment, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { BatchCreateForm } from "@/features/school-batch-sections/components/batch-create-form";
import { BatchRowEditor } from "@/features/school-batch-sections/components/batch-row-editor";
import type { BatchWithCounts, SchoolAdminStats } from "@/features/school-batch-sections/lib/queries";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 25;

type Props = {
  batches: BatchWithCounts[];
  schoolId: string;
  stats: SchoolAdminStats;
};

const STAT_ITEMS = [
  {
    key: "total_batches" as const,
    label: "Total Batches",
    Icon: GraduationCap,
    cls: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400",
  },
  {
    key: "total_sections" as const,
    label: "Total Sections",
    Icon: LayoutGrid,
    cls: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400",
  },
  {
    key: "total_approved_alumni" as const,
    label: "Approved Alumni",
    Icon: Users,
    cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  {
    key: "total_pending_alumni" as const,
    label: "Pending Approval",
    Icon: BookOpen,
    cls: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
  },
];

export function BatchesTable({ batches, schoolId, stats }: Props) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = batches;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          String(b.graduation_year ?? "").includes(q),
      );
    }
    return [...rows].sort((a, b) => {
      const ay = a.graduation_year ?? 0;
      const by = b.graduation_year ?? 0;
      return sortDir === "desc" ? by - ay : ay - by;
    });
  }, [batches, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function toggleSort() {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    setPage(0);
  }

  const btnBase =
    "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1";
  const btnGhost =
    "border-stone-200 bg-white text-stone-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-400";
  const btnPage =
    "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400";

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_ITEMS.map(({ key, label, Icon, cls }) => (
          <div
            key={key}
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-950"
          >
            <div
              className={cn(
                "mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg",
                cls,
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {stats[key]}
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search batches…"
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
          <button
            type="button"
            onClick={() => {
              setShowAdd((v) => !v);
              setEditingId(null);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white hover:bg-violet-700 active:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Batch</span>
          </button>
        </div>

        {/* Inline add form */}
        {showAdd && (
          <div className="border-b border-violet-100 bg-violet-50/60 px-4 py-4 dark:border-violet-900/30 dark:bg-violet-950/20">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-300">
                New batch
              </p>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <BatchCreateForm schoolId={schoolId} compact />
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/40">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Batch Name
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100"
                  >
                    Grad Year
                    {sortDir === "desc" ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Sections
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
                    {search
                      ? `No batches match "${search}"`
                      : "No batches yet — click Add Batch above to get started."}
                  </td>
                </tr>
              ) : (
                paged.map((batch) => (
                  <Fragment key={batch.id}>
                    <tr
                      className={cn(
                        "group border-b border-stone-100 transition-colors last:border-0 hover:bg-violet-50/40 dark:border-stone-800/60 dark:hover:bg-violet-950/20",
                        editingId === batch.id &&
                          "bg-violet-50/60 dark:bg-violet-950/30",
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                        {batch.name}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-stone-600 dark:text-stone-400">
                        {batch.graduation_year ?? (
                          <span className="text-stone-300 dark:text-stone-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
                        {batch.section_count > 0 ? (
                          batch.section_count
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-400 dark:bg-stone-800 dark:text-stone-500">
                            None
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-stone-600 dark:text-stone-400">
                        {batch.alumni_count > 0 ? (
                          batch.alumni_count
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
                              id === batch.id ? null : batch.id,
                            )
                          }
                          className={cn(btnBase, btnGhost)}
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {editingId === batch.id ? "Close" : "Edit"}
                          </span>
                        </button>
                      </td>
                    </tr>

                    {editingId === batch.id && (
                      <tr className="bg-violet-50/40 dark:bg-violet-950/20">
                        <td
                          colSpan={5}
                          className="border-b border-violet-100 px-4 py-4 dark:border-violet-900/30"
                        >
                          <BatchRowEditor
                            batch={batch}
                            schoolId={schoolId}
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
              {filtered.length} batches · page {safePage + 1} of {totalPages}
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
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={safePage >= totalPages - 1}
                className={cn(btnBase, btnPage)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
