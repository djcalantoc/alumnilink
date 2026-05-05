import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="mt-4 border-t border-stone-200/70 bg-gradient-to-b from-transparent to-stone-100/50 py-10 dark:border-stone-800 dark:to-stone-950/80">
      <div className="content-max px-4 text-center sm:px-6 md:px-8">
        <p className="text-sm font-medium text-stone-800 dark:text-stone-100">
          Made for hallway laughs, not spreadsheets.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          AlumniLink is a gentle home for your batch — photos, hellos, and
          reunions without the noise.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-stone-500 dark:text-stone-500">
          <Link
            href="/register"
            className="font-medium text-[var(--accent-from)] underline-offset-4 hover:underline"
          >
            Create account
          </Link>
          <Link href="/login" className="underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
