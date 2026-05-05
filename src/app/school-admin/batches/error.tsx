"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function BatchesError({
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
      className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
      role="alert"
    >
      <p className="font-medium text-red-900 dark:text-red-200">
        Something went wrong
      </p>
      <p className="mt-2 text-sm text-red-800 dark:text-red-300">
        {error.message || "Could not load batches."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/school-admin"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-900 dark:border-stone-600 dark:text-stone-100"
        >
          School admin home
        </Link>
      </div>
    </div>
  );
}
