"use client";

import { type ComponentProps, type ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Select } from "@/components/ui/select";

type SelectFieldProps = {
  name: string;
  label: string;
  hint?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Select>, "name" | "children">;

export function SelectField({
  name,
  label,
  hint,
  id,
  children,
  ...selectProps
}: SelectFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<Record<string, unknown>>();
  const err = errors[name]?.message as string | undefined;
  const inputId = id ?? name;

  return (
    <FormField label={label} htmlFor={inputId} error={err} hint={hint}>
      <Select id={inputId} {...register(name)} {...selectProps}>
        {children}
      </Select>
    </FormField>
  );
}
