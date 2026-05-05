"use client";

import { type ComponentProps } from "react";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";

type TextFieldProps = {
  name: string;
  label: string;
  hint?: string;
} & Omit<ComponentProps<typeof Input>, "name">;

export function TextField({ name, label, hint, id, ...inputProps }: TextFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<Record<string, unknown>>();
  const err = errors[name]?.message as string | undefined;
  const inputId = id ?? name;

  return (
    <FormField label={label} htmlFor={inputId} error={err} hint={hint}>
      <Input id={inputId} {...register(name)} {...inputProps} />
    </FormField>
  );
}
