import type { CSSProperties } from "react";
import Link from "next/link";
import type { LandingSchool } from "@/features/landing/lib/queries";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_SCHOOL_COVER } from "@/lib/images";
import { cn } from "@/lib/cn";

type SchoolPreviewCardProps = {
  school: LandingSchool;
  href: string;
  isMock?: boolean;
  className?: string;
};

/**
 * Campus-style preview tile — not a data table row.
 */
export function SchoolPreviewCard({
  school,
  href,
  isMock,
  className,
}: SchoolPreviewCardProps) {
  const accent =
    school.primary_color && /^#[0-9A-Fa-f]{6}$/.test(school.primary_color)
      ? school.primary_color
      : undefined;

  return (
    <Link
      href={href}
      className={cn(
        "social-card group block overflow-hidden rounded-2xl border border-stone-200/80 bg-white text-left dark:border-stone-800 dark:bg-stone-950",
        className,
      )}
      style={
        accent
          ? ({
              "--accent-from": accent,
              "--accent-to": accent,
            } as CSSProperties)
          : undefined
      }
    >
      <div className="relative h-32 overflow-hidden sm:h-36">
        <SafeImage
          src={school.cover_photo_url}
          fallback={<PhotoFallback src={DEFAULT_SCHOOL_COVER} />}
          alt={school.name ? `Cover image for ${school.name}` : "School cover"}
          className="absolute inset-0 size-full rounded-none"
          imgClassName="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
          style={
            accent
              ? {
                  background: `linear-gradient(to top, rgba(0,0,0,0.55), transparent 40%), linear-gradient(135deg, ${accent}33, transparent 65%)`,
                }
              : undefined
          }
          aria-hidden
        />
        {isMock ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            Example
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 dark:text-stone-50">
          {school.name}
        </h3>
        <p className="mt-1.5 text-sm font-medium text-[var(--accent-from)]">
          Join your batch →
        </p>
      </div>
    </Link>
  );
}
