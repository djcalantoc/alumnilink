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
import { Select } from "@/components/ui/select";
import {
  createSection,
  type SectionActionResult,
} from "@/features/school-batch-sections/actions/section-actions";
import type { BatchRow } from "@/features/school-batch-sections/lib/queries";

type Props = {
  schoolId: string;
  batches: BatchRow[];
};

export function SectionCreateForm({ schoolId, batches }: Props) {
  const [state, action, pending] = useActionState(
    async (_prev: SectionActionResult | null, formData: FormData) =>
      createSection(formData),
    null,
  );

  if (!batches.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add section</CardTitle>
          <CardDescription>
            Create a batch first, then you can add sections under it.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add section</CardTitle>
        <CardDescription>
          Sections belong to a single batch (for example, “Section A”).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="school_id" value={schoolId} />
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Batch
            <Select className="mt-1.5" name="batch_id" required defaultValue="">
              <option value="" disabled>
                Select batch
              </option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Section name
            <Input
              className="mt-1.5"
              name="name"
              placeholder="Section A"
              required
              autoComplete="off"
            />
          </label>
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "Adding…" : "Add section"}
          </Button>
        </form>
        {state && !state.ok ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
