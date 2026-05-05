import { AppShell } from "@/components/layout/AppShell";
import { RoleSidebar } from "@/components/layout/RoleSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { requirePlatformOwner } from "@/features/platform-owner/lib/guard";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requirePlatformOwner();

  const userLabel =
    user.email?.trim() ||
    user.user_metadata?.full_name?.trim?.() ||
    user.user_metadata?.name?.trim?.() ||
    "Owner";

  return (
    <AppShell
      sidebar={<RoleSidebar role="owner" />}
      topBar={
        <TopBar
          variant="console"
          brandHref="/owner"
          scopeLabel="Platform"
          title="Owner console"
          subtitle="Cross-school operations & governance"
          userLabel={userLabel}
          showMemberAppLink
        />
      }
    >
      {children}
    </AppShell>
  );
}
