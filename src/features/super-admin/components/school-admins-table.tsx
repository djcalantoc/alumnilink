"use client";

import { useEffect, useRef, useActionState, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  UserPlus,
  X,
} from "lucide-react";
import {
  assignSchoolAdmin,
  changeAdminRole,
  removeSchoolAdmin,
} from "@/features/super-admin/actions/admin-actions";
import type { SchoolAdminRow } from "@/features/super-admin/lib/types";
import { cn } from "@/lib/cn";

type SchoolOption = { id: string; name: string };
type UserOption = { id: string; email: string | null; full_name: string | null };

type PaginatedData = {
  rows: SchoolAdminRow[];
  totalCount: number;
  page: number;
  totalPages: number;
};

type Props = {
  data: PaginatedData;
  schools: SchoolOption[];
  users: UserOption[];
};

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  admin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  moderator: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
};

/* ─── Assign Admin Modal ──────────────────────────────────────────────── */
function AssignAdminModal({
  schools,
  users,
  onClose,
}: {
  schools: SchoolOption[];
  users: UserOption[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    async (_: unknown, fd: FormData) => assignSchoolAdmin(fd),
    null,
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) { onClose(); router.refresh(); }
  }, [state, onClose, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-stone-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-600" />
            <p className="font-semibold text-stone-900 dark:text-stone-50">Assign School Admin</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={action} className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              User <span className="text-red-500">*</span>
            </label>
            <select name="user_id" required
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
              <option value="">Select user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name?.trim() || u.email || u.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              School <span className="text-red-500">*</span>
            </label>
            <select name="school_id" required
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
              <option value="">Select school…</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">Role</label>
            <select name="role" defaultValue="admin"
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          {state && !state.ok && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400" role="alert">
              {(state as { ok: false; error: string }).error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              Cancel
            </button>
            <button type="submit" disabled={pending}
              className="inline-flex h-9 items-center rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {pending ? "Assigning…" : "Assign Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Main table ─────────────────────────────────────────────────────── */
export function SchoolAdminsTable({ data, schools, users }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(sp.get("search") ?? "");
  const [showAssign, setShowAssign] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(type: "ok" | "err", text: string) {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ type, text });
    toastRef.current = setTimeout(() => setToast(null), 4000);
  }

  function pushPage(page: number) {
    const p = new URLSearchParams(sp.toString());
    p.set("page", String(page));
    startTransition(() => router.push(`/admin/school-admins?${p.toString()}`));
  }

  function pushSearch() {
    const p = new URLSearchParams(sp.toString());
    if (searchInput.trim()) p.set("search", searchInput.trim());
    else p.delete("search");
    p.delete("page");
    startTransition(() => router.push(`/admin/school-admins?${p.toString()}`));
  }

  function handleRemove(adminId: string, name: string | null) {
    if (!confirm(`Remove ${name ?? "this admin"} from the school?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("admin_id", adminId);
      const r = await removeSchoolAdmin(fd);
      if (r.ok) { showToast("ok", "Admin removed."); router.refresh(); }
      else showToast("err", (r as { ok: false; error: string }).error);
    });
  }

  function handleRoleChange(adminId: string, role: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("admin_id", adminId);
      fd.append("role", role);
      const r = await changeAdminRole(fd);
      if (r.ok) { showToast("ok", "Role updated."); router.refresh(); }
      else showToast("err", (r as { ok: false; error: string }).error);
    });
  }

  const thCls = "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 whitespace-nowrap";

  return (
    <>
      {showAssign && (
        <AssignAdminModal
          schools={schools}
          users={users}
          onClose={() => setShowAssign(false)}
        />
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 sm:flex-row sm:items-center">
          <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); pushSearch(); }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input type="search" placeholder="Search by name, email, or school…" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100" />
          </form>
          <button type="button" onClick={() => setShowAssign(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
            <UserPlus className="h-4 w-4" />
            Assign Admin
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
          {toast && (
            <div role="status" className={cn("border-b px-4 py-2.5 text-sm",
              toast.type === "ok" ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "border-red-100 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400")}>
              {toast.text}
            </div>
          )}
          <div className="border-b border-stone-100 px-4 py-2.5 dark:border-stone-800">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {data.totalCount.toLocaleString()} school admin assignments
              {isPending && <span className="ml-2 animate-pulse text-stone-300">loading…</span>}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/40">
                  <th className={thCls}>Admin</th>
                  <th className={thCls}>School</th>
                  <th className={thCls}>Role</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Assigned</th>
                  <th className={`${thCls} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Shield className="mx-auto mb-2 h-8 w-8 text-stone-300 dark:text-stone-600" />
                      <p className="text-sm text-stone-400 dark:text-stone-500">No school admins found.</p>
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={row.id} className="border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/60 dark:border-stone-800/60 dark:hover:bg-stone-900/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                          {row.user_name?.trim() || "—"}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          {row.user_email ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-stone-700 dark:text-stone-300">
                        {row.school_name}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={row.role}
                          disabled={isPending}
                          onChange={(e) => handleRoleChange(row.id, e.target.value)}
                          className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold outline-none border-0 cursor-pointer", ROLE_BADGE[row.role] ?? "bg-stone-100 text-stone-600")}
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          row.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400 dark:text-stone-500">
                        {new Date(row.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" disabled={isPending}
                          onClick={() => handleRemove(row.id, row.user_name)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                      className={cn("inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-medium",
                        p === data.page ? "bg-violet-600 text-white" : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400")}>
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
    </>
  );
}
