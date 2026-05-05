"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/schools", label: "Schools" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-stone-200 pb-3 dark:border-stone-800"
      aria-label="Admin"
    >
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-stone-100 font-medium text-stone-900 dark:bg-stone-800 dark:text-stone-50"
                : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
