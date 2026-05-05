"use client";

import { useMemo, useState } from "react";
import { PollVoteCard } from "@/features/polls/components/poll-vote-card";
import type { PollOptionRow, PollRow } from "@/features/polls/lib/types";
import {
  pollVisibleForAlumni,
  type AlumniPollContext,
} from "@/features/polls/lib/visibility";

export type AlumniPollsBundle = {
  polls: PollRow[];
  optionsByPoll: Record<string, PollOptionRow[]>;
  myVotes: Record<string, string>;
  countsByPoll: Record<string, Record<string, number>>;
};

type FilterMode = "all" | "batch_focus" | "section_focus";

type Props = {
  bundle: AlumniPollsBundle;
  alumniCtx: AlumniPollContext;
  batchName?: string | null;
  sectionName?: string | null;
};

export function AlumniPollsPanel({
  bundle,
  alumniCtx,
  batchName,
  sectionName,
}: Props) {
  const [filter, setFilter] = useState<FilterMode>("all");

  const visiblePolls = useMemo(() => {
    const base = bundle.polls.filter((p) =>
      pollVisibleForAlumni(p, alumniCtx),
    );
    if (filter === "all") {
      return base;
    }
    if (filter === "batch_focus") {
      return base.filter((p) => p.batch_id != null);
    }
    return base.filter((p) => p.section_id != null);
  }, [bundle.polls, alumniCtx, filter]);

  if (bundle.polls.length === 0) {
    return (
      <p
        className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-10 text-center text-sm text-stone-600 dark:border-stone-600 dark:bg-stone-900/40 dark:text-stone-400"
        role="status"
      >
        No polls yet. School admins can add light check-ins here—no feed, just
        quick votes.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
          <span className="font-medium text-stone-700 dark:text-stone-300">
            Focus
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterMode)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value="all">All polls for you</option>
            <option value="batch_focus">
              Batch polls
              {batchName ? ` (${batchName})` : ""}
            </option>
            <option
              value="section_focus"
              disabled={!alumniCtx.sectionId}
            >
              Section polls
              {sectionName ? ` (${sectionName})` : ""}
            </option>
          </select>
        </label>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Showing {visiblePolls.length} of{" "}
          {bundle.polls.filter((p) => pollVisibleForAlumni(p, alumniCtx)).length}{" "}
          visible
        </p>
      </div>

      {visiblePolls.length === 0 ? (
        <p
          className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400"
          role="status"
        >
          No polls in this focus. Try &quot;All polls for you&quot;.
        </p>
      ) : (
        <ul className="space-y-4">
          {visiblePolls.map((poll) => (
            <PollVoteCard
              key={poll.id}
              poll={poll}
              options={bundle.optionsByPoll[poll.id] ?? []}
              myOptionId={bundle.myVotes[poll.id] ?? null}
              counts={bundle.countsByPoll[poll.id] ?? null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
