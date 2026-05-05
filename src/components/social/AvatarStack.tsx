import { cn } from "@/lib/cn";
import { Avatar, type AvatarSize } from "@/components/social/Avatar";

export type AvatarStackItem = {
  id: string;
  src?: string | null;
  name?: string | null;
};

type AvatarStackProps = {
  people: AvatarStackItem[];
  /** Max faces shown; remainder as +N */
  max?: number;
  size?: AvatarSize;
  className?: string;
};

/**
 * Overlapping avatars — e.g. “who’s going”, memory contributors.
 */
export function AvatarStack({
  people,
  max = 4,
  size = "sm",
  className,
}: AvatarStackProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  if (shown.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center", className)}>
      {shown.map((p, i) => (
        <div
          key={p.id}
          className={cn(i > 0 && "-ml-2")}
          style={{ zIndex: shown.length - i }}
        >
          <Avatar src={p.src} name={p.name} size={size} ring />
        </div>
      ))}
      {extra > 0 ? (
        <div
          className={cn(
            "-ml-2 flex items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-700 ring-2 ring-white dark:bg-stone-700 dark:text-stone-200 dark:ring-stone-950",
            size === "xs" && "size-7",
            size === "sm" && "size-9",
            size === "md" && "size-11",
            size === "lg" && "size-14",
            size === "xl" && "size-20",
          )}
          style={{ zIndex: 0 }}
        >
          +{extra}
        </div>
      ) : null}
    </div>
  );
}
