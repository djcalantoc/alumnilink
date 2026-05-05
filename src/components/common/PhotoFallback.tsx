import { cn } from "@/lib/cn";

/** Static placeholder `<img>` for `SafeImage` when no remote URL (not used for profile avatars). */
export function PhotoFallback({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      className={cn("block size-full min-h-full object-cover", className)}
      draggable={false}
    />
  );
}
