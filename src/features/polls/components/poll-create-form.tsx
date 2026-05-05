"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSchoolPoll } from "@/features/polls/actions/poll-actions";
import type { AccessibleSchool } from "@/features/school-batch-sections/lib/access";
import type { BatchRow, SectionRow } from "@/features/school-batch-sections/lib/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  schools: AccessibleSchool[];
  defaultSchoolId: string;
  batches: BatchRow[];
  sections: SectionRow[];
};

export function PollCreateForm({
  schools,
  defaultSchoolId,
  batches,
  sections,
}: Props) {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState(defaultSchoolId);
  const [batchId, setBatchId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const sectionChoices = sections.filter(
    (s) => !batchId || s.batch_id === batchId,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New poll</CardTitle>
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
              const r = await createSchoolPoll(fd);
              if (r.ok) {
                setMsg({ type: "ok", text: "Poll created." });
                form.reset();
                setBatchId("");
                setSectionId("");
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
              Type
            </span>
            <select
              name="poll_type"
              required
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            >
              <option value="nostalgic">Nostalgic</option>
              <option value="event">Event</option>
              <option value="batch">Batch</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Title
            </span>
            <input
              name="title"
              required
              minLength={2}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Description (optional)
            </span>
            <textarea
              name="description"
              rows={2}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Options (one per line, at least 2)
            </span>
            <textarea
              name="options"
              required
              rows={4}
              placeholder={"Option A\nOption B"}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                Limit to batch (optional)
              </span>
              <select
                name="batch_id"
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setSectionId("");
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                <option value="">All batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                Limit to section (optional)
              </span>
              <select
                name="section_id"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                <option value="">All sections</option>
                {sectionChoices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {msg ? (
            <p
              className={
                msg.type === "ok"
                  ? "text-sm text-emerald-700 dark:text-emerald-400"
                  : "text-sm text-red-600 dark:text-red-400"
              }
              role="status"
            >
              {msg.text}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create poll"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
