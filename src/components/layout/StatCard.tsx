import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "indigo" | "teal" | "amber";
  className?: string;
};

const tones = {
  default:
    "border-stone-200/90 bg-white/95 shadow-sm shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/90",
  indigo:
    "border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white dark:border-indigo-900/50 dark:from-indigo-950/50 dark:to-stone-950",
  teal: "border-teal-200/80 bg-gradient-to-br from-teal-50/90 to-white dark:border-teal-900/50 dark:from-teal-950/40 dark:to-stone-950",
  amber:
    "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white dark:border-amber-900/50 dark:from-amber-950/40 dark:to-stone-950",
} as const;

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 dark:text-stone-100",
        tones[tone],
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
