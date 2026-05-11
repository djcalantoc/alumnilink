"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className, id, name, ...props }, ref) => {
    const inputId = id ?? name;
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={cn(
            "block w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400",
            "transition-all duration-150",
            "focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20",
            "dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50 dark:placeholder-stone-500",
            "dark:focus:border-violet-500 dark:focus:bg-stone-800/80",
            error &&
              "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-300/25 dark:border-red-600",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);
AuthInput.displayName = "AuthInput";
