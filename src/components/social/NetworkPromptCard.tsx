import Link from "next/link";
import { cn } from "@/lib/cn";

type NetworkPromptCardProps = {
  networkHref: string;
  className?: string;
};

export function NetworkPromptCard({
  networkHref,
  className,
}: NetworkPromptCardProps) {
  return (
    <section
      className={cn(
        "social-card rounded-2xl border border-stone-200/80 bg-gradient-to-br from-stone-50 via-white to-violet-50/60 px-5 py-8 text-center dark:border-stone-800 dark:from-stone-950 dark:via-stone-950 dark:to-violet-950/25 sm:px-8",
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
        Expand your network
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        Map classmates and requests in one place.
      </p>
      <Link
        href={networkHref}
        className="social-pill-btn mt-5 inline-flex min-h-11 items-center justify-center rounded-full social-gradient px-6 text-sm font-semibold text-white shadow-md"
      >
        Explore Alumni Web
      </Link>
    </section>
  );
}
