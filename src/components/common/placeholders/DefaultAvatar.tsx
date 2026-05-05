"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  iconClassName?: string;
};

/** Avatar-shaped gradient placeholder — no photo asset. */
export function DefaultAvatar({ className, iconClassName }: Props) {
  return (
    <div
      className={cn(
        "flex size-full min-h-0 min-w-0 items-center justify-center rounded-[inherit] bg-gradient-to-br from-purple-400 via-fuchsia-500 to-pink-500 text-white",
        className,
      )}
    >
      <User
        className={cn(
          "size-[38%] max-h-9 min-h-3.5 opacity-80",
          iconClassName,
        )}
        strokeWidth={1.75}
        aria-hidden
      />
    </div>
  );
}
