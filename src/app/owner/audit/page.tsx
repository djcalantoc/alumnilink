import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { requirePlatformOwner } from "@/features/platform-owner/lib/guard";

export const metadata: Metadata = {
  title: "Audit logs",
};

export default async function OwnerAuditPage() {
  await requirePlatformOwner();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Audit logs"
        description="Immutable trail of privileged actions across schools and accounts."
      />
      <div className="rounded-2xl border border-white/80 bg-white/95 p-6 text-sm text-stone-600 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-400 dark:shadow-black/40">
        <p>
          Wire this view to Supabase logs, Logflare, or your SIEM. Until then,
          export Auth events from the Supabase dashboard when investigating access
          changes.
        </p>
      </div>
    </div>
  );
}
