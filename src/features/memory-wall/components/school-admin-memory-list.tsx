"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveMemory,
  rejectMemory,
} from "@/features/memory-wall/actions/memory-actions";
import type { MemoryWithRelations } from "@/features/memory-wall/lib/types";
import { primaryImageUrl } from "@/features/memory-wall/lib/types";
import { removeMemoryTagAdmin } from "@/features/memory-tagging/actions/memory-tag-actions";
import type { MemoryTagRow } from "@/features/memory-tagging/lib/types";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

type Props = {
  schoolId: string;
  memories: MemoryWithRelations[];
  tagsByMemoryId?: Record<string, MemoryTagRow[]>;
};

export function SchoolAdminMemoryList({
  schoolId,
  memories,
  tagsByMemoryId = {},
}: Props) {
  const router = useRouter();
  const [memoryBusyId, setMemoryBusyId] = useState<string | null>(null);
  const [tagBusyId, setTagBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function runRemoveTag(tagId: string) {
    setMsg(null);
    setTagBusyId(tagId);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("tag_id", tagId);
      fd.append("school_id", schoolId);
      const r = await removeMemoryTagAdmin(fd);
      setTagBusyId(null);
      if (r.ok) {
        setMsg({ type: "ok", text: "Tag removed." });
        router.refresh();
      } else {
        setMsg({ type: "err", text: r.error });
      }
    });
  }

  function run(
    action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
    memoryId: string,
  ) {
    setMsg(null);
    setMemoryBusyId(memoryId);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("memory_id", memoryId);
      fd.append("school_id", schoolId);
      const r = await action(fd);
      setMemoryBusyId(null);
      if (r.ok) {
        setMsg({ type: "ok", text: "Updated." });
        router.refresh();
      } else {
        setMsg({ type: "err", text: r.error });
      }
    });
  }

  if (memories.length === 0) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
        No pending memories.
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
        {memories.map((m) => {
          const src = primaryImageUrl(m.media_urls);
          const batch = m.batches?.name;
          const year =
            m.batches?.graduation_year != null
              ? ` (${m.batches.graduation_year})`
              : "";
          const section = m.sections?.name;
          const tags = tagsByMemoryId[m.id] ?? [];

          return (
            <li
              key={m.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <SafeImage
                  src={src}
                  fallback={<PhotoFallback src={DEFAULT_MEMORY_IMAGE} />}
                  alt={
                    m.body?.trim()
                      ? `Memory pending review: ${m.body.trim()}`
                      : "Memory pending review"
                  }
                  className="h-40 w-full shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-40"
                  imgClassName="object-cover"
                />
                <div className="min-w-0 flex-1">
                  {m.body ? (
                    <p className="text-sm text-stone-800 dark:text-stone-200">
                      {m.body}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    {[batch ? `${batch}${year}` : null, section]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  {tags.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                        Tagged classmates
                      </p>
                      <ul className="mt-1.5 flex flex-wrap gap-2">
                        {tags.map((t) => {
                          const label =
                            t.users?.full_name?.trim() || "Alumni";
                          return (
                            <li key={t.id}>
                              <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 py-1 pl-2.5 pr-1 text-xs dark:border-stone-700 dark:bg-stone-900">
                                <span className="max-w-[10rem] truncate">
                                  {label}
                                </span>
                                <button
                                  type="button"
                                  className="rounded-full px-1.5 py-0.5 text-stone-500 hover:bg-stone-200 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                                  disabled={pending && tagBusyId === t.id}
                                  onClick={() => runRemoveTag(t.id)}
                                  aria-label={`Remove tag ${label}`}
                                >
                                  ×
                                </button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending && memoryBusyId === m.id}
                      onClick={() => run(approveMemory, m.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={pending && memoryBusyId === m.id}
                      onClick={() => run(rejectMemory, m.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
