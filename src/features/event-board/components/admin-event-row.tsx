"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateEventStatus } from "@/features/event-board/actions/event-actions";
import { formatEventWhen } from "@/features/event-board/lib/format";
import type { EventRow, ResponseCounts } from "@/features/event-board/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  event: EventRow;
  schoolId: string;
  counts: ResponseCounts;
};

function statusLabel(status: EventRow["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "published":
      return "Published";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

export function AdminEventRow({ event, schoolId, counts }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { primary } = formatEventWhen(event.starts_at, event.ends_at);

  function submitStatus(next: string) {
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("event_id", event.id);
      fd.append("school_id", schoolId);
      fd.append("status", next);
      const r = await updateEventStatus(fd);
      if (r.ok) {
        router.refresh();
      } else {
        setMsg(r.error);
      }
    });
  }

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">
            {event.title}
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">{primary}</p>
          {event.location ? (
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
              {event.location}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            event.status === "published" &&
              "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
            event.status === "draft" &&
              "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
            event.status === "cancelled" &&
              "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
            event.status === "completed" &&
              "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
          )}
        >
          {statusLabel(event.status)}
        </span>
      </div>
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        {counts.going} going · {counts.interested} interested · {counts.notGoing}{" "}
        not going
      </p>
      {msg ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {event.status === "draft" ? (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => submitStatus("published")}
          >
            Publish
          </Button>
        ) : null}
        {event.status === "published" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => submitStatus("cancelled")}
          >
            Cancel event
          </Button>
        ) : null}
        {event.status === "cancelled" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => submitStatus("published")}
          >
            Re-publish
          </Button>
        ) : null}
      </div>
    </li>
  );
}
