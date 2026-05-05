import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Settings"
        description="Super Admin preferences and automation hooks."
      />
      <div className="rounded-2xl border border-white/80 bg-white/95 p-6 text-sm text-stone-600 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-400 dark:shadow-black/40">
        <p>
          Operational toggles remain environment-driven until policy workflows
          ship.
        </p>
      </div>
    </div>
  );
}
