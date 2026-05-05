"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SchoolAdminEventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 dark:border-red-900/50 dark:bg-red-950/40"
      role="alert"
    >
      <p className="font-medium text-red-900 dark:text-red-200">
        Events failed to load
      </p>
      <p className="mt-2 text-sm text-red-800 dark:text-red-300">
        Try again or return to school admin.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-10 rounded-xl bg-red-900 px-4 text-sm font-medium text-white hover:bg-red-800"
        >
          Retry
        </button>
        <Link
          href="/school-admin"
          className="inline-flex min-h-10 items-center rounded-xl border border-red-300 px-4 text-sm font-medium text-red-900 dark:border-red-800 dark:text-red-100"
        >
          School admin
        </Link>
      </div>
    </div>
  );
}
