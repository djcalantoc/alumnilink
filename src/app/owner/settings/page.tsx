import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { requirePlatformOwner } from "@/features/platform-owner/lib/guard";

export const metadata: Metadata = {
  title: "Platform settings",
};

export default async function OwnerSettingsPage() {
  await requirePlatformOwner();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Platform settings"
        description="Global AlumniLink configuration — branding defaults, feature flags, and compliance controls."
      />
      <div className="rounded-2xl border border-white/80 bg-white/95 p-6 text-sm text-stone-600 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-400 dark:shadow-black/40">
        <p>
          Environment-driven settings remain in{" "}
          <code className="rounded bg-stone-100 px-1 dark:bg-stone-900">
            .env.local
          </code>
          . Promote keys carefully between staging and production.
        </p>
      </div>
    </div>
  );
}
