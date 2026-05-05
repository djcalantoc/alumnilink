"use client";

import type { SchoolWebBatchAgg } from "@/features/alumni-network/lib/queries";
import { cn } from "@/lib/cn";

type Props = {
  schoolName: string;
  batches: SchoolWebBatchAgg[];
  /** Highlight ring for “most active” batch */
  mostActiveBatchId: string | null;
  onSelectBatch?: (batchId: string) => void;
  className?: string;
};

export function NetworkSchoolGraphSvg({
  schoolName,
  batches,
  mostActiveBatchId,
  onSelectBatch,
  className,
}: Props) {
  const w = 420;
  const h = 420;
  const cx = w / 2;
  const cy = h / 2;
  const ringR = 148;

  const maxAlumni = Math.max(1, ...batches.map((b) => b.alumniCount));
  const maxConn = Math.max(
    1,
    ...batches.map((b) => Math.max(1, b.internalConnectionCount)),
  );

  const label =
    schoolName.length > 22 ? `${schoolName.slice(0, 20)}…` : schoolName;

  if (batches.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-stone-300 bg-gradient-to-b from-white to-indigo-50/30 px-6 py-16 text-center dark:border-stone-600 dark:from-stone-950 dark:to-indigo-950/20",
          className,
        )}
      >
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
          No batches yet
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Once alumni join with graduation years, your school web will light up
          here — aggregates only, never everyone at once.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-indigo-50/40 dark:border-stone-800 dark:from-stone-950 dark:to-indigo-950/30",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mx-auto block h-auto min-h-[300px] w-full max-w-[480px]"
        role="img"
        aria-label="School alumni network overview"
      >
        <defs>
          <linearGradient id="schoolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        {batches.map((b, i) => {
          const n = Math.max(batches.length, 1);
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const bx = cx + ringR * Math.cos(angle);
          const by = cy + ringR * Math.sin(angle);
          const strokeW =
            2 + (b.internalConnectionCount / maxConn) * 10;
          const br =
            18 + (b.alumniCount / maxAlumni) * 26;
          const short =
            b.label.length > 14 ? `${b.label.slice(0, 12)}…` : b.label;
          const active = b.batchId === mostActiveBatchId;

          return (
            <g key={b.batchId}>
              <line
                x1={cx}
                y1={cy}
                x2={bx}
                y2={by}
                stroke="currentColor"
                strokeWidth={strokeW}
                strokeLinecap="round"
                className="text-indigo-200/90 dark:text-indigo-800/90"
              />
              <g
                className={cn(
                  onSelectBatch ? "cursor-pointer" : "",
                )}
                role={onSelectBatch ? "button" : undefined}
                tabIndex={onSelectBatch ? 0 : undefined}
                onClick={() => onSelectBatch?.(b.batchId)}
                onKeyDown={(e) => {
                  if (
                    onSelectBatch &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    onSelectBatch(b.batchId);
                  }
                }}
              >
                <title>{`${b.label} · ${b.alumniCount} alumni`}</title>
                <circle
                  cx={bx}
                  cy={by}
                  r={br}
                  className={cn(
                    "stroke-indigo-300 fill-white dark:fill-stone-900 dark:stroke-indigo-600",
                    active && "stroke-violet-500 stroke-[3px]",
                  )}
                  strokeWidth={active ? 3 : 2}
                />
                <text
                  x={bx}
                  y={by - 4}
                  textAnchor="middle"
                  className="pointer-events-none fill-stone-800 text-[9px] font-semibold dark:fill-stone-100"
                >
                  {short}
                </text>
                <text
                  x={bx}
                  y={by + 10}
                  textAnchor="middle"
                  className="pointer-events-none fill-stone-500 text-[8px] dark:fill-stone-400"
                >
                  {b.alumniCount} alum
                </text>
              </g>

              {b.topSections.slice(0, 3).map((sec, j) => {
                const dotAngle =
                  angle + ((j - 1) * 0.28);
                const dx = bx + (br + 14) * Math.cos(dotAngle);
                const dy = by + (br + 14) * Math.sin(dotAngle);
                return (
                  <circle
                    key={sec.sectionId}
                    cx={dx}
                    cy={dy}
                    r={5}
                    className="pointer-events-none fill-teal-400/90 stroke-white stroke-1 dark:fill-teal-500 dark:stroke-stone-900"
                  >
                    <title>{`${sec.label}: ${sec.alumniCount}`}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}

        <g>
          <circle
            cx={cx}
            cy={cy}
            r={52}
            fill="url(#schoolGrad)"
            stroke="white"
            strokeWidth={2}
            className="drop-shadow-md dark:stroke-stone-900"
          />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="pointer-events-none fill-white text-[11px] font-bold uppercase tracking-wide"
          >
            School
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            className="pointer-events-none fill-white/95 text-[9px]"
          >
            {label}
          </text>
        </g>
      </svg>
      <p className="border-t border-stone-200/80 px-3 py-2 text-center text-[10px] text-stone-500 dark:border-stone-800 dark:text-stone-400">
        Line thickness ≈ connections inside each batch (sample). Tap a batch to
        open Batch Web.
      </p>
    </div>
  );
}
