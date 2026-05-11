import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface AuthSubmitButtonProps {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function AuthSubmitButton({
  loading,
  loadingText,
  children,
  className,
  disabled,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl",
        "bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5",
        "text-sm font-semibold text-white",
        "shadow-md shadow-violet-500/25",
        "transition-all duration-150",
        "hover:from-violet-700 hover:to-fuchsia-600 hover:shadow-lg hover:shadow-violet-500/35",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2",
        "active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "disabled:hover:from-violet-600 disabled:hover:to-fuchsia-500 disabled:hover:shadow-md",
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
