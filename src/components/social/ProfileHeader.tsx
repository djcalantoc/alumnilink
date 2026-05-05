import type { CSSProperties, ReactNode } from "react";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DefaultAvatar } from "@/components/common/placeholders";
import { DEFAULT_SCHOOL_COVER } from "@/lib/images";
import { cn } from "@/lib/cn";

type Props = {
  schoolName?: string;
  displayName: string;
  headline: string | null;
  photoUrl: string | null;
  coverUrl: string | null;
  /** Hex color e.g. #336699 — drives gradient when no cover */
  primaryColor: string | null;
  batchLabel: string;
  sectionLabel: string | null;
  /** Short friendly line instead of raw status badges */
  statusMessage: string | null;
  children?: ReactNode;
};

export function ProfileHeader({
  schoolName,
  displayName,
  headline,
  photoUrl,
  coverUrl,
  primaryColor,
  batchLabel,
  sectionLabel,
  statusMessage,
  children,
}: Props) {
  const accentStyle: CSSProperties | undefined =
    primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)
      ? ({
          "--accent-from": primaryColor,
          "--accent-to": primaryColor,
        } as CSSProperties)
      : undefined;

  return (
    <div
      className="social-card overflow-hidden rounded-2xl border border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-950"
      style={accentStyle}
    >
      <div className="relative h-40 overflow-hidden sm:h-44">
        <SafeImage
          src={coverUrl}
          fallback={<PhotoFallback src={DEFAULT_SCHOOL_COVER} />}
          alt={schoolName ? `Cover photo for ${schoolName}` : "School cover"}
          className="absolute inset-0 size-full rounded-none"
          imgClassName="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 to-black/50"
          aria-hidden
        />
      </div>

      <div className="relative px-4 pb-5 pt-0 text-center sm:px-6">
        <SafeImage
          src={photoUrl}
          fallback={<DefaultAvatar />}
          alt={`${displayName} profile photo`}
          className="mx-auto -mt-14 size-28 rounded-full border-4 border-white shadow-lg dark:border-stone-950 sm:-mt-16 sm:size-32"
          imgClassName="object-cover"
        />

        {schoolName ? (
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-[var(--accent-from)]">
            {schoolName}
          </p>
        ) : null}
        <h2
          className={cn(
            "text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-2xl",
            schoolName ? "mt-1" : "mt-4",
          )}
        >
          {displayName}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {batchLabel}
          {sectionLabel ? ` · ${sectionLabel}` : ""}
        </p>
        {headline?.trim() ? (
          <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            &ldquo;{headline.trim()}&rdquo;
          </p>
        ) : null}
        {statusMessage ? (
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            {statusMessage}
          </p>
        ) : null}
        {children ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              {children}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
