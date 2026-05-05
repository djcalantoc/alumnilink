import type { CSSProperties } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import {
  DEFAULT_EVENT_IMAGE,
  DEFAULT_MEMORY_IMAGE,
  DEFAULT_SCHOOL_COVER,
} from "@/lib/images";
import { cn } from "@/lib/cn";

/** Campus / alumni moments — centered crops read well in overlapping frames */
const COLLAGE = [
  {
    src: DEFAULT_MEMORY_IMAGE,
    position: "object-[center_35%]" as const,
  },
  {
    src: DEFAULT_EVENT_IMAGE,
    position: "object-[center_25%]" as const,
  },
  {
    src: DEFAULT_SCHOOL_COVER,
    position: "object-[center_40%]" as const,
  },
];

type Props = {
  firstName: string;
  exploreHref: string;
  primaryColor?: string | null;
  showProfileHint?: boolean;
  className?: string;
};

function CollagePhotos({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto flex h-[240px] w-full max-w-[340px] items-center justify-center sm:h-[268px] lg:h-[300px]",
        className,
      )}
    >
      {/* Back-left — sits behind */}
      <div
        className={cn(
          "absolute left-0 top-[10%] z-10 w-[58%] origin-center",
          "-rotate-[7deg] shadow-xl shadow-black/20",
        )}
      >
        <div className="overflow-hidden rounded-2xl ring-[3px] ring-white/70">
          <SafeImage
            src={COLLAGE[0].src}
            fallback={
              <PhotoFallback
                src={COLLAGE[0].src}
                className={cn("object-cover", COLLAGE[0].position)}
              />
            }
            alt=""
            className={cn(
              "aspect-[4/5] w-full bg-slate-200/80 dark:bg-stone-800/80",
            )}
            imgClassName={cn("object-cover", COLLAGE[0].position)}
          />
        </div>
      </div>

      {/* Front-center — focal photo */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 z-30 w-[62%] -translate-x-1/2 -translate-y-1/2 origin-center",
          "rotate-[4deg] shadow-2xl shadow-black/25",
        )}
      >
        <div className="overflow-hidden rounded-2xl ring-[3px] ring-white/90">
          <SafeImage
            src={COLLAGE[1].src}
            fallback={
              <PhotoFallback
                src={COLLAGE[1].src}
                className={cn("object-cover", COLLAGE[1].position)}
              />
            }
            alt=""
            className={cn(
              "aspect-[4/5] w-full bg-slate-200/80 dark:bg-stone-800/80",
            )}
            imgClassName={cn("object-cover", COLLAGE[1].position)}
          />
        </div>
      </div>

      {/* Back-right — peeks from behind */}
      <div
        className={cn(
          "absolute bottom-[6%] right-0 z-20 w-[56%] origin-center",
          "-rotate-[5deg] shadow-xl shadow-black/20",
        )}
      >
        <div className="overflow-hidden rounded-2xl ring-[3px] ring-white/70">
          <SafeImage
            src={COLLAGE[2].src}
            fallback={
              <PhotoFallback
                src={COLLAGE[2].src}
                className={cn("object-cover", COLLAGE[2].position)}
              />
            }
            alt=""
            className={cn(
              "aspect-[4/5] w-full bg-slate-200/80 dark:bg-stone-800/80",
            )}
            imgClassName={cn("object-cover", COLLAGE[2].position)}
          />
        </div>
      </div>
    </div>
  );
}

export function MemberHero({
  firstName,
  exploreHref,
  primaryColor,
  showProfileHint,
  className,
}: Props) {
  const overlayGradient =
    primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)
      ? `linear-gradient(115deg, ${primaryColor}e8 0%, #6366f1 42%, #c026d3 100%)`
      : "linear-gradient(115deg, #5b4dff 0%, #7c3aed 38%, #db2777 100%)";

  const layerStyle = { background: overlayGradient } as CSSProperties;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-xl shadow-violet-300/25 ring-1 ring-white/30",
        className,
      )}
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_minmax(300px,38%)]">
        <div className="relative flex min-h-[240px] flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:min-h-[300px]">
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.92]"
            style={layerStyle}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_90%_80%_at_20%_30%,rgba(255,255,255,0.2),transparent_55%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-black/25 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-0 backdrop-blur-[2px]"
            aria-hidden
          />

          <div className="relative z-10 max-w-xl">
            <h1 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.35rem]">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/92 sm:text-lg">
              Good to see you again. Let&apos;s relive the good old days and stay
              connected.
            </p>
            <Link
              href={exploreHref}
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-8 text-sm font-bold text-violet-700 shadow-lg transition hover:bg-violet-50 hover:shadow-xl active:scale-[0.98]"
            >
              Explore your school →
            </Link>
            {showProfileHint ? (
              <p className="mt-4 text-sm text-white/88">
                <Link
                  href="/dashboard/profile"
                  className="font-semibold underline underline-offset-2"
                >
                  Finish your profile
                </Link>{" "}
                to unlock your full school hub.
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative hidden min-h-[300px] bg-gradient-to-br from-violet-950/15 via-fuchsia-950/10 to-transparent lg:flex lg:items-center lg:justify-center lg:py-10 lg:pl-4 lg:pr-8">
          <CollagePhotos />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-violet-900/35 to-transparent" />
        </div>
      </div>

      {/* Mobile: overlapping trio */}
      <div className="relative border-t border-white/15 bg-gradient-to-b from-violet-950/20 to-violet-950/5 px-4 py-8 lg:hidden">
        <CollagePhotos className="max-w-[300px]" />
      </div>
    </section>
  );
}
