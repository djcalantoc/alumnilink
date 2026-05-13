"use client";

import { useEffect, useRef, useActionState, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Shield,
  UserPlus,
  X,
} from "lucide-react";
import {
  addSchoolTeamMember,
  changeTeamMemberRole,
  removeTeamMember,
} from "@/features/school-admin-team/actions/team-actions";
import { cn } from "@/lib/cn";

export type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
  is_self: boolean;
};

export type AlumniOption = {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
};

type Props = {
  schoolId: string;
  schoolName: string;
  members: TeamMember[];
  alumni: AlumniOption[];
  isOwner: boolean;
};

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  admin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  moderator: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
};

/* ─── Add member modal ────────────────────────────────────────────────── */
function AddMemberModal({
  schoolId,
  alumni,
  onClose,
}: {
  schoolId: string;
  alumni: AlumniOption[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    async (_: unknown, fd: FormData) => addSchoolTeamMember(fd),
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
            <UserPlus className="h-4 w-4 text-violet-600" />
            <p className="font-semibold text-stone-900 dark:text-stone-50">Add Team Member</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={action} className="space-y-4 px-5 py-5">
          <input type="hidden" name="school_id" value={schoolId} />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              Approved Alumni <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-stone-400">
              Only approved alumni of this school can be added as team members.
            </p>
            {alumni.length === 0 ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                No approved alumni available to promote. Approve alumni profiles first.
              </p>
            ) : (
              <select name="user_id" required
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
                <option value="">Select an alumni member…</option>
                {alumni.map((a) => (
                  <option key={a.user_id} value={a.user_id}>
                    {a.user_name?.trim() || a.user_email || a.user_id.slice(0, 8)}
                    {a.user_email ? ` — ${a.user_email}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">Role</label>
            <select name="role" defaultValue="admin"
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
              <option value="admin">Admin — can manage alumni, batches, events</option>
              <option value="moderator">Moderator — can approve alumni, moderate content</option>
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
            <button type="submit" disabled={pending || alumni.length === 0}
              className="inline-flex h-9 items-center rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {pending ? "Adding…" : "Add to Team"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Main manager component ──────────────────────────────────────────── */
export function SchoolTeamManager({
  schoolId,
  schoolName,
  members,
  alumni,
  isOwner,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(type: "ok" | "err", text: string) {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ type, text });
    toastRef.current = setTimeout(() => setToast(null), 4000);
  }

  function handleRemove(adminId: string, name: string | null) {
    if (!confirm(`Remove ${name ?? "this member"} from the team?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("school_id", schoolId);
      fd.append("admin_id", adminId);
      const r = await removeTeamMember(fd);
      if (r.ok) { showToast("ok", "Member removed."); router.refresh(); }
      else showToast("err", (r as { ok: false; error: string }).error);
    });
  }

  function handleRoleChange(adminId: string, role: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("school_id", schoolId);
      fd.append("admin_id", adminId);
      fd.append("role", role);
      const r = await changeTeamMemberRole(fd);
      if (r.ok) { showToast("ok", "Role updated."); router.refresh(); }
      else showToast("err", (r as { ok: false; error: string }).error);
    });
  }

  const thCls = "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 whitespace-nowrap";

  return (
    <>
      {showAdd && (
        <AddMemberModal
          schoolId={schoolId}
          alumni={alumni}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="space-y-4">
        {/* Header card */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-stone-900 dark:text-stone-50">
                Admin team for {schoolName}
              </h2>
              <p className="mt-0.5 text-sm text-stone-400">
                {members.length} member{members.length !== 1 ? "s" : ""} with admin access.
                {!isOwner && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    Only owners can add or remove members.
                  </span>
                )}
              </p>
            </div>
            {isOwner && (
              <button type="button" onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 shrink-0">
                <UserPlus className="h-4 w-4" />
                Add Team Member
              </button>
            )}
          </div>
        </div>

        {/* Roles explainer */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { role: "Owner", color: "bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/40", desc: "Full control. Can manage team, approve alumni, edit all school settings." },
            { role: "Admin", color: "bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40", desc: "Can manage alumni, batches, sections, events, and memories." },
            { role: "Moderator", color: "bg-teal-50 border-teal-100 dark:bg-teal-950/30 dark:border-teal-900/40", desc: "Can approve alumni and moderate content. Cannot edit school settings." },
          ].map(({ role, color, desc }) => (
            <div key={role} className={cn("rounded-xl border px-4 py-3 text-sm", color)}>
              <p className="font-semibold text-stone-800 dark:text-stone-100">{role}</p>
              <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{desc}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
          {toast && (
            <div role="status" className={cn("border-b px-4 py-2.5 text-sm",
              toast.type === "ok"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "border-red-100 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400")}>
              {toast.text}
            </div>
          )}

          {members.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-stone-300 dark:text-stone-600" />
              <p className="text-sm text-stone-400 dark:text-stone-500">No team members yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/40">
                    <th className={thCls}>Member</th>
                    <th className={thCls}>Role</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Assigned</th>
                    {isOwner && <th className={`${thCls} text-right`}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 dark:border-stone-800/60 dark:hover:bg-stone-900/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                            {(m.user_name?.[0] ?? m.user_email?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900 dark:text-stone-100">
                              {m.user_name?.trim() || "—"}
                              {m.is_self && (
                                <span className="ml-1.5 text-xs font-normal text-stone-400">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-stone-400 dark:text-stone-500">{m.user_email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isOwner && !m.is_self ? (
                          <select
                            defaultValue={m.role}
                            disabled={isPending}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold border-0 outline-none cursor-pointer", ROLE_BADGE[m.role] ?? "bg-stone-100 text-stone-600")}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                          </select>
                        ) : (
                          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", ROLE_BADGE[m.role] ?? "bg-stone-100 text-stone-600")}>
                            {ROLE_LABELS[m.role] ?? m.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          m.status === "approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400 dark:text-stone-500">
                        {new Date(m.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3 text-right">
                          {!m.is_self && (
                            <button type="button" disabled={isPending}
                              onClick={() => handleRemove(m.id, m.user_name)}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900">
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
