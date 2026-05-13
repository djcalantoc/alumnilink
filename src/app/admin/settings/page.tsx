import type { Metadata } from "next";
import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";
import { PlatformSettingsPanel } from "@/features/super-admin/components/platform-settings-panel";
import { fetchPlatformSettings } from "@/features/super-admin/lib/queries";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Settings — Super Admin" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireSuperAdmin();
  const settings = await fetchPlatformSettings(supabase);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Manage platform-wide configuration, toggles, and registration policies."
      />
      <PlatformSettingsPanel settings={settings} />
    </div>
  );
}
