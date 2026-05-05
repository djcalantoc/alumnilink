import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Reports",
};

export default function AdminReportsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Reports"
        description="Platform KPIs, funnel charts, and export-ready aggregates."
      />
      <div className="rounded-2xl border border-white/80 bg-white/95 p-6 text-sm text-stone-600 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-400 dark:shadow-black/40">
        <p>
          Plug BI tooling or SQL views — reporting canvas landing here once metrics
          are finalized.
        </p>
      </div>
    </div>
  );
}
