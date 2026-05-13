"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  deleteSection,
  updateSection,
  type SectionActionResult,
} from "@/features/school-batch-sections/actions/section-actions";
import type { BatchRow, SectionRow } from "@/features/school-batch-sections/lib/queries";

type Props = {
  section: SectionRow;
  schoolId: string;
  batches: BatchRow[];
  onDone?: () => void;
};

export function SectionRowEditor({ section, schoolId, batches, onDone }: Props) {
  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: SectionActionResult | null, formData: FormData) => {
      const result = await updateSection(formData);
      if (result.ok) onDone?.();
      return result;
    },
    null,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_prev: SectionActionResult | null, formData: FormData) => {
      const result = await deleteSection(formData);
      if (result.ok) onDone?.();
      return result;
    },
    null,
  );

  return (
    <div className="border-b border-stone-100 py-4 last:border-0 dark:border-stone-800/80">
      <form action={updateAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="id" value={section.id} />
        <input type="hidden" name="school_id" value={schoolId} />
        <label className="block min-w-[8rem] flex-1 text-xs font-medium text-stone-600 dark:text-stone-400">
          Section
          <Input
            className="mt-1"
            name="name"
            defaultValue={section.name}
            required
          />
        </label>
        <label className="block w-full min-w-[10rem] sm:w-48 text-xs font-medium text-stone-600 dark:text-stone-400">
          Batch
          <Select
            className="mt-1"
            name="batch_id"
            required
            defaultValue={section.batch_id}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" size="sm" disabled={updatePending}>
          {updatePending ? "Saving…" : "Save"}
        </Button>
      </form>
      {(updateState && !updateState.ok) || (deleteState && !deleteState.ok) ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {updateState && !updateState.ok
            ? updateState.error
            : deleteState && !deleteState.ok
              ? deleteState.error
              : ""}
        </p>
      ) : null}
      <form
        action={deleteAction}
        className="mt-2"
        onSubmit={(e) => {
          if (!confirm("Delete this section?")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={section.id} />
        <input type="hidden" name="school_id" value={schoolId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
          disabled={deletePending}
        >
          {deletePending ? "Deleting…" : "Delete section"}
        </Button>
      </form>
    </div>
  );
}
