import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "School admins",
};

export default function AdminSchoolAdminsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="School admins"
        description="Provision moderator access across campuses."
      />
      <div className="rounded-2xl border border-white/80 bg-white/95 p-6 text-sm text-stone-600 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-400 dark:shadow-black/40">
        <p>
          Assignment tooling arrives shortly — approve admins via Supabase{" "}
          <code className="rounded bg-stone-100 px-1 dark:bg-stone-900">
            school_admins
          </code>{" "}
          for now.
        </p>
      </div>
    </div>
  );
}
