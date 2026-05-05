"use client";

import { cn } from "@/lib/cn";

type Props = {
  /** Total profiles in the current subgraph (for caption) */
  profileCount: number;
  edgeCount: number;
  className?: string;
};

/** Lightweight decorative preview — not the interactive map. */
export function ConnectionGraphPreview({
  profileCount,
  edgeCount,
  className,
}: Props) {
  const centerX = 100;
  const centerY = 58;
  const radius = 38;
  const peerNodes =
    profileCount <= 1 ? 0 : Math.min(profileCount - 1, 6);
  const angles = Array.from({ length: peerNodes }, (_, i) => {
    return (2 * Math.PI * i) / Math.max(peerNodes, 1) - Math.PI / 2;
  });

  return (
    <div
      className={cn("rounded-2xl border border-stone-200/80 bg-stone-50/90 p-3 dark:border-stone-800 dark:bg-stone-900/50", className)}
      role="img"
      aria-label={`Network preview: about ${profileCount} people and ${edgeCount} connections in this view.`}
    >
      <svg
        viewBox="0 0 200 116"
        className="mx-auto h-24 w-full max-w-[200px] text-[var(--accent-from)]"
        fill="none"
      >
        {angles.map((a, i) => {
          const x = centerX + radius * Math.cos(a);
          const y = centerY + radius * Math.sin(a);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.22}
              strokeWidth={1.25}
            />
          );
        })}
        {angles.map((a, i) => {
          const x = centerX + radius * Math.cos(a);
          const y = centerY + radius * Math.sin(a);
          return (
            <circle
              key={`n-${i}`}
              cx={x}
              cy={y}
              r={5}
              className="fill-white stroke-stone-300 dark:fill-stone-950 dark:stroke-stone-600"
              strokeWidth={1.25}
            />
          );
        })}
        <circle
          cx={centerX}
          cy={centerY}
          r={9}
          className="fill-[var(--accent-from)] stroke-white dark:stroke-stone-950"
          strokeWidth={2}
        />
      </svg>
      <p className="mt-1 text-center text-[11px] leading-snug text-stone-500 dark:text-stone-400">
        {profileCount} {profileCount === 1 ? "person" : "people"} in this
        view · {edgeCount}{" "}
        {edgeCount === 1 ? "link" : "links"}
      </p>
    </div>
  );
}
