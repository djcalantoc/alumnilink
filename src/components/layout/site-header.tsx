import Link from "next/link";
import { Suspense } from "react";
import { SiteHeaderInner } from "@/components/layout/site-header-inner";

function SiteHeaderFallback() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[var(--background)]/85 backdrop-blur-lg dark:border-stone-800/90">
      <div className="content-max flex h-14 items-center justify-between px-4 sm:px-6 md:px-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-50"
        >
          AlumniLink
        </Link>
        <div
          className="h-4 w-28 animate-pulse rounded-md bg-stone-200/80 dark:bg-stone-800"
          aria-hidden
        />
      </div>
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderFallback />}>
      <SiteHeaderInner />
    </Suspense>
  );
}
