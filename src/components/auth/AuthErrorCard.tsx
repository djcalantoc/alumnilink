import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface AuthErrorCardProps {
  message: string;
  className?: string;
}

export function AuthErrorCard({ message, className }: AuthErrorCardProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3",
        "dark:border-red-900/40 dark:bg-red-950/30",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
    </div>
  );
}

interface AuthInfoCardProps {
  message: string;
  className?: string;
}

export function AuthInfoCard({ message, className }: AuthInfoCardProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3",
        "dark:border-violet-800/40 dark:bg-violet-950/30",
        className,
      )}
    >
      <span className="mt-0.5 shrink-0 text-sm">📬</span>
      <p className="text-sm text-violet-700 dark:text-violet-300">{message}</p>
    </div>
  );
}
