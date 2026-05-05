import Link from "next/link";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_MEMORY_IMAGE } from "@/lib/images";
import { cn } from "@/lib/cn";

type LandingHeroProps = {
  className?: string;
};

export function LandingHero({ className }: LandingHeroProps) {
  return (
    <section
      className={cn(
        "relative left-1/2 w-[100vw] max-w-[100vw] -translate-x-1/2 overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500",
        className,
      )}
    >
      <div className="relative min-h-[540px] lg:grid lg:min-h-[min(92vh,720px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,48%)]">
        {/* Depth layers — left column */}
        <div className="relative z-10 flex flex-col justify-center px-6 pb-10 pt-14 sm:px-10 sm:pb-12 sm:pt-16 lg:pb-20 lg:pl-[max(1.5rem,calc(50vw-40rem))] lg:pr-10 lg:pt-20">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/95 via-fuchsia-600/85 to-pink-500/90 lg:from-violet-700 lg:via-fuchsia-600 lg:to-pink-500"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_15%_25%,rgba(255,255,255,0.28),transparent_58%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-violet-950/25"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 backdrop-blur-[3px] lg:backdrop-blur-[1px]"
            aria-hidden
          />

          {/* Floating hearts & sparkles */}
          <span
            className="landing-float pointer-events-none absolute right-[12%] top-[14%] text-4xl opacity-95 drop-shadow-lg sm:right-[18%] lg:top-[18%]"
            aria-hidden
          >
            ✨
          </span>
          <span
            className="landing-float landing-float-delay-sm pointer-events-none absolute left-[8%] top-[22%] text-2xl opacity-90"
            aria-hidden
          >
            💕
          </span>
          <span
            className="landing-float landing-float-delay-md pointer-events-none absolute bottom-[26%] left-[20%] text-3xl opacity-88 lg:bottom-[30%]"
            aria-hidden
          >
            ❤️
          </span>
          <span
            className="landing-float landing-float-delay-lg pointer-events-none absolute right-[22%] top-[38%] text-2xl opacity-85"
            aria-hidden
          >
            ✨
          </span>
          <span
            className="landing-float pointer-events-none absolute bottom-[18%] right-[30%] text-xl opacity-80 lg:right-[28%]"
            aria-hidden
          >
            💫
          </span>
          <span
            className="landing-float landing-float-delay-md pointer-events-none absolute left-[38%] top-[12%] text-lg opacity-75"
            aria-hidden
          >
            ✨
          </span>

          <div className="relative max-w-xl lg:max-w-lg xl:max-w-2xl">
            <h1 className="text-balance font-bold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-[2.85rem] xl:text-6xl">
              <span className="block">Find your batch.</span>
              <span className="mt-2 block bg-gradient-to-r from-amber-50 via-white to-pink-100 bg-clip-text text-transparent">
                Relive the hallway noise.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-snug text-white/92 sm:text-xl">
              Throwbacks, inside jokes, and the faces you&apos;ve been missing —
              in one place that actually feels like school.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <a
                href="#start-here"
                className="inline-flex min-h-14 min-w-[200px] items-center justify-center rounded-2xl bg-white px-10 text-base font-bold text-fuchsia-700 shadow-xl shadow-black/25 transition duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98] motion-reduce:transition-none"
              >
                Find your batch
              </a>
              <Link
                href="/login"
                className="inline-flex min-h-14 min-w-[160px] items-center justify-center rounded-2xl border-2 border-white/55 bg-white/12 px-10 text-base font-semibold text-white backdrop-blur-md transition duration-300 ease-out hover:scale-[1.03] hover:border-white/85 hover:bg-white/22 active:scale-[0.98] motion-reduce:transition-none"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Right: dominant photo (~half width on lg+) */}
        <div className="relative hidden min-h-0 lg:block">
          <SafeImage
            src={DEFAULT_MEMORY_IMAGE}
            fallback={
              <PhotoFallback
                src={DEFAULT_MEMORY_IMAGE}
                className="object-cover object-[center_22%]"
              />
            }
            alt="Alumni memories illustration"
            className="absolute inset-0 h-full w-full rounded-none"
            imgClassName="object-cover object-[center_22%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-900/55 via-fuchsia-900/15 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-violet-950/50 via-transparent to-pink-900/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 backdrop-blur-[0.5px]"
            aria-hidden
          />
        </div>

        {/* Mobile: photo strip — keeps hero visual, not a skinny text column only */}
        <div className="relative h-64 w-full sm:h-72 lg:hidden">
          <SafeImage
            src={DEFAULT_MEMORY_IMAGE}
            fallback={
              <PhotoFallback
                src={DEFAULT_MEMORY_IMAGE}
                className="object-cover object-[center_25%]"
              />
            }
            alt="Alumni memories illustration"
            className="absolute inset-0 h-full w-full rounded-none"
            imgClassName="object-cover object-[center_25%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-violet-900/88 via-fuchsia-600/45 to-pink-500/25" />
        </div>
      </div>
    </section>
  );
}
