"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitBranch,
  ThumbsDown,
  ThumbsUp,
  Users,
  XCircle,
} from "lucide-react";
import {
  approveAlumniProfile,
  rejectAlumniProfile,
} from "@/features/alumni-approvals/actions/approval-actions";
import type {
  ApprovalsStats,
  ReviewableProfileRow,
} from "@/features/alumni-approvals/lib/types";
import { getRoutingStatus } from "@/features/alumni-approvals/lib/types";
import type { BatchRow } from "@/features/school-batch-sections/lib/queries";
import { RouteAlumniModal } from "@/features/alumni-approvals/components/route-alumni-modal";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { cn } from "@/lib/cn";

type TabKey = "pending" | "needs_routing" | "ready" | "approved" | "rejected";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "All Pending" },
  { key: "needs_routing", label: "Needs Routing" },
  { key: "ready", label: "Ready" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

type Props = {
  schoolId: string;
  profiles: ReviewableProfileRow[];
  batches: BatchRow[];
  stats: ApprovalsStats;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const STAT_CARDS = [
  {
    key: "total_pending" as const,
    label: "Total Pending",
    Icon: Clock,
    cls: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
  },
  {
    key: "needs_routing" as const,
    label: "Needs Routing",
    Icon: GitBranch,
    cls: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400",
  },
  {
    key: "ready_for_approval" as const,
    label: "Ready to Approve",
    Icon: CheckCircle2,
    cls: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400",
  },
  {
    key: "total_approved" as const,
    label: "Approved Alumni",
    Icon: Users,
    cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
];

export function AlumniApprovalsList({
  schoolId,
  profiles,
  batches,
  stats,
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [routingProfile, setRoutingProfile] =
    useState<ReviewableProfileRow | null>(null);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "needs_routing":
        return profiles.filter(
          (p) => p.status === "pending" && !p.section_id,
        );
      case "ready":
        return profiles.filter(
          (p) => p.status === "pending" && Boolean(p.section_id),
        );
      case "approved":
        return profiles.filter((p) => p.status === "approved");
      case "rejected":
        return profiles.filter((p) => p.status === "rejected");
      case "pending":
      default:
        return profiles.filter((p) => p.status === "pending");
    }
  }, [profiles, activeTab]);

  function run(
    action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
    profileId: string,
  ) {
    setMsg(null);
    setBusyId(profileId);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("profile_id", profileId);
      fd.append("school_id", schoolId);
      const r = await action(fd);
      setBusyId(null);
      if (r.ok) {
        setMsg({ type: "ok", text: "Profile updated." });
        router.refresh();
      } else {
        setMsg({ type: "err", text: r.error });
      }
    });
  }

  const btnBase =
    "inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

  return (
    <>
      {/* Route modal */}
      {routingProfile && (
        <RouteAlumniModal
          profile={routingProfile}
          batches={batches}
          onClose={() => {
            setRoutingProfile(null);
            router.refresh();
          }}
        />
      )}

      <div className="space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STAT_CARDS.map(({ key, label, Icon, cls }) => (
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
          {/* Status tabs */}
          <div className="flex items-center gap-0 overflow-x-auto border-b border-stone-200 dark:border-stone-800">
            {TABS.map((tab) => {
              const count =
                tab.key === "pending"
                  ? stats.total_pending
                  : tab.key === "needs_routing"
                    ? stats.needs_routing
                    : tab.key === "ready"
                      ? stats.ready_for_approval
                      : tab.key === "approved"
                        ? stats.total_approved
                        : profiles.filter((p) => p.status === "rejected")
                            .length;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === tab.key
                      ? "border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-400"
                      : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                      activeTab === tab.key
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400"
                        : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Global message */}
          {msg && (
            <div
              className={cn(
                "border-b px-4 py-2.5 text-sm",
                msg.type === "ok"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-red-100 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400",
              )}
              role="status"
            >
              {msg.text}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/40">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Alumni
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Batch
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Section
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Joined
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-sm text-stone-400 dark:text-stone-500"
                    >
                      No alumni in this category.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const routingStatus = getRoutingStatus(p);
                    const missingSection = !p.section_id;
                    const isBusy = pending && busyId === p.id;
                    const email =
                      (
                        p.users as
                          | { email?: string | null }
                          | null
                      )?.email ?? null;

                    return (
                      <Fragment key={p.id}>
                        <tr className="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/60 dark:border-stone-800/60 dark:hover:bg-stone-900/40">
                          {/* Alumni name + email */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <SafeImage
                                src={p.photo_url}
                                fallback={<DefaultAvatar />}
                                alt={p.display_name ?? ""}
                                className="size-8 shrink-0 rounded-lg"
                                imgClassName="object-cover"
                              />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-stone-900 dark:text-stone-100">
                                  {p.display_name?.trim() || "Unnamed"}
                                </p>
                                {email && (
                                  <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                                    {email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Batch */}
                          <td className="px-4 py-3 text-stone-700 dark:text-stone-300">
                            {p.batches?.name ?? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                                <AlertTriangle className="h-3 w-3" />
                                Missing Batch
                              </span>
                            )}
                          </td>

                          {/* Section */}
                          <td className="px-4 py-3">
                            {p.sections?.name ? (
                              <span className="text-stone-700 dark:text-stone-300">
                                {p.sections.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                <AlertTriangle className="h-3 w-3" />
                                No Section
                              </span>
                            )}
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-3">
                            {p.status === "approved" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Approved
                              </span>
                            ) : p.status === "rejected" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                                <XCircle className="h-3 w-3" />
                                Rejected
                              </span>
                            ) : routingStatus === "needs_routing" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                                <GitBranch className="h-3 w-3" />
                                Needs Routing
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Ready
                              </span>
                            )}
                          </td>

                          {/* Joined date */}
                          <td className="px-4 py-3 text-xs text-stone-400 dark:text-stone-500">
                            {formatWhen(p.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.status === "pending" && (
                                <>
                                  {/* Route button — always shown for pending */}
                                  <button
                                    type="button"
                                    onClick={() => setRoutingProfile(p)}
                                    className={cn(
                                      btnBase,
                                      "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 focus-visible:ring-violet-500 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400 dark:hover:bg-violet-900/40",
                                    )}
                                  >
                                    <GitBranch className="h-3 w-3" />
                                    <span className="hidden sm:inline">
                                      Route
                                    </span>
                                  </button>

                                  {/* Approve */}
                                  {missingSection ? (
                                    <span
                                      title="Assign a section before approving"
                                      className={cn(
                                        btnBase,
                                        "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-500",
                                      )}
                                    >
                                      <ThumbsUp className="h-3 w-3" />
                                      <span className="hidden sm:inline">
                                        Approve
                                      </span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        run(approveAlumniProfile, p.id)
                                      }
                                      className={cn(
                                        btnBase,
                                        "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/40 disabled:opacity-50",
                                      )}
                                    >
                                      <ThumbsUp className="h-3 w-3" />
                                      <span className="hidden sm:inline">
                                        {isBusy ? "…" : "Approve"}
                                      </span>
                                    </button>
                                  )}

                                  {/* Reject */}
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      run(rejectAlumniProfile, p.id)
                                    }
                                    className={cn(
                                      btnBase,
                                      "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-500 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 disabled:opacity-50",
                                    )}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                    <span className="hidden sm:inline">
                                      Reject
                                    </span>
                                  </button>
                                </>
                              )}

                              {p.status === "approved" && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                  Active member
                                </span>
                              )}
                              {p.status === "rejected" && (
                                <span className="text-xs text-stone-400 dark:text-stone-500">
                                  Rejected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Inline warning for needs-routing when trying to approve */}
                        {missingSection &&
                          p.status === "pending" &&
                          msg?.type === "err" &&
                          busyId === p.id && (
                            <tr>
                              <td
                                colSpan={6}
                                className="bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                              >
                                Please assign a batch and section before
                                approving this alumni.
                              </td>
                            </tr>
                          )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
