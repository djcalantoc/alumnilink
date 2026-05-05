"use client";

import { type ComponentProps } from "react";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Textarea } from "@/components/ui/textarea";

type TextareaFieldProps = {
  name: string;
  label: string;
  hint?: string;
} & Omit<ComponentProps<typeof Textarea>, "name">;

export function TextareaField({
  name,
  label,
  hint,
  id,
  ...areaProps
}: TextareaFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<Record<string, unknown>>();
  const err = errors[name]?.message as string | undefined;
  const inputId = id ?? name;

  return (
    <FormField label={label} htmlFor={inputId} error={err} hint={hint}>
      <Textarea id={inputId} {...register(name)} {...areaProps} />
    </FormField>
  );
}
