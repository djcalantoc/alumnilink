"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardPollsError({
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
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6">
      <div
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Polls could not load
        </p>
        <p className="mt-2 text-sm text-red-800 dark:text-red-300">
          Try again or return to your dashboard.
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
            href="/dashboard"
            className="inline-flex min-h-10 items-center rounded-xl border border-red-300 px-4 text-sm font-medium text-red-900 dark:border-red-800 dark:text-red-100"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
