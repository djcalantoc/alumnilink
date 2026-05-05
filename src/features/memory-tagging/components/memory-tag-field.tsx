"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addMemoryTags } from "@/features/memory-tagging/actions/memory-tag-actions";
import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import { Button } from "@/components/ui/button";

type Props = {
  memoryId: string;
  schoolId: string;
  currentUserId: string;
  classmates: ClassmateRow[];
};

export function MemoryTagField({
  memoryId,
  schoolId,
  currentUserId,
  classmates,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = useMemo(
    () => classmates.filter((c) => c.user_id !== currentUserId),
    [classmates, currentUserId],
  );

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  return (
    <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
      <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
        Tag classmates (approved, same school)
      </p>
      {options.length === 0 ? (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
          No classmates to tag yet.
        </p>
      ) : (
        <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-sm">
          {options.map((c) => (
            <li key={c.user_id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-stone-50 dark:hover:bg-stone-900">
                <input
                  type="checkbox"
                  checked={selected.has(c.user_id)}
                  onChange={() => toggle(c.user_id)}
                  className="rounded border-stone-300"
                />
                <span className="text-stone-800 dark:text-stone-200">
                  {c.display_name?.trim() || "Alumni"}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {msg ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="mt-3">
        <Button
          type="button"
          size="sm"
          disabled={pending || selected.size === 0}
          onClick={() => {
            setMsg(null);
            startTransition(async () => {
              const fd = new FormData();
              fd.append("memory_id", memoryId);
              fd.append("school_id", schoolId);
              fd.append("tagged_user_ids", JSON.stringify([...selected]));
              const r = await addMemoryTags(fd);
              if (r.ok) {
                setSelected(new Set());
                router.refresh();
              } else {
                setMsg(r.error);
              }
            });
          }}
        >
          {pending ? "Saving…" : "Save tags"}
        </Button>
      </div>
    </div>
  );
}
