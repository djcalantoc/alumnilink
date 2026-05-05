import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Users",
};

export default function AdminUsersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Users"
        description="Search alumni registrations across schools."
      />
      <div className="rounded-2xl border border-white/80 bg-white/95 p-6 text-sm text-stone-600 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-400 dark:shadow-black/40">
        <p>
          Advanced directory search will mirror Supabase Auth + alumni profiles —
          export CSV via dashboard meanwhile.
        </p>
      </div>
    </div>
  );
}
