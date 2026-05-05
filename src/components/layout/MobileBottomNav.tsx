"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardDirectoryNav } from "@/components/dashboard/DashboardSidebar";
import { cn } from "@/lib/cn";

type Props = {
  directoryNav: DashboardDirectoryNav;
};

/**
 * Fixed bottom tab bar — mobile-first; hidden from `md` up (desktop uses sidebar).
 */
export function MobileBottomNav({ directoryNav }: Props) {
  const pathname = usePathname();

  const links: Array<{
    href: string;
    label: string;
    icon: string;
    isActive: (p: string) => boolean;
  }> = [
    {
      href: "/dashboard",
      label: "Home",
      icon: "🏠",
      isActive: (p) => p === "/dashboard" || p === "/dashboard/",
    },
    {
      href: directoryNav.yourSchool,
      label: "School",
      icon: "🏛️",
      isActive: (p) => p.startsWith("/dashboard/school"),
    },
    {
      href: directoryNav.batchmates,
      label: "Batch",
      icon: "🎓",
      isActive: (p) => p.startsWith("/dashboard/batchmates"),
    },
    {
      href: directoryNav.classmates,
      label: "Class",
      icon: "👥",
      isActive: (p) => p.startsWith("/dashboard/classmates"),
    },
    {
      href: "/dashboard/memories",
      label: "Memories",
      icon: "📸",
      isActive: (p) =>
        p.startsWith("/dashboard/memories"),
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      icon: "👤",
      isActive: (p) =>
        p.startsWith("/dashboard/profile"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/90 bg-[var(--background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden dark:border-stone-800"
      aria-label="Main"
    >
      <div className="content-max flex justify-start gap-0 overflow-x-auto px-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map(({ href, label, icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href + label}
              href={href}
              className={cn(
                "flex min-h-12 min-w-[3.5rem] shrink-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[9px] font-medium transition-colors sm:min-w-[4rem] sm:text-[10px]",
                active
                  ? "text-[var(--accent-from)]"
                  : "text-stone-500 dark:text-stone-400",
              )}
            >
              <span className="text-base leading-none sm:text-lg" aria-hidden>
                {icon}
              </span>
              <span className="max-w-full truncate px-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
