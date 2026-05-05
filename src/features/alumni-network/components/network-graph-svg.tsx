"use client";

import type { ConnectionType } from "@/features/alumni-network/lib/types";
import { CONNECTION_TYPE_LABELS } from "@/features/alumni-network/lib/constants";
import type { NetworkEdge } from "@/features/alumni-network/lib/types";
import type { NetworkProfileNode } from "@/features/alumni-network/lib/types";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { cn } from "@/lib/cn";

const EDGE_DASH: Record<ConnectionType, string> = {
  classmate: "0",
  batchmate: "4 3",
  seatmate: "2 4",
  friend: "6 3",
  clubmate: "1 3",
  schoolmate: "8 4",
  other: "2 2",
};

type Pos = { x: number; y: number };

function layoutRadial(
  rootId: string,
  profileIds: string[],
  depthByProfile: Record<string, number>,
  width: number,
  height: number,
): Record<string, Pos> {
  const center = { x: width / 2, y: height / 2 };
  const pos: Record<string, Pos> = { [rootId]: center };
  const byDepth = new Map<number, string[]>();
  for (const id of profileIds) {
    const d = depthByProfile[id] ?? 0;
    if (!byDepth.has(d)) {
      byDepth.set(d, []);
    }
    byDepth.get(d)!.push(id);
  }
  const maxD = Math.max(0, ...byDepth.keys());
  for (let d = 1; d <= maxD; d++) {
    const ids = (byDepth.get(d) ?? []).filter((id) => id !== rootId);
    const r = 52 + (d - 1) * 72;
    const n = Math.max(ids.length, 1);
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      pos[id] = {
        x: center.x + r * Math.cos(angle),
        y: center.y + r * Math.sin(angle),
      };
    });
  }
  return pos;
}

function depthBadge(depth: number, isRoot: boolean): string | null {
  if (isRoot) {
    return null;
  }
  if (depth <= 1) {
    return "Direct";
  }
  return "Mutual";
}

type Props = {
  rootProfileId: string;
  centerLabel?: string;
  profileIds: string[];
  depthByProfile: Record<string, number>;
  edges: NetworkEdge[];
  profiles: Record<string, NetworkProfileNode>;
  /** Avatar thumbnails inside nodes when photo_url exists */
  showAvatars?: boolean;
  /** Opens mini-card instead of navigating away */
  onSelectProfile?: (profileId: string) => void;
  /** Legend chips below chart */
  showBadgeLegend?: boolean;
  className?: string;
};

export function NetworkGraphSvg({
  rootProfileId,
  centerLabel = "You",
  profileIds,
  depthByProfile,
  edges,
  profiles,
  showAvatars = true,
  onSelectProfile,
  showBadgeLegend = true,
  className,
}: Props) {
  const w = 380;
  const h = 380;
  const pos = layoutRadial(rootProfileId, profileIds, depthByProfile, w, h);

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/40",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mx-auto block h-auto min-h-[280px] w-full max-w-[440px] touch-manipulation"
        role="img"
        aria-label="Alumni connection map"
      >
        {edges.map((e) => {
          const a = pos[e.requester_profile_id];
          const b = pos[e.receiver_profile_id];
          if (!a || !b) {
            return null;
          }
          const dash = EDGE_DASH[e.connection_type] ?? "0";
          return (
            <line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeWidth={1.35}
              strokeDasharray={dash}
              className="text-stone-300 dark:text-stone-600"
            />
          );
        })}
        {profileIds.map((id) => {
          const p = pos[id];
          if (!p) {
            return null;
          }
          const prof = profiles[id];
          const label = prof?.display_name?.trim() ?? "Alumni";
          const short =
            label.length > 14 ? `${label.slice(0, 12)}…` : label;
          const isRoot = id === rootProfileId;
          const depth = depthByProfile[id] ?? 0;
          const edgeType = edges.find(
            (e) =>
              (e.requester_profile_id === id || e.receiver_profile_id === id) &&
              (e.requester_profile_id === rootProfileId ||
                e.receiver_profile_id === rootProfileId),
          )?.connection_type;
          const badge = depthBadge(depth, isRoot);
          const photo = prof?.photo_url;

          const nodeInner = (
            <g transform={`translate(${p.x},${p.y})`}>
              <circle
                cx={0}
                cy={0}
                r={isRoot ? 22 : 16}
                className={cn(
                  isRoot
                    ? "fill-teal-600 stroke-teal-800 dark:fill-teal-500 dark:stroke-teal-300"
                    : "fill-white stroke-stone-400 dark:fill-stone-900 dark:stroke-stone-500",
                )}
                strokeWidth={1.5}
              />
              {showAvatars && !isRoot ? (
                <foreignObject x={-14} y={-14} width={28} height={28}>
                  <div className="pointer-events-none h-[28px] w-[28px] overflow-hidden rounded-full border border-stone-300 bg-stone-100 dark:border-stone-600 dark:bg-stone-800">
                    <SafeImage
                      src={photo}
                      fallback={<DefaultAvatar />}
                      alt={`${label} profile photo`}
                      className="size-full rounded-[inherit]"
                      imgClassName="object-cover"
                    />
                  </div>
                </foreignObject>
              ) : null}
              <text
                x={0}
                y={isRoot ? 34 : badge ? 36 : 30}
                textAnchor="middle"
                className="pointer-events-none fill-stone-700 text-[9px] dark:fill-stone-200"
              >
                {short}
              </text>
              {isRoot ? (
                <text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  className="pointer-events-none fill-white text-[8px] font-semibold dark:fill-stone-950"
                >
                  {centerLabel.length > 10
                    ? `${centerLabel.slice(0, 9)}…`
                    : centerLabel}
                </text>
              ) : null}
              {badge ? (
                <text
                  x={0}
                  y={-22}
                  textAnchor="middle"
                  className={cn(
                    "pointer-events-none text-[7px] font-bold uppercase",
                    badge === "Direct"
                      ? "fill-teal-700 dark:fill-teal-300"
                      : "fill-violet-700 dark:fill-violet-300",
                  )}
                >
                  {badge}
                </text>
              ) : null}
            </g>
          );

          const titleBits = [
            label,
            edgeType ? CONNECTION_TYPE_LABELS[edgeType] : "",
            badge ?? "",
          ]
            .filter(Boolean)
            .join(" · ");

          const activate = () => {
            if (!isRoot && onSelectProfile) {
              onSelectProfile(id);
            }
          };

          if (isRoot) {
            return (
              <g key={id}>
                <title>{titleBits}</title>
                {nodeInner}
              </g>
            );
          }

          if (onSelectProfile) {
            return (
              <g
                key={id}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                onClick={activate}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate();
                  }
                }}
              >
                <title>{titleBits}</title>
                {nodeInner}
              </g>
            );
          }

          return (
            <a
              key={id}
              href={`/dashboard/network/${id}`}
              className="cursor-pointer"
            >
              <title>{titleBits}</title>
              {nodeInner}
            </a>
          );
        })}
      </svg>
      {showBadgeLegend ? (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-stone-200 px-3 py-2 dark:border-stone-800">
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-900 dark:bg-teal-950/60 dark:text-teal-100">
            Direct
          </span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-900 dark:bg-violet-950/60 dark:text-violet-100">
            Mutual
          </span>
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-800 dark:bg-stone-700 dark:text-stone-100">
            Batch
          </span>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100">
            School
          </span>
        </div>
      ) : null}
      <p className="border-t border-stone-200 px-3 py-2 text-[10px] text-stone-500 dark:border-stone-800 dark:text-stone-400">
        {onSelectProfile
          ? "Tap a circle for quick actions, or open their full map."
          : "Tap a circle to open their connection page."}
      </p>
    </div>
  );
}
