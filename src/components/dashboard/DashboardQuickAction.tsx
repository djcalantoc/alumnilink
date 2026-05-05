import Link from "next/link";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  icon: string;
  title: string;
  /** Extra classes for the icon circle (background + text + group-hover) */
  iconWrapClass: string;
};

export function DashboardQuickAction({
  href,
  icon,
  title,
  iconWrapClass,
}: Props) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-md"
    >
      <div
        className={cn(
          "mb-3 flex size-12 items-center justify-center rounded-full transition-colors duration-200",
          iconWrapClass,
        )}
      >
        <MaterialIcon name={icon} className="text-[26px]" />
      </div>
      <span className="text-center text-xs font-semibold text-slate-600">
        {title}
      </span>
    </Link>
  );
}
