import Link from "next/link";
import { cn } from "@/lib/cn";

type QuickActionCardProps = {
  href: string;
  icon: string;
  title: string;
  subtitle?: string;
  className?: string;
};

export function QuickActionCard({
  href,
  icon,
  title,
  subtitle,
  className,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "social-card flex flex-col rounded-2xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-stone-950",
        className,
      )}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {icon}
      </span>
      <span className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-50">
        {title}
      </span>
      {subtitle ? (
        <span className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          {subtitle}
        </span>
      ) : null}
    </Link>
  );
}
