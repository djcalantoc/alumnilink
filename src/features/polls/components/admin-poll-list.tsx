"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { closeSchoolPoll } from "@/features/polls/actions/poll-actions";
import type { PollRow } from "@/features/polls/lib/types";
import { Button } from "@/components/ui/button";

const typeLabels: Record<PollRow["poll_type"], string> = {
  nostalgic: "Nostalgic",
  event: "Event",
  batch: "Batch",
};

type Props = {
  schoolId: string;
  polls: PollRow[];
};

export function AdminPollList({ schoolId, polls }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (polls.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-600 dark:bg-stone-900/40 dark:text-stone-400">
        No polls yet. Create one above.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {msg ? (
        <li className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </li>
      ) : null}
      {polls.map((p) => (
        <li
          key={p.id}
          className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium dark:bg-stone-800">
                {typeLabels[p.poll_type]}
              </span>
              <span
                className={
                  p.status === "open"
                    ? "text-xs font-medium text-emerald-700 dark:text-emerald-400"
                    : "text-xs text-stone-500"
                }
              >
                {p.status === "open" ? "Open" : "Closed"}
              </span>
            </div>
            <p className="mt-1 font-medium text-stone-900 dark:text-stone-50">
              {p.title}
            </p>
            {p.description ? (
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {p.description}
              </p>
            ) : null}
          </div>
          {p.status === "open" ? (
            <form
              className="shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                setMsg(null);
                setBusyId(p.id);
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const r = await closeSchoolPoll(fd);
                  setBusyId(null);
                  if (r.ok) {
                    router.refresh();
                  } else {
                    setMsg(r.error);
                  }
                });
              }}
            >
              <input type="hidden" name="poll_id" value={p.id} />
              <input type="hidden" name="school_id" value={schoolId} />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={pending && busyId === p.id}
              >
                Close poll
              </Button>
            </form>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
