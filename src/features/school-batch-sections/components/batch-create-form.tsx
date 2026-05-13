"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createBatch,
  type BatchActionResult,
} from "@/features/school-batch-sections/actions/batch-actions";

type Props = {
  schoolId: string;
  /** When true, renders the form without a Card wrapper (for inline use in tables). */
  compact?: boolean;
};

export function BatchCreateForm({ schoolId, compact }: Props) {
  const [state, action, pending] = useActionState(
    async (_prev: BatchActionResult | null, formData: FormData) =>
      createBatch(formData),
    null,
  );

  const form = (
    <>
      <form action={action} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="school_id" value={schoolId} />
        <label className="block min-w-[12rem] flex-1 text-sm font-medium text-stone-700 dark:text-stone-300">
          Name
          <Input
            className="mt-1.5"
            name="name"
            placeholder="Class of 2024"
            required
            autoComplete="off"
          />
        </label>
        <label className="block w-full min-w-[8rem] sm:w-36 text-sm font-medium text-stone-700 dark:text-stone-300">
          Graduation year
          <Input
            className="mt-1.5"
            name="graduation_year"
            type="number"
            placeholder="2024"
            min={1900}
            max={2100}
          />
        </label>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Adding…" : "Add batch"}
        </Button>
      </form>
      {state && !state.ok ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
    </>
  );

  if (compact) return form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add batch</CardTitle>
        <CardDescription>
          A batch is usually a graduating class or cohort year.
        </CardDescription>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
