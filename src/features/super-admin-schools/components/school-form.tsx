"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useTransition,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import {
  createSchool,
  updateSchool,
  type SchoolActionResult,
} from "@/features/super-admin-schools/actions/school-actions";
import {
  schoolFormSchema,
  type SchoolFormInput,
  type SchoolFormValues,
} from "@/features/super-admin-schools/lib/school-schema";
import type { SchoolRow } from "@/features/super-admin-schools/lib/types";

function buildFormData(values: SchoolFormValues): FormData {
  const fd = new FormData();
  fd.append("name", values.name);
  fd.append("short_name", values.short_name ?? "");
  fd.append("slug", values.slug);
  fd.append("school_type", values.school_type);
  fd.append("address", values.address ?? "");
  fd.append("city", values.city ?? "");
  fd.append("primary_color", values.primary_color);
  fd.append("secondary_color", values.secondary_color);
  fd.append("visibility", values.visibility);
  fd.append("status", values.status);
  return fd;
}

const defaultCreateValues: SchoolFormInput = {
  name: "",
  short_name: "",
  slug: "",
  school_type: "other",
  address: "",
  city: "",
  primary_color: "#1c1917",
  secondary_color: "#78716c",
  visibility: "public",
  status: "pending_setup",
};

function rowToValues(row: SchoolRow): SchoolFormInput {
  return {
    name: row.name,
    short_name: row.short_name ?? "",
    slug: row.slug,
    school_type: row.school_type,
    address: row.address ?? "",
    city: row.city ?? "",
    primary_color: row.primary_color,
    secondary_color: row.secondary_color,
    visibility: row.visibility,
    status: row.status,
  };
}

type SchoolFormProps =
  | { mode: "create"; school?: undefined }
  | { mode: "edit"; school: SchoolRow };

export function SchoolForm(props: SchoolFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const schoolId = isEdit ? props.school.id : "";

  const updateFn = useCallback(
    (prev: SchoolActionResult | null, formData: FormData) =>
      updateSchool(schoolId, prev, formData),
    [schoolId],
  );

  const [state, formAction] = useActionState<
    SchoolActionResult | null,
    FormData
  >(isEdit ? updateFn : createSchool, null);

  const [isPending, startTransition] = useTransition();

  const methods = useForm<SchoolFormInput, unknown, SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: isEdit ? rowToValues(props.school) : defaultCreateValues,
  });

  const { handleSubmit, setError, clearErrors } = methods;

  useEffect(() => {
    if (!state || state.ok) {
      return;
    }
    if (!state.fieldErrors) {
      return;
    }
    for (const [key, messages] of Object.entries(state.fieldErrors)) {
      setError(key as keyof SchoolFormInput, { message: messages[0] });
    }
  }, [state, setError]);

  useEffect(() => {
    if (state?.ok && state.data?.id) {
      router.replace(`/admin/schools/${state.data.id}`);
    }
  }, [state, router]);

  useEffect(() => {
    if (state?.ok && isEdit) {
      clearErrors();
      router.refresh();
    }
  }, [state, isEdit, clearErrors, router]);

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Edit school" : "New school"}
          </CardTitle>
        </CardHeader>
        <form
          onSubmit={handleSubmit((values) => {
            clearErrors();
            const fd = buildFormData(values);
            startTransition(() => {
              formAction(fd);
            });
          })}
        >
          <CardContent className="space-y-6">
            {state && !state.ok && !state.fieldErrors ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {state.error}
              </p>
            ) : null}
            {state?.ok && isEdit ? (
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Saved changes.
              </p>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <TextField name="name" label="School name" autoComplete="off" />
              <TextField
                name="short_name"
                label="Short name"
                hint="Optional display name."
                autoComplete="off"
              />
            </div>

            <TextField
              name="slug"
              label="URL slug"
              hint="Lowercase, e.g. northfield-high. Used in links."
              autoComplete="off"
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <SelectField name="school_type" label="School type">
                <option value="university">University</option>
                <option value="high_school">High school</option>
                <option value="k12">K–12</option>
                <option value="vocational">Vocational</option>
                <option value="other">Other</option>
              </SelectField>
              <SelectField name="status" label="Status">
                <option value="pending_setup">Pending setup</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectField>
            </div>

            <TextareaField
              name="address"
              label="Address"
              rows={3}
              autoComplete="street-address"
            />

            <TextField name="city" label="City" autoComplete="address-level2" />

            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                name="primary_color"
                label="Primary color"
                type="text"
                placeholder="#1c1917"
              />
              <TextField
                name="secondary_color"
                label="Secondary color"
                type="text"
                placeholder="#78716c"
              />
            </div>

            <SelectField name="visibility" label="Directory visibility">
              <option value="public">Public — listed for discovery</option>
              <option value="unlisted">Unlisted — link only</option>
              <option value="private">Private — members only (future)</option>
            </SelectField>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create school"}
            </Button>
            <Link
              href="/admin/schools"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-transparent px-4 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-900"
            >
              Cancel
            </Link>
          </CardFooter>
        </form>
      </Card>
    </FormProvider>
  );
}
