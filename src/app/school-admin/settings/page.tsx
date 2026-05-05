import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";

export const metadata: Metadata = {
  title: "School settings",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function SchoolAdminSettingsPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const ctx = await resolveSchoolManagementContext(
    "/school-admin/settings",
    requested,
  );

  if (!ctx.ok) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Cannot open settings
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{ctx.error}</p>
      </div>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <SchoolPicker
        schools={ctx.schools}
        targetPath="/school-admin/settings"
        title="Choose a school"
        description="Configure branding and visibility per campus."
      />
    );
  }

  const { schoolId, schools } = ctx;
  const schoolName = schools.find((s) => s.id === schoolId)?.name ?? "School";
  const q = `?schoolId=${encodeURIComponent(schoolId)}`;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        title="School settings"
        description={`${schoolName} — branding, visibility, and moderation defaults.`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/school-admin/batches${q}`}
          className="rounded-2xl border border-white/80 bg-white/95 p-5 text-sm font-semibold text-stone-800 shadow-lg shadow-stone-900/5 hover:border-purple-200 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-100 dark:hover:border-purple-900 dark:shadow-black/40"
        >
          Batches & cohorts
        </Link>
        <Link
          href={`/school-admin/sections${q}`}
          className="rounded-2xl border border-white/80 bg-white/95 p-5 text-sm font-semibold text-stone-800 shadow-lg shadow-stone-900/5 hover:border-purple-200 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-100 dark:hover:border-purple-900 dark:shadow-black/40"
        >
          Sections & homerooms
        </Link>
        <Link
          href={`/school-admin/memories${q}`}
          className="rounded-2xl border border-white/80 bg-white/95 p-5 text-sm font-semibold text-stone-800 shadow-lg shadow-stone-900/5 hover:border-purple-200 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-100 dark:hover:border-purple-900 dark:shadow-black/40"
        >
          Memory moderation
        </Link>
        <Link
          href={`/school-admin/events${q}`}
          className="rounded-2xl border border-white/80 bg-white/95 p-5 text-sm font-semibold text-stone-800 shadow-lg shadow-stone-900/5 hover:border-purple-200 dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-100 dark:hover:border-purple-900 dark:shadow-black/40"
        >
          Events calendar
        </Link>
      </div>

      <p className="text-sm text-stone-600 dark:text-stone-400">
        Deep overrides continue to live on the Super Admin school record until this
        panel exposes color kits and directory toggles.
      </p>
    </div>
  );
}
