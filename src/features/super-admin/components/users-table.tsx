"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { deleteUserAlumniProfiles } from "@/features/super-admin/actions/admin-actions";
import type { UserRow } from "@/features/super-admin/lib/types";
import { cn } from "@/lib/cn";

type PaginatedData = {
  rows: UserRow[];
  totalCount: number;
  page: number;
  totalPages: number;
};

type Props = { data: PaginatedData };

function exportCSV(rows: UserRow[]) {
  const header = ["Name", "Email", "Alumni Profiles", "Admin Roles", "Registered"].join(",");
  const esc = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      esc(r.full_name),
      esc(r.email),
      r.alumni_count,
      esc(r.school_admin_roles.map((a) => `${a.school_name}(${a.role})`).join("; ")),
      esc(r.created_at.slice(0, 10)),
    ].join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "users-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function UsersTable({ data }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(sp.get("search") ?? "");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function pushPage(page: number) {
    const p = new URLSearchParams(sp.toString());
    p.set("page", String(page));
    startTransition(() => router.push(`/admin/users?${p.toString()}`));
  }

  function pushSearch() {
    const p = new URLSearchParams(sp.toString());
    if (searchInput.trim()) p.set("search", searchInput.trim());
    else p.delete("search");
    p.delete("page");
    startTransition(() => router.push(`/admin/users?${p.toString()}`));
  }

  function handleDelete(userId: string, name: string | null) {
    if (!confirm(`Delete all alumni profiles for ${name ?? userId}? This cannot be undone.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("user_id", userId);
      const r = await deleteUserAlumniProfiles(fd);
      if (r.ok) {
        setToast({ type: "ok", text: "Alumni profiles deleted." });
        router.refresh();
      } else {
        setToast({ type: "err", text: (r as { ok: false; error: string }).error });
      }
    });
  }

  const thCls = "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 whitespace-nowrap";

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => { e.preventDefault(); pushSearch(); }}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </form>
        <button
          type="button"
          onClick={() => exportCSV(data.rows)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
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
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {data.totalCount.toLocaleString()} users
            {isPending && <span className="ml-2 animate-pulse text-stone-300">loading…</span>}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/40">
                <th className={thCls}>User</th>
                <th className={thCls}>Alumni Profiles</th>
                <th className={thCls}>Admin Roles</th>
                <th className={thCls}>Registered</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <User className="mx-auto mb-2 h-8 w-8 text-stone-300 dark:text-stone-600" />
                    <p className="text-sm text-stone-400 dark:text-stone-500">
                      No users found.
                    </p>
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/60 dark:border-stone-800/60 dark:hover:bg-stone-900/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        {row.full_name?.trim() || "—"}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        {row.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {row.alumni_count > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          {row.alumni_count} school{row.alumni_count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.school_admin_roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.school_admin_roles.slice(0, 2).map((a, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                            >
                              <Shield className="h-2.5 w-2.5" />
                              {a.role}
                            </span>
                          ))}
                          {row.school_admin_roles.length > 2 && (
                            <span className="text-xs text-stone-400">
                              +{row.school_admin_roles.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">Member</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400 dark:text-stone-500">
                      {new Date(row.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.alumni_count > 0 && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(row.id, row.full_name)}
                          title="Delete alumni profiles"
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Del profiles</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 dark:border-stone-800">
            <p className="text-xs text-stone-400">Page {data.page} of {data.totalPages}</p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={data.page <= 1 || isPending} onClick={() => pushPage(data.page - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} type="button" disabled={isPending} onClick={() => pushPage(p)}
                    className={cn("inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-medium", p === data.page ? "bg-violet-600 text-white" : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400")}>
                    {p}
                  </button>
                );
              })}
              <button type="button" disabled={data.page >= data.totalPages || isPending} onClick={() => pushPage(data.page + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
