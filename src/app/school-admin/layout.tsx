import { AppShell } from "@/components/layout/AppShell";
import { RoleSidebar } from "@/components/layout/RoleSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { requireSchoolAdminAreaUser } from "@/features/school-batch-sections/lib/access";

export default async function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireSchoolAdminAreaUser();

  const userLabel =
    user.email?.trim() ||
    user.user_metadata?.full_name?.trim?.() ||
    user.user_metadata?.name?.trim?.() ||
    "School admin";

  return (
    <AppShell
      sidebar={<RoleSidebar role="school_admin" />}
      topBar={
        <TopBar
          variant="console"
          brandHref="/school-admin"
          scopeLabel="School Admin"
          title="Console"
          subtitle="Community tools & moderation"
          userLabel={userLabel}
        />
      }
    >
      {children}
    </AppShell>
  );
}
