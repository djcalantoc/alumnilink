import Link from "next/link";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  icon: string;
  title: string;
  /** Neutral cards: gradient surface behind icon */
  iconSurfaceClass?: string;
  variant?: "primary" | "neutral";
  className?: string;
};

/** Quick jumps — primary card is visually emphasized; neutrals stay calm with gradient icon pills. */
export function QuickActionCard({
  href,
  icon,
  title,
  iconSurfaceClass,
  variant = "neutral",
  className,
}: Props) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:scale-100",
        "hover:z-10 hover:scale-[1.04] hover:shadow-2xl active:scale-[0.98]",
        isPrimary
          ? cn(
              "min-h-[148px] min-w-[156px] shrink-0 bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-6 shadow-xl shadow-sky-500/30 ring-2 ring-white/30 sm:min-w-[172px]",
              "lg:min-w-0 lg:w-full",
              "hover:scale-[1.06] hover:shadow-[0_20px_40px_-12px_rgba(14,165,233,0.45)] hover:ring-white/45",
            )
          : cn(
              "min-h-[132px] min-w-[132px] shrink-0 bg-white p-5 shadow-md shadow-slate-200/50 ring-1 ring-slate-100/95",
              "hover:-translate-y-0.5 hover:bg-slate-50/95 hover:shadow-xl hover:ring-slate-200/90 lg:min-w-0 lg:w-full",
            ),
        className,
      )}
    >
      {isPrimary ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_30%_20%,rgba(255,255,255,0.22),transparent_55%)]"
            aria-hidden
          />
          <div className="relative mb-4 flex size-[4.25rem] items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-2 ring-white/35 backdrop-blur-[2px] transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/28 motion-reduce:group-hover:scale-100">
            <MaterialIcon
              name={icon}
              className="text-[34px] text-white drop-shadow-md"
            />
          </div>
          <span className="relative text-center text-sm font-bold leading-tight text-white drop-shadow-sm">
            {title}
          </span>
        </>
      ) : (
        <>
          <div
            className={cn(
              "mb-3 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1 transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100",
              iconSurfaceClass ??
                "from-slate-100 to-slate-200 text-slate-600 ring-slate-200/90",
            )}
          >
            <MaterialIcon name={icon} className="text-[26px]" />
          </div>
          <span className="text-center text-xs font-bold leading-tight text-slate-700">
            {title}
          </span>
        </>
      )}
    </Link>
  );
}
