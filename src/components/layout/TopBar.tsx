"use client";

import Link from "next/link";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { cn } from "@/lib/cn";

export type AlumniTopBarProps = {
  variant: "alumni";
  avatarUrl: string | null;
  displayName: string | null;
  unreadNotifications: number;
  peopleSearchBasePath: string;
};

export type ConsoleTopBarProps = {
  variant: "console";
  /** Sidebar logo target for this console. */
  brandHref: string;
  /** Short context label, e.g. “Platform”, “Super Admin”. */
  scopeLabel: string;
  title: string;
  subtitle?: string;
  /** Shown in the avatar badge (e.g. email initial). */
  userLabel: string;
  /** Optional escape hatch to the member experience. */
  showMemberAppLink?: boolean;
};

export type TopBarProps = AlumniTopBarProps | ConsoleTopBarProps;

function ConsoleTopBar({
  brandHref,
  scopeLabel,
  title,
  subtitle,
  userLabel,
  showMemberAppLink = true,
}: Omit<ConsoleTopBarProps, "variant">) {
  const initial = (userLabel || "?").slice(0, 1).toUpperCase();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 mb-2 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-lg shadow-stone-900/5 backdrop-blur-md md:top-4 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <Link
          href={brandHref}
          className="shrink-0 text-lg font-bold tracking-tight text-purple-600 dark:text-purple-400"
        >
          AlumniLink
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            {scopeLabel}
          </p>
          <p className="truncate text-base font-bold text-stone-900 dark:text-stone-50">
            {title}
          </p>
          {subtitle ? (
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {showMemberAppLink ? (
          <Link
            href="/dashboard"
            className="hidden rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-900 sm:inline-flex"
          >
            Member app
          </Link>
        ) : null}
        <Link
          href="/dashboard/profile"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-purple-100 bg-purple-50 text-sm font-bold text-purple-800 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-200"
          aria-label="Account"
        >
          <span>{initial}</span>
        </Link>
      </div>
    </header>
  );
}

/** Alumni directory search + alerts — same behavior as the dashboard header, styled for AppShell. */
function AlumniTopBarShell(props: Omit<AlumniTopBarProps, "variant">) {
  return (
    <div className="[&_header]:border-white/80 [&_header]:shadow-lg [&_header]:shadow-stone-900/5 dark:[&_header]:border-stone-800 dark:[&_header]:shadow-black/40">
      <DashboardTopBar
        avatarUrl={props.avatarUrl}
        displayName={props.displayName}
        unreadNotifications={props.unreadNotifications}
        peopleSearchBasePath={props.peopleSearchBasePath}
      />
    </div>
  );
}

// Re-export pattern: single component entrypoint for layouts.
export function TopBar(props: TopBarProps) {
  if (props.variant === "alumni") {
    const { variant: _v, ...rest } = props;
    return <AlumniTopBarShell {...rest} />;
  }
  const { variant: _v, ...rest } = props;
  return <ConsoleTopBar {...rest} />;
}
