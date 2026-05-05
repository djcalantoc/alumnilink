import { type ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type InputProps = ComponentProps<"input">;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 shadow-sm transition-colors",
        "placeholder:text-stone-400",
        "focus-visible:border-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50 dark:focus-visible:border-stone-500",
        className,
      )}
      {...props}
    />
  );
}
