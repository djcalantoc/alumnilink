"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SafeImageProps = Omit<
  React.ComponentPropsWithoutRef<"img">,
  "src" | "onError"
> & {
  src?: string | null;
  alt: string;
  /** Rendered when there is no URL or the remote image fails — never uses a broken `<img>`. */
  fallback: ReactNode;
  /** Merged onto the `<img>` when shown (e.g. `object-[center_20%]`). Wrapper uses `className`. */
  imgClassName?: string;
};

function normalizeSrc(raw: string | null | undefined): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim();
}

export function SafeImage({
  src,
  alt,
  fallback,
  className,
  imgClassName,
  ...rest
}: SafeImageProps) {
  const normalized = normalizeSrc(src);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [normalized]);

  const showImg = normalized.length > 0 && !broken;

  return (
    <span className={cn("relative inline-block overflow-hidden", className)}>
      {showImg ? (
        <img
          {...rest}
          alt={alt}
          className={cn(
            "absolute inset-0 size-full object-cover",
            imgClassName,
          )}
          src={normalized}
          onError={() => setBroken(true)}
        />
      ) : (
        <>
          <span className="sr-only">{alt}</span>
          <span className="flex size-full min-h-full min-w-full">{fallback}</span>
        </>
      )}
    </span>
  );
}
