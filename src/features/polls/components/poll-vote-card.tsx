"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { voteOnPoll } from "@/features/polls/actions/poll-actions";
import type { PollOptionRow, PollRow } from "@/features/polls/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const typeLabels: Record<PollRow["poll_type"], string> = {
  nostalgic: "Nostalgic",
  event: "Event",
  batch: "Batch",
};

type Props = {
  poll: PollRow;
  options: PollOptionRow[];
  myOptionId: string | null;
  counts: Record<string, number> | null;
};

export function PollVoteCard({ poll, options, myOptionId, counts }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const total =
    counts == null
      ? 0
      : Object.values(counts).reduce((a, b) => a + b, 0);
  const closed = poll.status === "closed";
  const voted = myOptionId != null || closed;

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200">
          {typeLabels[poll.poll_type]}
        </span>
        {closed ? (
          <span className="text-xs text-stone-500">Closed</span>
        ) : null}
      </div>
      <h2 className="mt-2 text-base font-semibold text-stone-900 dark:text-stone-50">
        {poll.title}
      </h2>
      {poll.description ? (
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {poll.description}
        </p>
      ) : null}

      {msg ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}

      {!voted && !closed ? (
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const r = await voteOnPoll(fd);
              if (r.ok) {
                router.refresh();
              } else {
                setMsg(r.error);
              }
            });
          }}
        >
          <input type="hidden" name="poll_id" value={poll.id} />
          <fieldset className="space-y-2">
            <legend className="sr-only">Choose an option</legend>
            {options.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm dark:border-stone-700"
              >
                <input
                  type="radio"
                  name="option_id"
                  value={o.id}
                  required
                  className="h-4 w-4 shrink-0"
                />
                <span className="text-stone-800 dark:text-stone-200">
                  {o.label}
                </span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Vote"}
          </Button>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Results
          </p>
          {counts && total > 0 ? (
            <ul className="space-y-2">
              {options.map((o) => {
                const n = counts[o.id] ?? 0;
                const pct = Math.round((n / total) * 100);
                const isMine = myOptionId === o.id;
                return (
                  <li key={o.id}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span
                        className={cn(
                          "min-w-0 truncate",
                          isMine
                            ? "font-medium text-teal-800 dark:text-teal-200"
                            : "text-stone-700 dark:text-stone-300",
                        )}
                      >
                        {o.label}
                        {isMine ? " · You" : ""}
                      </span>
                      <span className="shrink-0 tabular-nums text-stone-500">
                        {n} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width]",
                          isMine ? "bg-teal-600" : "bg-stone-400 dark:bg-stone-500",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {closed
                ? "No votes recorded."
                : "Results appear after you vote."}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
