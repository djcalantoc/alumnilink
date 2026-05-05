"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSchoolEvent } from "@/features/event-board/actions/event-actions";
import type { AccessibleSchool } from "@/features/school-batch-sections/lib/access";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

type Props = {
  schools: AccessibleSchool[];
  defaultSchoolId: string;
};

export function EventCreateForm({ schools, defaultSchoolId }: Props) {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState(defaultSchoolId);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  if (schools.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create event or reunion</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            const form = e.currentTarget;
            startTransition(async () => {
              const fd = new FormData(form);
              const r = await createSchoolEvent(fd);
              if (r.ok) {
                setMsg({ type: "ok", text: "Event saved." });
                form.reset();
                setStatus("published");
                router.refresh();
              } else {
                setMsg({ type: "err", text: r.error });
              }
            });
          }}
        >
          {schools.length > 1 ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                School
              </span>
              <select
                name="school_id"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="school_id" value={schoolId} />
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Title
            </span>
            <input
              name="title"
              type="text"
              required
              maxLength={200}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Description (optional)
            </span>
            <textarea
              name="description"
              rows={3}
              maxLength={8000}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Location (optional)
            </span>
            <input
              name="location"
              type="text"
              maxLength={500}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                Starts
              </span>
              <input
                name="starts_at"
                type="datetime-local"
                required
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                Ends (optional)
              </span>
              <input
                name="ends_at"
                type="datetime-local"
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
            </label>
          </div>

          <input type="hidden" name="status" value={status} />

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-4 rounded border-stone-300"
              checked={status === "draft"}
              onChange={(e) =>
                setStatus(e.target.checked ? "draft" : "published")
              }
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">
              Save as draft (not visible to alumni)
            </span>
          </label>

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

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
