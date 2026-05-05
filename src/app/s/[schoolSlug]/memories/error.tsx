"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SchoolMemoriesError({
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
        <h1 className="text-lg font-semibold text-red-900 dark:text-red-200">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-red-800 dark:text-red-300">
          We could not show the memory wall. Try again in a moment.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-10 rounded-xl bg-red-900 px-4 text-sm font-medium text-white hover:bg-red-800 dark:bg-red-200 dark:text-red-950 dark:hover:bg-white"
          >
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-xl border border-red-300 px-4 text-sm font-medium text-red-900 dark:border-red-800 dark:text-red-100"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
