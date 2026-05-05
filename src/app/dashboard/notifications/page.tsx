import type { Metadata } from "next";
import Link from "next/link";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import { fetchNotificationsForUser } from "@/features/notifications/lib/queries";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function DashboardNotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return null;
  }

  const { rows, error } = await fetchNotificationsForUser(supabase, user.id);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Notifications
        </h1>
        <div
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-6 dark:border-red-900/50 dark:bg-red-950/40"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          <p className="mt-3 text-sm">
            <Link
              href="/dashboard"
              className="font-medium text-red-900 underline-offset-4 hover:underline dark:text-red-100"
            >
              Back to dashboard
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Tags, hellos, reconnect updates, and poll notices.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-teal-800 underline-offset-4 hover:underline dark:text-teal-300"
        >
          Dashboard
        </Link>
      </div>

      <div className="mt-8">
        <NotificationsList notifications={rows} />
      </div>
    </main>
  );
}
