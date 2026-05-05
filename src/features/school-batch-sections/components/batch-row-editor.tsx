"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteBatch,
  updateBatch,
  type BatchActionResult,
} from "@/features/school-batch-sections/actions/batch-actions";
import type { BatchRow } from "@/features/school-batch-sections/lib/queries";

type Props = {
  batch: BatchRow;
  schoolId: string;
};

export function BatchRowEditor({ batch, schoolId }: Props) {
  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: BatchActionResult | null, formData: FormData) =>
      updateBatch(formData),
    null,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_prev: BatchActionResult | null, formData: FormData) =>
      deleteBatch(formData),
    null,
  );

  return (
    <div className="border-b border-stone-100 py-4 last:border-0 dark:border-stone-800/80">
      <form action={updateAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="id" value={batch.id} />
        <input type="hidden" name="school_id" value={schoolId} />
        <label className="block min-w-[10rem] flex-1 text-xs font-medium text-stone-600 dark:text-stone-400">
          Name
          <Input
            className="mt-1"
            name="name"
            defaultValue={batch.name}
            required
          />
        </label>
        <label className="block w-full min-w-[6rem] sm:w-28 text-xs font-medium text-stone-600 dark:text-stone-400">
          Year
          <Input
            className="mt-1"
            name="graduation_year"
            type="number"
            defaultValue={batch.graduation_year ?? ""}
            min={1900}
            max={2100}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={updatePending}>
            {updatePending ? "Saving…" : "Save"}
          </Button>
        </div>
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
          if (
            !confirm(
              "Delete this batch? All sections in this batch will be removed.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={batch.id} />
        <input type="hidden" name="school_id" value={schoolId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
          disabled={deletePending}
        >
          {deletePending ? "Deleting…" : "Delete batch"}
        </Button>
      </form>
    </div>
  );
}
