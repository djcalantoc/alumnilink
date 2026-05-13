"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  GitBranch,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  approveSingleAlumni,
  bulkApproveAlumni,
  bulkRejectAlumni,
  deleteAlumniProfile,
  rejectSingleAlumni,
} from "@/features/alumni-management/actions/alumni-management-actions";
import type {
  AlumniRecord,
  PaginatedAlumni,
} from "@/features/alumni-management/lib/types";
import type { BatchRow, SectionRow } from "@/features/school-batch-sections/lib/queries";
import { RouteAlumniModal } from "@/features/alumni-approvals/components/route-alumni-modal";
import { AlumniProfileModal } from "@/features/alumni-management/components/alumni-profile-modal";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { cn } from "@/lib/cn";

type Props = {
  schoolId: string;
  data: PaginatedAlumni;
  batches: BatchRow[];
  sections: SectionRow[];
};

type SortKey = "name" | "date" | "batch";

/* ─── Status badge ─────────────────────────────────────────────────────── */
function StatusBadge({ status, sectionId }: { status: string; sectionId: string | null }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
        <XCircle className="h-3 w-3" />
        Rejected
      </span>
    );
  if (status === "pending" && !sectionId)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
        <GitBranch className="h-3 w-3" />
        Needs Routing
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
      {status}
    </span>
  );
}

/* ─── CSV export ───────────────────────────────────────────────────────── */
function exportCSV(rows: AlumniRecord[], filename = "alumni-export.csv") {
  const header = [
    "Name",
    "Email",
    "Batch",
    "Graduation Year",
    "Section",
    "Status",
    "City",
    "Country",
    "Social URL",
    "Date Registered",
  ].join(",");

  const esc = (v: string | null | undefined) =>
    `"${(v ?? "").replace(/"/g, '""')}"`;

  const lines = rows.map((r) =>
    [
      esc(r.display_name),
      esc((r.users as { email?: string | null } | null)?.email),
      esc(r.batches?.name),
      r.batches?.graduation_year ?? "",
      esc(r.sections?.name),
      esc(r.status),
      esc(r.location_city),
      esc(r.location_country),
      esc(r.social_url),
      esc(r.created_at.slice(0, 10)),
    ].join(","),
  );

  const blob = new Blob([[header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Main component ───────────────────────────────────────────────────── */
export function AlumniTable({ schoolId, data, batches, sections }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /* Selections */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allPageIds = useMemo(() => data.rows.map((r) => r.id), [data.rows]);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  /* Modals */
  const [profileModal, setProfileModal] = useState<AlumniRecord | null>(null);
  const [routeModal, setRouteModal] = useState<AlumniRecord | null>(null);

  /* Action feedback */
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(type: "ok" | "err", text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  /* Search form state */
  const [searchInput, setSearchInput] = useState(sp.get("search") ?? "");

  /* ── URL navigation helpers ── */
  const pushParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const p = new URLSearchParams(sp.toString());
      p.set("schoolId", schoolId);
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      p.delete("page"); // reset pagination on filter/sort change
      startTransition(() => router.push(`/school-admin/alumni?${p.toString()}`));
    },
    [sp, schoolId, router],
  );

  const pushPage = useCallback(
    (page: number) => {
      const p = new URLSearchParams(sp.toString());
      p.set("schoolId", schoolId);
      p.set("page", String(page));
      startTransition(() => router.push(`/school-admin/alumni?${p.toString()}`));
    },
    [sp, schoolId, router],
  );

  const currentSort = (sp.get("sortBy") ?? "") as SortKey | "";
  const currentDir = sp.get("sortDir") ?? "desc";

  function handleSort(key: SortKey) {
    if (currentSort === key) {
      pushParams({ sortBy: key, sortDir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sortBy: key, sortDir: "asc" });
    }
  }

  function SortIcon({ colKey }: { colKey: SortKey }) {
    if (currentSort !== colKey)
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-stone-400" />;
    return currentDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-violet-600" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-violet-600" />
    );
  }

  /* ── Row action helpers ── */
  function runAction(
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    extra: Record<string, string>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("school_id", schoolId);
      for (const [k, v] of Object.entries(extra)) fd.append(k, v);
      const r = await action(fd);
      if (r.ok) {
        showToast("ok", successMsg);
        router.refresh();
      } else {
        showToast("err", (r as { ok: false; error: string }).error);
      }
    });
  }

  /* ── Bulk action helpers ── */
  function runBulk(
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    successMsg: string,
  ) {
    const ids = [...selected];
    startTransition(async () => {
      const fd = new FormData();
      fd.append("school_id", schoolId);
      ids.forEach((id) => fd.append("profile_ids[]", id));
      const r = await action(fd);
      if (r.ok) {
        showToast("ok", successMsg);
        setSelected(new Set());
        router.refresh();
      } else {
        showToast("err", (r as { ok: false; error: string }).error);
      }
    });
  }

  const thCls =
    "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 whitespace-nowrap";
  const btnBase =
    "inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

  const sectionOptions = useMemo(
    () => sections.filter((s) => s.batch_id === (routeModal?.batch_id ?? "")),
    [sections, routeModal],
  );
  void sectionOptions;

  return (
    <>
      {/* Modals */}
      {profileModal && (
        <AlumniProfileModal
          profile={profileModal}
          onClose={() => setProfileModal(null)}
        />
      )}
      {routeModal && (
        <RouteAlumniModal
          profile={routeModal as Parameters<typeof RouteAlumniModal>[0]["profile"]}
          batches={batches as Parameters<typeof RouteAlumniModal>[0]["batches"]}
          onClose={() => {
            setRouteModal(null);
            router.refresh();
          }}
        />
      )}

      <div className="space-y-4">
        {/* ── Filters bar ── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 sm:flex-row sm:flex-wrap sm:items-end">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                pushParams({ search: searchInput || undefined });
              }}
            >
              <input
                type="search"
                placeholder="Search by name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none transition focus:border-violet-400 focus:ring-1 focus:ring-violet-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
            </form>
          </div>

          {/* Status filter */}
          <label className="block min-w-[140px]">
            <span className="mb-1 block text-xs font-medium text-stone-500">
              Status
            </span>
            <select
              value={sp.get("status") ?? ""}
              onChange={(e) => pushParams({ status: e.target.value || undefined })}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          {/* Batch filter */}
          <label className="block min-w-[160px]">
            <span className="mb-1 block text-xs font-medium text-stone-500">
              Batch
            </span>
            <select
              value={sp.get("batchId") ?? ""}
              onChange={(e) =>
                pushParams({ batchId: e.target.value || undefined, sectionId: undefined })
              }
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            >
              <option value="">All batches</option>
              {[...batches]
                .sort((a, b) => (b.graduation_year ?? 0) - (a.graduation_year ?? 0))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
                  </option>
                ))}
            </select>
          </label>

          {/* Section filter */}
          {sp.get("batchId") && (
            <label className="block min-w-[140px]">
              <span className="mb-1 block text-xs font-medium text-stone-500">
                Section
              </span>
              <select
                value={sp.get("sectionId") ?? ""}
                onChange={(e) => pushParams({ sectionId: e.target.value || undefined })}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              >
                <option value="">All sections</option>
                {sections
                  .filter((s) => s.batch_id === sp.get("batchId"))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {/* Clear filters */}
          {(sp.get("search") ||
            sp.get("status") ||
            sp.get("batchId") ||
            sp.get("sectionId")) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                pushParams({
                  search: undefined,
                  status: undefined,
                  batchId: undefined,
                  sectionId: undefined,
                });
              }}
              className="self-end rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Table card ── */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
          {/* Bulk actions bar */}
          {someSelected && (
            <div className="flex flex-wrap items-center gap-2 border-b border-violet-100 bg-violet-50/60 px-4 py-2.5 dark:border-violet-900/30 dark:bg-violet-950/20">
              <span className="text-sm font-medium text-violet-800 dark:text-violet-300">
                {selected.size} selected
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => runBulk(bulkApproveAlumni, `Approved ${selected.size} alumni`)}
                className={cn(
                  btnBase,
                  "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 disabled:opacity-50",
                )}
              >
                <ThumbsUp className="h-3 w-3" />
                Approve all
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => runBulk(bulkRejectAlumni, `Rejected ${selected.size} alumni`)}
                className={cn(
                  btnBase,
                  "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-500 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 disabled:opacity-50",
                )}
              >
                <ThumbsDown className="h-3 w-3" />
                Reject all
              </button>
              <button
                type="button"
                onClick={() => exportCSV(data.rows.filter((r) => selected.has(r.id)))}
                className={cn(
                  btnBase,
                  "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300",
                )}
              >
                <Download className="h-3 w-3" />
                Export selected CSV
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-auto text-xs text-stone-400 hover:text-stone-600 dark:text-stone-500"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div
              role="status"
              className={cn(
                "border-b px-4 py-2.5 text-sm",
                toast.type === "ok"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-red-100 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400",
              )}
            >
              {toast.text}
            </div>
          )}

          {/* Table header row: result count + export all */}
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5 dark:border-stone-800">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {data.totalCount.toLocaleString()} alumni
              {isPending && (
                <span className="ml-2 animate-pulse text-stone-300">
                  loading…
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => exportCSV(data.rows, "alumni-page-export.csv")}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-900"
            >
              <Download className="h-3.5 w-3.5" />
              Export page CSV
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/40">
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? new Set(allPageIds) : new Set(),
                        )
                      }
                      className="rounded border-stone-300 text-violet-600 focus:ring-violet-500"
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th className={thCls}>Alumni</th>
                  <th className={thCls}>
                    <button
                      type="button"
                      onClick={() => handleSort("batch")}
                      className="hover:text-stone-800 dark:hover:text-stone-200"
                    >
                      Batch
                      <SortIcon colKey="batch" />
                    </button>
                  </th>
                  <th className={thCls}>Section</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="hover:text-stone-800 dark:hover:text-stone-200"
                    >
                      Registered
                      <SortIcon colKey="date" />
                    </button>
                  </th>
                  <th
                    className={`${thCls} text-right`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-sm text-stone-400 dark:text-stone-500"
                    >
                      No alumni found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => {
                    const email =
                      (row.users as { email?: string | null } | null)?.email ?? null;
                    const isSel = selected.has(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-stone-100 transition-colors last:border-0 dark:border-stone-800/60",
                          isSel
                            ? "bg-violet-50/60 dark:bg-violet-950/20"
                            : "hover:bg-stone-50/60 dark:hover:bg-stone-900/30",
                        )}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={(e) => {
                              const next = new Set(selected);
                              e.target.checked
                                ? next.add(row.id)
                                : next.delete(row.id);
                              setSelected(next);
                            }}
                            className="rounded border-stone-300 text-violet-600 focus:ring-violet-500"
                          />
                        </td>

                        {/* Alumni info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <SafeImage
                              src={row.photo_url}
                              fallback={<DefaultAvatar />}
                              alt={row.display_name ?? ""}
                              className="size-9 shrink-0 rounded-xl"
                              imgClassName="object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-stone-900 dark:text-stone-100">
                                {row.display_name?.trim() || "Unnamed"}
                              </p>
                              {email && (
                                <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                                  {email}
                                </p>
                              )}
                              {row.location_city && (
                                <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                                  {row.location_city}
                                  {row.location_country
                                    ? `, ${row.location_country}`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Batch */}
                        <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
                          {row.batches ? (
                            <>
                              <span className="font-medium">{row.batches.name}</span>
                              {row.batches.graduation_year != null && (
                                <span className="ml-1 text-xs text-stone-400">
                                  ({row.batches.graduation_year})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>

                        {/* Section */}
                        <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                          {row.sections?.name ?? (
                            <span className="text-stone-300 dark:text-stone-600">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} sectionId={row.section_id} />
                        </td>

                        {/* Registered */}
                        <td className="px-4 py-3 text-xs text-stone-400 dark:text-stone-500">
                          {new Date(row.created_at).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => setProfileModal(row)}
                              title="View profile"
                              className={cn(
                                btnBase,
                                "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 focus-visible:ring-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400",
                              )}
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden sm:inline">View</span>
                            </button>

                            {row.status === "pending" && (
                              <>
                                {/* Route */}
                                <button
                                  type="button"
                                  onClick={() => setRouteModal(row)}
                                  title="Assign batch/section"
                                  className={cn(
                                    btnBase,
                                    "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 focus-visible:ring-violet-500 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400",
                                  )}
                                >
                                  <GitBranch className="h-3 w-3" />
                                  <span className="hidden lg:inline">Route</span>
                                </button>

                                {/* Approve */}
                                {row.section_id ? (
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() =>
                                      runAction(
                                        approveSingleAlumni,
                                        { profile_id: row.id },
                                        "Alumni approved.",
                                      )
                                    }
                                    className={cn(
                                      btnBase,
                                      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 disabled:opacity-50",
                                    )}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    <span className="hidden lg:inline">Approve</span>
                                  </button>
                                ) : (
                                  <span
                                    title="Assign a section first"
                                    className={cn(
                                      btnBase,
                                      "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 dark:border-stone-700 dark:bg-stone-800",
                                    )}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </span>
                                )}

                                {/* Reject */}
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    runAction(
                                      rejectSingleAlumni,
                                      { profile_id: row.id },
                                      "Alumni rejected.",
                                    )
                                  }
                                  className={cn(
                                    btnBase,
                                    "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-500 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 disabled:opacity-50",
                                  )}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                  <span className="hidden lg:inline">Reject</span>
                                </button>
                              </>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete ${row.display_name ?? "this alumni"}'s profile? This cannot be undone.`,
                                  )
                                ) {
                                  runAction(
                                    deleteAlumniProfile,
                                    { profile_id: row.id },
                                    "Profile deleted.",
                                  );
                                }
                              }}
                              title="Delete profile"
                              className={cn(
                                btnBase,
                                "border-stone-200 bg-white text-stone-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-stone-700 dark:bg-stone-900 disabled:opacity-40",
                              )}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 dark:border-stone-800">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Page {data.page} of {data.totalPages} &middot;{" "}
                {data.totalCount.toLocaleString()} total
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={data.page <= 1 || isPending}
                  onClick={() => pushPage(data.page - 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {/* Page number pills */}
                {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={isPending}
                      onClick={() => pushPage(p)}
                      className={cn(
                        "inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors",
                        p === data.page
                          ? "bg-violet-600 text-white"
                          : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={data.page >= data.totalPages || isPending}
                  onClick={() => pushPage(data.page + 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
