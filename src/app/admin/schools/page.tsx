import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SchoolsList } from "@/features/super-admin-schools/components/schools-list";

export const metadata: Metadata = {
  title: "Schools",
};

function SchoolsListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      <div className="h-10 w-full animate-pulse rounded-lg bg-stone-100 dark:bg-stone-900" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-stone-100 dark:bg-stone-900" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}

export default function AdminSchoolsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Schools
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            All schools on AlumniLink.
          </p>
        </div>
        <Link
          href="/admin/schools/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          New school
        </Link>
      </div>

      <Suspense fallback={<SchoolsListSkeleton />}>
        <SchoolsList />
      </Suspense>
    </div>
  );
}
