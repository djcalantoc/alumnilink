import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  description,
  children,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_48px_-8px_rgba(79,70,229,0.15),0_4px_16px_-4px_rgba(0,0,0,0.08)] dark:bg-stone-900 dark:shadow-[0_8px_48px_-8px_rgba(0,0,0,0.5)]",
        className,
      )}
    >
      {/* Logo mark */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-sm shadow-violet-400/30">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-stone-600 dark:text-stone-400">
          AlumniLink
        </span>
      </div>

      {/* Title + description */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
