import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-stone-700 dark:text-stone-300"
      >
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-stone-500 dark:text-stone-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
