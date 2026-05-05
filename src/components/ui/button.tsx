import { type ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-stone-900 text-white hover:bg-stone-800 focus-visible:ring-stone-400 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white",
  secondary:
    "bg-stone-100 text-stone-900 hover:bg-stone-200 focus-visible:ring-stone-400 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700",
  outline:
    "border border-stone-300 bg-transparent hover:bg-stone-50 focus-visible:ring-stone-400 dark:border-stone-600 dark:hover:bg-stone-900",
  ghost:
    "bg-transparent hover:bg-stone-100 focus-visible:ring-stone-400 dark:hover:bg-stone-800",
};

const sizeClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
