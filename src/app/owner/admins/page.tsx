import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { requirePlatformOwner } from "@/features/platform-owner/lib/guard";

export const metadata: Metadata = {
  title: "Owners / Admins",
};

export default async function OwnerAdminsPage() {
  await requirePlatformOwner();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Owners / Admins"
        description="Delegate platform owners and super admins. Detailed provisioning UI ships next."
      />
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/80 p-8 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-950/60 dark:text-stone-400">
        <p>
          Manage elevated accounts via Supabase Auth metadata (
          <code className="rounded bg-stone-100 px-1 dark:bg-stone-900">
            app_metadata.role
          </code>{" "}
          /{" "}
          <code className="rounded bg-stone-100 px-1 dark:bg-stone-900">
            user_metadata.global_role
          </code>
          ) until this console gains assignment workflows.
        </p>
      </div>
    </div>
  );
}
