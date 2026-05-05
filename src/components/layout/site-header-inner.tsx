import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { resolveAuthLandingPath } from "@/features/auth/lib/resolve-redirect";
import { countUnreadNotifications } from "@/features/notifications/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function SiteHeaderInner() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let appHome = "/dashboard";
  let unreadNotifications = 0;
  if (user) {
    appHome = await resolveAuthLandingPath(supabase, user);
    const { count, error } = await countUnreadNotifications(supabase, user.id);
    if (!error) {
      unreadNotifications = count;
    }
  }

  return (
    <TopNav
      brand={
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-50"
        >
          AlumniLink
        </Link>
      }
      trailing={
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm text-stone-600 dark:text-stone-400 sm:gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="font-medium text-stone-900 underline-offset-4 hover:underline dark:text-stone-100"
              >
                Home
              </Link>
              <Link
                href={appHome}
                className="hidden underline-offset-4 hover:underline sm:inline"
              >
                Your school
              </Link>
              <Link
                href="/dashboard/notifications"
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                Notifications
                {unreadNotifications > 0 ? (
                  <span className="min-w-[1.25rem] rounded-full bg-[var(--accent-from)] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="font-medium text-stone-900 underline-offset-4 hover:underline dark:text-stone-100"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      }
    />
  );
}
