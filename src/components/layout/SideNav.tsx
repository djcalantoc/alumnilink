"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type SideLink = {
  href: string;
  label: string;
  icon: string;
  match?: "exact";
};

const LINKS: SideLink[] = [
  { href: "/dashboard", label: "Home", icon: "🏠", match: "exact" },
  { href: "/dashboard/memories", label: "Memories", icon: "📸" },
  { href: "/dashboard/classmates", label: "Classmates", icon: "👥" },
  { href: "/dashboard/events", label: "Events", icon: "📅" },
  { href: "/dashboard/polls", label: "Polls", icon: "📊" },
  { href: "/dashboard/network", label: "Alumni web", icon: "🕸️" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
];

/**
 * Vertical navigation for md+ — warm card, no enterprise sidebar chrome.
 */
export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      className="social-card rounded-2xl border border-stone-200/80 bg-white/90 p-3 dark:border-stone-800 dark:bg-stone-950/90"
      aria-label="Dashboard sections"
    >
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
        Menu
      </p>
      <ul className="space-y-0.5">
        {LINKS.map(({ href, label, icon, match }) => {
          const active =
            match === "exact"
              ? pathname === href || pathname === `${href}/`
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--accent-soft)] font-medium text-[var(--accent-from)] dark:text-[var(--accent-to)]"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900",
                )}
              >
                <span className="text-base leading-none" aria-hidden>
                  {icon}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
