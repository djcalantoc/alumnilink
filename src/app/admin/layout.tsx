import { AppShell } from "@/components/layout/AppShell";
import { RoleSidebar } from "@/components/layout/RoleSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireSuperAdmin();

  const userLabel =
    user.email?.trim() ||
    user.user_metadata?.full_name?.trim?.() ||
    user.user_metadata?.name?.trim?.() ||
    "Admin";

  return (
    <AppShell
      sidebar={<RoleSidebar role="super_admin" />}
      topBar={
        <TopBar
          variant="console"
          brandHref="/admin"
          scopeLabel="Super Admin"
          title="Console"
          subtitle="Manage AlumniLink communities"
          userLabel={userLabel}
        />
      }
    >
      {children}
    </AppShell>
  );
}
