"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/cn";

/** Alumni directory links (school-scoped query params). */
export type AlumniDirectoryNav = {
  yourSchool: string;
  batchmates: string;
  classmates: string;
};

export type ConsoleRole = "owner" | "super_admin" | "school_admin" | "alumni";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match?: "exact";
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
        "mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

function useSchoolAdminSuffix(): string {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  return schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : "";
}

function SchoolAdminRoleSidebar({
  directoryNav,
}: {
  directoryNav?: AlumniDirectoryNav;
}) {
  const q = useSchoolAdminSuffix();
  return (
    <RoleSidebarInner role="school_admin" directoryNav={directoryNav} schoolQuerySuffix={q} />
  );
}

function RoleSidebarInner({
  role,
  directoryNav,
  schoolQuerySuffix = "",
}: {
  role: ConsoleRole;
  directoryNav?: AlumniDirectoryNav;
  /** Only for `school_admin` — preserves `schoolId` across nav links. */
  schoolQuerySuffix?: string;
}) {
  const pathname = usePathname();
  const q = role === "school_admin" ? schoolQuerySuffix : "";

  function navForRole(): {
    main: NavItem[];
    alumniExplore?: NavItem[];
    alumniAccount?: NavItem[];
  } {
    switch (role) {
      case "owner":
        return {
          main: [
            { href: "/owner", label: "Overview", icon: "dashboard", match: "exact" },
            { href: "/owner/schools", label: "Schools", icon: "school" },
            { href: "/owner/admins", label: "Owners / Admins", icon: "admin_panel_settings" },
            { href: "/owner/settings", label: "Platform Settings", icon: "tune" },
            { href: "/owner/audit", label: "Audit Logs", icon: "history" },
          ],
        };
      case "super_admin":
        return {
          main: [
            { href: "/admin", label: "Overview", icon: "dashboard", match: "exact" },
            { href: "/admin/schools", label: "Schools", icon: "school" },
            { href: "/admin/school-admins", label: "School Admins", icon: "badge" },
            { href: "/admin/users", label: "Users", icon: "group" },
            { href: "/admin/reports", label: "Reports", icon: "analytics" },
            { href: "/admin/settings", label: "Settings", icon: "settings" },
          ],
        };
      case "school_admin":
        return {
          main: [
            { href: `/school-admin${q}`, label: "Overview", icon: "dashboard", match: "exact" },
            { href: `/school-admin/alumni${q}`, label: "Alumni Management", icon: "group" },
            { href: `/school-admin/alumni-approvals${q}`, label: "Alumni Approvals", icon: "verified_user" },
            { href: `/school-admin/batches${q}`, label: "Batches", icon: "calendar_month" },
            { href: `/school-admin/sections${q}`, label: "Sections", icon: "grid_view" },
            { href: `/school-admin/memories${q}`, label: "Memories", icon: "auto_awesome" },
            { href: `/school-admin/events${q}`, label: "Events", icon: "event" },
            { href: `/school-admin/polls${q}`, label: "Polls", icon: "poll" },
            { href: `/school-admin/settings${q}`, label: "School Settings", icon: "settings" },
          ],
        };
      default:
        return {
          main: [],
          alumniExplore: [
            { href: "/dashboard/memories", label: "Memories", icon: "auto_awesome" },
            { href: "/dashboard/events", label: "Events", icon: "event" },
            { href: "/dashboard/polls", label: "Polls", icon: "poll" },
            { href: "/dashboard/network", label: "Alumni Web", icon: "language" },
          ],
          alumniAccount: [
            { href: "/dashboard/profile", label: "Profile", icon: "person" },
            { href: "/dashboard/settings", label: "Settings", icon: "settings" },
          ],
        };
    }
  }

  const conf = navForRole();

  const alumniMain: Array<NavItem & { forcedActive?: boolean }> =
    role === "alumni" && directoryNav
      ? [
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
        ]
      : [];

  function isActive(item: NavItem, forced?: boolean): boolean {
    if (forced !== undefined) {
      return forced;
    }
    if (item.match === "exact") {
      const base = item.href.split("?")[0];
      return pathname === base || pathname === `${base}/`;
    }
    const pathOnly = item.href.split("?")[0];
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
  }

  function NavLink({
    item,
    forcedActive,
  }: {
    item: NavItem;
    forcedActive?: boolean;
  }) {
    const active = isActive(item, forcedActive);
    return (
      <Link
        href={item.href}
        className={cn(
          "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200",
          active
            ? "bg-purple-100 font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-200"
            : "font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900",
        )}
      >
        <MaterialIcon name={item.icon} className="text-[22px]" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  const brandHref =
    role === "owner"
      ? "/owner"
      : role === "super_admin"
        ? "/admin"
        : role === "school_admin"
          ? `/school-admin${q}`
          : "/dashboard";

  const brandSubtitle =
    role === "owner"
      ? "Platform"
      : role === "super_admin"
        ? "Super Admin"
        : role === "school_admin"
          ? "School Admin"
          : "Member";

  const sidebarInner = (
    <>
      <div className="mb-5 px-2">
        <Link href={brandHref} className="block">
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            AlumniLink
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500">{brandSubtitle}</p>
        </Link>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700"
        aria-label="Primary"
      >
        {role === "alumni" && directoryNav ? (
          <>
            <SectionLabel className="mt-0">Main</SectionLabel>
            <ul className="space-y-1">
              {alumniMain.map((item) => (
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
            <SectionLabel className="mt-6">Explore</SectionLabel>
            <ul className="space-y-1">
              {(conf.alumniExplore ?? []).map((item) => (
                <li key={item.href}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
            <SectionLabel className="mt-6">Account</SectionLabel>
            <ul className="space-y-1">
              {(conf.alumniAccount ?? []).map((item) => (
                <li key={`${item.label}-${item.icon}`}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <SectionLabel className="mt-0">Menu</SectionLabel>
            <ul className="space-y-1">
              {conf.main.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="mt-4 shrink-0 border-t border-stone-100 pt-4 dark:border-stone-800">
        <LogoutButton className="h-auto min-h-10 w-full justify-start gap-3 rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100">
          <>
            <MaterialIcon name="logout" className="text-[22px]" />
            <span>Sign out</span>
          </>
        </LogoutButton>
      </div>
    </>
  );

  const mobileLinks: NavItem[] =
    role === "alumni" && directoryNav
      ? [
          ...alumniMain.map(({ href, label, icon, match }) => ({
            href,
            label,
            icon,
            match,
          })),
          ...(conf.alumniExplore ?? []),
        ]
      : conf.main;

  return (
    <>
      <aside
        className={cn(
          "sticky top-4 z-50 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-2xl border border-white/80 bg-white/95 p-4 shadow-lg shadow-stone-900/5 backdrop-blur-md md:flex dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40",
        )}
        aria-label="Sidebar navigation"
      >
        {sidebarInner}
      </aside>

      <nav
        className="-mx-1 flex gap-1 overflow-x-auto pb-2 pt-1 md:hidden [&::-webkit-scrollbar]:hidden"
        aria-label="Mobile navigation"
      >
        {mobileLinks.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-200"
                  : "border-transparent bg-white/90 text-stone-600 shadow-sm dark:bg-stone-900 dark:text-stone-300",
              )}
            >
              <MaterialIcon name={item.icon} className="text-lg" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarFallback() {
  return (
    <aside className="hidden w-64 shrink-0 md:block" aria-hidden>
      <div className="h-48 animate-pulse rounded-2xl bg-white/60 dark:bg-stone-900/60" />
    </aside>
  );
}

type Props = {
  role: ConsoleRole;
  directoryNav?: AlumniDirectoryNav;
};

export function RoleSidebar({ role, directoryNav }: Props) {
  if (role === "school_admin") {
    return (
      <Suspense fallback={<SidebarFallback />}>
        <SchoolAdminRoleSidebar directoryNav={directoryNav} />
      </Suspense>
    );
  }
  return <RoleSidebarInner role={role} directoryNav={directoryNav} />;
}
