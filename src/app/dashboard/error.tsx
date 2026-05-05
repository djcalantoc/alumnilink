"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
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
    <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-4xl" aria-hidden>
        🌤️
      </p>
      <h1 className="mt-4 text-lg font-semibold text-stone-900 dark:text-stone-50">
        Couldn’t load your home
      </h1>
      <p className="mt-2 max-w-sm text-sm text-stone-600 dark:text-stone-400">
        Something went wrong. Your data is safe — try a quick refresh.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="social-pill-btn rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
        >
          Try again
        </button>
        <Link
          href="/dashboard/profile"
          className="social-pill-btn rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 dark:border-stone-600 dark:text-stone-100"
        >
          Profile
        </Link>
      </div>
    </main>
  );
}
