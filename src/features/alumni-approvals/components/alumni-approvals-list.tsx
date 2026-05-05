"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  approveAlumniProfile,
  rejectAlumniProfile,
} from "@/features/alumni-approvals/actions/approval-actions";
import type { PendingProfileRow } from "@/features/alumni-approvals/lib/queries";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { cn } from "@/lib/cn";

type Props = {
  schoolId: string;
  profiles: PendingProfileRow[];
  expandedProfileId: string | null;
  /** Extra query segment after schoolId, e.g. `&batchId=…&sectionId=…` */
  filterSuffix: string;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AlumniApprovalsList({
  schoolId,
  profiles,
  expandedProfileId,
  filterSuffix,
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function run(
    action: (fd: FormData) => Promise<
      { ok: true } | { ok: false; error: string }
    >,
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
        setMsg({ type: "ok", text: "Updated." });
        router.refresh();
      } else {
        setMsg({ type: "err", text: r.error });
      }
    });
  }

  if (profiles.length === 0) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
        No pending alumni match these filters.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <p
          className={cn(
            "text-sm",
            msg.type === "ok"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400",
          )}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}
      <ul className="space-y-3">
        {profiles.map((p) => {
          const expanded = expandedProfileId === p.id;
          const batchName = p.batches?.name ?? "—";
          const sectionName = p.sections?.name ?? "—";
          const loc = [p.location_city, p.location_country]
            .filter(Boolean)
            .join(", ");

          return (
            <li
              key={p.id}
              className={cn(
                "rounded-2xl border bg-white dark:bg-stone-950",
                expanded
                  ? "border-stone-400 ring-1 ring-stone-300 dark:border-stone-500 dark:ring-stone-600"
                  : "border-stone-200 dark:border-stone-800",
              )}
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SafeImage
                      src={p.photo_url}
                      fallback={<DefaultAvatar />}
                      alt={`${p.display_name?.trim() || "Applicant"} profile photo`}
                      className="size-11 shrink-0 rounded-xl"
                      imgClassName="object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-50">
                        {p.display_name?.trim() || "Unnamed"}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {batchName}
                        {sectionName && sectionName !== "—"
                          ? ` · ${sectionName}`
                          : ""}
                        {" · "}
                        {formatWhen(p.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link
                    href={
                      expanded
                        ? `/school-admin/alumni-approvals?schoolId=${schoolId}${filterSuffix}`
                        : `/school-admin/alumni-approvals?schoolId=${schoolId}&profileId=${p.id}${filterSuffix}`
                    }
                    className={cn(
                      "inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-transparent px-3 text-sm font-medium text-stone-900 transition-colors",
                      "hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
                      "dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-900",
                    )}
                  >
                    {expanded ? "Hide detail" : "View detail"}
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0"
                    disabled={pending && busyId === p.id}
                    onClick={() => run(approveAlumniProfile, p.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    disabled={pending && busyId === p.id}
                    onClick={() => run(rejectAlumniProfile, p.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>

              {expanded ? (
                <div className="space-y-3 border-t border-stone-100 px-4 py-4 text-sm dark:border-stone-800">
                  {p.headline ? (
                    <p>
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        Status line:{" "}
                      </span>
                      <span className="text-stone-600 dark:text-stone-400">
                        {p.headline}
                      </span>
                    </p>
                  ) : null}
                  {loc ? (
                    <p>
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        Location:{" "}
                      </span>
                      <span className="text-stone-600 dark:text-stone-400">
                        {loc}
                      </span>
                    </p>
                  ) : null}
                  {p.social_url ? (
                    <p>
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        Link:{" "}
                      </span>
                      <a
                        href={p.social_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-stone-900 underline-offset-2 hover:underline dark:text-stone-100"
                      >
                        {p.social_url}
                      </a>
                    </p>
                  ) : null}
                  <p className="text-xs text-stone-500 dark:text-stone-500">
                    Profile ID: {p.id}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
