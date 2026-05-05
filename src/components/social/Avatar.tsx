import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { cn } from "@/lib/cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClass: Record<AvatarSize, string> = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

type AvatarProps = {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
  ring?: boolean;
};

/**
 * Rounded avatar — missing or broken URLs use an icon gradient placeholder.
 */
export function Avatar({
  src,
  alt = "",
  name,
  size = "md",
  className,
  ring = true,
}: AvatarProps) {
  const label = alt.trim() || name?.trim() || "Avatar";

  return (
    <SafeImage
      src={src}
      fallback={<DefaultAvatar />}
      alt={label}
      className={cn(
        "rounded-full",
        sizeClass[size],
        ring && "ring-2 ring-white dark:ring-stone-950",
        className,
      )}
      imgClassName="object-cover"
    />
  );
}
