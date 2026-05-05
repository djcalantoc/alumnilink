"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/cn";

export type DashboardDirectoryNav = {
  yourSchool: string;
  batchmates: string;
  classmates: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match?: "exact";
};

const EXPLORE_ITEMS: NavItem[] = [
  { href: "/dashboard/memories", label: "Memories", icon: "auto_awesome" },
  { href: "/dashboard/events", label: "Events", icon: "event" },
  { href: "/dashboard/polls", label: "Polls", icon: "poll" },
  { href: "/dashboard/network", label: "Alumni Web", icon: "language" },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/dashboard/profile", label: "Profile", icon: "person" },
  { href: "/dashboard/profile", label: "Settings", icon: "settings" },
];

type Props = {
  directoryNav: DashboardDirectoryNav;
};

function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function DashboardSidebar({ directoryNav }: Props) {
  const pathname = usePathname();

  function isActive(href: string, match?: "exact"): boolean {
    if (match === "exact") {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavLink({
    item,
    forcedActive,
  }: {
    item: NavItem;
    forcedActive?: boolean;
  }) {
    const active =
      forcedActive !== undefined ? forcedActive : isActive(item.href, item.match);
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200",
          active
            ? "bg-purple-100 font-medium text-purple-600"
            : "font-medium text-gray-600 hover:bg-gray-100",
        )}
      >
        <MaterialIcon name={item.icon} className="text-[22px]" />
        {item.label}
      </Link>
    );
  }

  const mainItems: Array<
    NavItem & { forcedActive?: boolean }
  > = [
    { href: "/dashboard", label: "Home", icon: "home", match: "exact" },
    {
      href: directoryNav.yourSchool,
      label: "Your School",
      icon: "school",
      forcedActive: pathname.startsWith("/dashboard/school"),
    },
    {
      href: directoryNav.batchmates,
      label: "Batchmates",
      icon: "groups",
      forcedActive: pathname.startsWith("/dashboard/batchmates"),
    },
    {
      href: directoryNav.classmates,
      label: "Classmates",
      icon: "group",
      forcedActive: pathname.startsWith("/dashboard/classmates"),
    },
  ];

  return (
    <aside
      className="sticky top-4 z-50 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex md:flex-col"
      aria-label="Dashboard navigation"
    >
      <div className="mb-6 px-2">
        <Link href="/dashboard" className="block">
          <h1 className="text-lg font-semibold text-purple-600">AlumniLink</h1>
          <p className="text-xs text-gray-400">Digital Homecoming</p>
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
        <div>
          <SectionLabel className="mt-0">Main</SectionLabel>
          <ul className="space-y-2">
            {mainItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  item={{
                    href: item.href,
                    label: item.label,
                    icon: item.icon,
                    match: item.match,
                  }}
                  forcedActive={item.forcedActive}
                />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionLabel className="mt-6">Explore</SectionLabel>
          <ul className="space-y-2">
            {EXPLORE_ITEMS.map((item) => (
              <li key={item.label}>
                <NavLink item={item} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="mt-6 shrink-0 border-t border-gray-100 pt-4">
        <SectionLabel className="mt-0">Account</SectionLabel>
        <ul className="space-y-2">
          {ACCOUNT_ITEMS.map((item) => (
            <li key={`${item.label}-${item.icon}`}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
        <LogoutButton className="mt-3 h-auto min-h-10 w-full justify-start gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
          <>
            <MaterialIcon name="logout" className="text-[22px]" />
            <span>Sign out</span>
          </>
        </LogoutButton>
      </div>
    </aside>
  );
}
