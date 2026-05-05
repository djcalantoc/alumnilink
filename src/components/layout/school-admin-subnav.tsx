"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";

function SchoolAdminSubNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const q = schoolId ? `?schoolId=${schoolId}` : "";

  const links = [
    { href: `/school-admin${q}`, label: "Overview", match: "/school-admin" },
    { href: `/school-admin/batches${q}`, label: "Batches" },
    { href: `/school-admin/sections${q}`, label: "Sections" },
    { href: `/school-admin/alumni-approvals${q}`, label: "Alumni" },
    { href: `/school-admin/memories${q}`, label: "Memories" },
    { href: `/school-admin/events${q}`, label: "Events" },
    { href: `/school-admin/polls${q}`, label: "Polls" },
  ] as const;

  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-stone-200 pb-3 dark:border-stone-800"
      aria-label="School admin"
    >
      {links.map((link) => {
        const pathOnly = link.href.split("?")[0];
        const active =
          "match" in link
            ? pathname === link.match
            : pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
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

function SubNavFallback() {
  return (
    <div
      className="h-11 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-900"
      aria-hidden
    />
  );
}

export function SchoolAdminSubNav() {
  return (
    <Suspense fallback={<SubNavFallback />}>
      <SchoolAdminSubNavInner />
    </Suspense>
  );
}
