"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SafeImage } from "@/components/common/SafeImage";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";
import { DefaultAvatar } from "@/components/common/placeholders";
import { LogoutButton } from "@/features/auth/components/logout-button";

type Props = {
  avatarUrl: string | null;
  displayName: string | null;
  unreadNotifications: number;
  /** Path + optional school query for directory search (e.g. `/dashboard/school?schoolId=…`). */
  peopleSearchBasePath: string;
};

export function DashboardTopBar({
  avatarUrl,
  displayName,
  unreadNotifications,
  peopleSearchBasePath,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    startTransition(() => {
      try {
        const base =
          typeof window !== "undefined"
            ? new URL(peopleSearchBasePath, window.location.origin)
            : new URL(
                peopleSearchBasePath.startsWith("/")
                  ? `http://local.invalid${peopleSearchBasePath}`
                  : peopleSearchBasePath,
              );
        if (term) {
          base.searchParams.set("q", term);
        } else {
          base.searchParams.delete("q");
        }
        const path = base.pathname + base.search;
        router.push(path);
      } catch {
        router.push(peopleSearchBasePath);
      }
    });
  }

  return (
    <header className="sticky top-0 z-40 mb-2 flex h-16 shrink-0 items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/95 px-4 shadow-sm backdrop-blur-md md:top-4">
      <form
        onSubmit={onSearchSubmit}
        className="relative max-w-md flex-1 md:max-w-96"
      >
        <MaterialIcon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
        />
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={pending}
          className="w-full rounded-full border border-transparent bg-slate-100 py-2 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          placeholder="Search your school directory..."
          type="search"
          autoComplete="off"
        />
      </form>

      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-4 md:gap-6">
        <LogoutButton className="md:hidden min-h-9 shrink-0 px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
          Sign out
        </LogoutButton>
        <Link
          href="/dashboard/notifications"
          className="relative text-slate-500 transition-colors hover:text-indigo-600"
          aria-label="Notifications"
        >
          <MaterialIcon name="notifications" />
          {unreadNotifications > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-600" />
          ) : null}
        </Link>
        <Link
          href="/dashboard/notifications"
          className="text-slate-500 transition-colors hover:text-indigo-600"
          aria-label="Activity and updates"
          title="Updates — not a chat inbox"
        >
          <MaterialIcon name="chat" />
        </Link>
        <Link
          href="/dashboard/profile"
          className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-indigo-100 bg-indigo-50"
        >
          <SafeImage
            src={avatarUrl}
            fallback={<DefaultAvatar />}
            alt={displayName?.trim() ? `Profile: ${displayName}` : "Your profile"}
            className="size-full rounded-[inherit]"
            imgClassName="object-cover"
          />
        </Link>
      </div>
    </header>
  );
}
