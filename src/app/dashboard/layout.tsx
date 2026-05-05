import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { RoleSidebar } from "@/components/layout/RoleSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardFab } from "@/components/dashboard/DashboardFab";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { countUnreadNotifications } from "@/features/notifications/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ count: unread }, { data: profileRow }] = await Promise.all([
    countUnreadNotifications(supabase, user.id),
    supabase
      .from("alumni_profiles")
      .select("photo_url, display_name, school_id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const p = profileRow as {
    photo_url: string | null;
    display_name: string | null;
    school_id: string;
  } | null;

  const schoolDirectorySuffix = p?.school_id
    ? `?schoolId=${encodeURIComponent(p.school_id)}`
    : "";

  const directoryNav = {
    yourSchool: p?.school_id
      ? `/dashboard/school${schoolDirectorySuffix}`
      : "/dashboard/profile",
    batchmates: p?.school_id
      ? `/dashboard/batchmates${schoolDirectorySuffix}`
      : "/dashboard/profile",
    classmates: p?.school_id
      ? `/dashboard/classmates${schoolDirectorySuffix}`
      : "/dashboard/profile",
  };

  const peopleSearchBasePath = directoryNav.yourSchool;

  return (
    <div data-dashboard-chrome data-dashboard-shell>
      <AppShell
        sidebar={<RoleSidebar role="alumni" directoryNav={directoryNav} />}
        topBar={
          <TopBar
            variant="alumni"
            avatarUrl={p?.photo_url ?? null}
            displayName={p?.display_name?.trim() ?? null}
            unreadNotifications={unread}
            peopleSearchBasePath={peopleSearchBasePath}
          />
        }
        bottomNav={<MobileBottomNav directoryNav={directoryNav} />}
        floatingExtras={<DashboardFab />}
      >
        {children}
      </AppShell>
    </div>
  );
}
