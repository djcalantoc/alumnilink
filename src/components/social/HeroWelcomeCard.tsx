import type { CSSProperties } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_SCHOOL_COVER } from "@/lib/images";
import { cn } from "@/lib/cn";

type HeroWelcomeCardProps = {
  greetingName: string;
  subtitle?: string;
  exploreHref: string;
  /** School brand hex — blended into gradient */
  primaryColor?: string | null;
  showProfileHint?: boolean;
  className?: string;
};

export function HeroWelcomeCard({
  greetingName,
  subtitle,
  exploreHref,
  primaryColor,
  showProfileHint,
  className,
}: HeroWelcomeCardProps) {
  const overlayGradient =
    primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)
      ? `linear-gradient(90deg, ${primaryColor}ee 0%, #493ee5 50%, #a43073 100%)`
      : "linear-gradient(90deg, rgb(79 70 229) 0%, #493ee5 45%, #a43073 100%)";

  const layerStyle = {
    background: overlayGradient,
  } as CSSProperties;

  return (
    <section
      className={cn(
        "group relative flex min-h-[220px] flex-col justify-center overflow-hidden rounded-2xl p-8 text-white shadow-lg sm:p-10",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-90"
        style={layerStyle}
        aria-hidden
      />
      <SafeImage
        src={null}
        fallback={<PhotoFallback src={DEFAULT_SCHOOL_COVER} />}
        alt="School welcome graphic"
        className="absolute inset-0 z-0 size-full rounded-none opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
        imgClassName="object-cover"
      />
      <div className="relative z-10">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Welcome back, {greetingName}!
        </h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-indigo-100 sm:text-lg">
          {subtitle ??
            "Good to see you again — your batch, your memories, your corner of campus."}
        </p>
        <Link
          href="/dashboard/notifications"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-indigo-600 shadow-md transition-colors hover:bg-indigo-50"
        >
          Check invitations
        </Link>
        {showProfileHint ? (
          <p className="mt-3 text-xs text-white/85">
            <Link href="/dashboard/profile" className="underline underline-offset-2">
              Complete your profile
            </Link>{" "}
            to unlock your school hub — or{" "}
            <Link href={exploreHref} className="underline underline-offset-2">
              explore
            </Link>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
