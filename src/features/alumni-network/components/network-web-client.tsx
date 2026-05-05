"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NetworkGraphSvg } from "@/features/alumni-network/components/network-graph-svg";
import { NetworkSchoolGraphSvg } from "@/features/alumni-network/components/network-school-graph-svg";
import { NetworkProfileMiniSheet } from "@/features/alumni-network/components/network-profile-mini-sheet";
import {
  CONNECTION_TYPES,
  BATCH_WEB_GRAPH_NODES,
  CONNECTION_TYPE_LABELS,
} from "@/features/alumni-network/lib/constants";
import {
  filterSubgraphByEdgeTypes,
  filterSubgraphByMaxDegree,
  filterSubgraphByProfileMeta,
} from "@/features/alumni-network/lib/filter-subgraph";
import type {
  BatchWebStatsPayload,
  SchoolWebAggregatePayload,
  SubgraphResult,
} from "@/features/alumni-network/lib/queries";
import type { ConnectionType } from "@/features/alumni-network/lib/types";
import type { MutualAnchor } from "@/features/alumni-network/lib/types";
import type { NetworkProfileNode } from "@/features/alumni-network/lib/types";
import type { AlumniConnectionRow } from "@/features/alumni-network/lib/types";
import type { NetworkPrivacyRow } from "@/features/alumni-network/lib/types";
import { cn } from "@/lib/cn";
import { IncomingConnectionRequests } from "@/features/alumni-network/components/incoming-connection-requests";
import { NetworkPrivacyForm } from "@/features/alumni-network/components/network-privacy-form";
import { KnowPersonButton } from "@/features/alumni-network/components/know-person-button";
import { ConnectionGraphPreview } from "@/components/social/ConnectionGraphPreview";

export type NetworkWebTab = "my" | "batch" | "school";

type BatchOpt = { id: string; name: string; year: number | null };
type SectionOpt = { id: string; name: string; batchId: string };

export type BatchWebPayload = {
  batchId: string;
  subgraph: SubgraphResult;
  stats: BatchWebStatsPayload;
  profiles: Record<string, NetworkProfileNode>;
  rootProfileId: string;
};

type Props = {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  graphCenterProfileId: string;
  viewerOwnProfileId: string;
  baseSubgraph: SubgraphResult;
  profiles: Record<string, NetworkProfileNode>;
  mutuals: MutualAnchor[];
  incoming: AlumniConnectionRow[];
  requesterProfiles: Record<string, NetworkProfileNode>;
  privacyRow: NetworkPrivacyRow | null;
  batchOptions: BatchOpt[];
  sectionOptions: SectionOpt[];
  showAccountPanel?: boolean;
  mutualSectionTitle?: string;
  mutualSectionEmpty?: string;
  /** Full three-tab experience; false when embedding on someone else’s map page */
  hubEnabled?: boolean;
  initialTab: NetworkWebTab;
  viewerBatchId: string | null;
  selectedBatchId: string | null;
  selectedSectionId: string | null;
  batchWeb: BatchWebPayload | null;
  schoolWeb: SchoolWebAggregatePayload | null;
};

function miniCard(p: NetworkProfileNode) {
  const name = p.display_name?.trim() ?? "Alumni";
  return (
    <Link
      key={p.id}
      href={`/dashboard/network/${p.id}`}
      className="flex min-w-[8rem] flex-1 flex-col rounded-xl border border-stone-200 bg-white p-3 text-sm dark:border-stone-800 dark:bg-stone-950"
    >
      <span className="font-medium text-stone-900 dark:text-stone-50">
        {name}
      </span>
      <span className="text-xs text-stone-500 dark:text-stone-400">
        {p.batches?.name ?? "—"}
      </span>
    </Link>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition-colors",
        active
          ? "bg-teal-600 text-white shadow-md shadow-teal-600/25 dark:bg-teal-500"
          : "text-stone-600 hover:bg-white/80 dark:text-stone-400 dark:hover:bg-stone-800/80",
      )}
    >
      {label}
    </button>
  );
}

export function NetworkWebClient({
  schoolId,
  schoolName,
  schoolSlug,
  graphCenterProfileId,
  viewerOwnProfileId,
  baseSubgraph,
  profiles,
  mutuals,
  incoming,
  requesterProfiles,
  privacyRow,
  batchOptions,
  sectionOptions,
  showAccountPanel = true,
  mutualSectionTitle = "Mutual paths",
  mutualSectionEmpty = "When you share a direct connection with someone you don't know yet, they'll appear here.",
  hubEnabled = true,
  initialTab,
  viewerBatchId,
  selectedBatchId,
  selectedSectionId,
  batchWeb,
  schoolWeb,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = hubEnabled ? initialTab : "my";

  const [maxDegree, setMaxDegree] = useState(3);
  const [batchId, setBatchId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [typeFilters, setTypeFilters] = useState<Set<ConnectionType>>(
    () => new Set(),
  );
  const [sheetProfileId, setSheetProfileId] = useState<string | null>(null);

  function navigate(params: Record<string, string | undefined>) {
    const ps = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === "") {
        ps.delete(k);
      } else {
        ps.set(k, v);
      }
    }
    router.push(`/dashboard/network?${ps.toString()}`);
  }

  const filtered = useMemo(() => {
    let r = baseSubgraph;
    r = filterSubgraphByMaxDegree(r, graphCenterProfileId, maxDegree);
    r = filterSubgraphByProfileMeta(r, profiles, graphCenterProfileId, {
      batchId: batchId || undefined,
      sectionId: sectionId || undefined,
    });
    r = filterSubgraphByEdgeTypes(
      r,
      graphCenterProfileId,
      typeFilters.size ? [...typeFilters] : null,
    );
    return r;
  }, [
    baseSubgraph,
    graphCenterProfileId,
    maxDegree,
    batchId,
    sectionId,
    typeFilters,
    profiles,
  ]);

  const directIds = useMemo(
    () =>
      filtered.profileIds.filter(
        (id) =>
          id !== graphCenterProfileId &&
          filtered.depthByProfile[id] === 1,
      ),
    [filtered, graphCenterProfileId],
  );

  const sectionsForBatch = useMemo(() => {
    const bid = selectedBatchId ?? viewerBatchId ?? "";
    if (!bid) {
      return sectionOptions;
    }
    return sectionOptions.filter((s) => s.batchId === bid);
  }, [selectedBatchId, viewerBatchId, sectionOptions]);

  const sectionsForBatchFilterMy = useMemo(() => {
    if (!batchId) {
      return sectionOptions;
    }
    return sectionOptions.filter((s) => s.batchId === batchId);
  }, [batchId, sectionOptions]);

  const graphCenterLabel =
    graphCenterProfileId === viewerOwnProfileId
      ? "You"
      : (() => {
          const n =
            profiles[graphCenterProfileId]?.display_name?.trim() ?? "Alum";
          const first = n.split(/\s+/)[0] ?? n;
          return first.length > 10 ? `${first.slice(0, 9)}…` : first;
        })();

  const viewingOwnWeb = graphCenterProfileId === viewerOwnProfileId;

  function toggleType(t: ConnectionType) {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }

  const sheetPeer = sheetProfileId
    ? (profiles[sheetProfileId] ?? batchWeb?.profiles[sheetProfileId] ?? null)
    : null;

  const rootForSheet =
    tab === "batch" && batchWeb
      ? batchWeb.rootProfileId
      : graphCenterProfileId;

  const depthForSheet =
    tab === "batch" && batchWeb
      ? batchWeb.subgraph.depthByProfile
      : filtered.depthByProfile;

  const sheetBadge =
    sheetProfileId && sheetProfileId !== rootForSheet
      ? depthForSheet[sheetProfileId] === 1
        ? "Direct"
        : "Mutual"
      : undefined;

  const batchCenterLabel =
    batchWeb && batchWeb.rootProfileId === viewerOwnProfileId
      ? "You"
      : batchWeb
        ? batchWeb.profiles[batchWeb.rootProfileId]?.display_name?.trim() ??
          "Batch anchor"
        : "Batch";

  return (
    <div
      className={cn(
        hubEnabled &&
          "space-y-8 rounded-3xl bg-gradient-to-br from-violet-50/90 via-white to-teal-50/70 p-4 shadow-inner shadow-violet-900/5 dark:from-violet-950/40 dark:via-stone-950 dark:to-teal-950/25 sm:p-6",
        !hubEnabled && "space-y-10",
      )}
    >
      {hubEnabled ? (
        <header className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Your Alumni Web 🕸️
            </h2>
            <p className="mt-1 max-w-xl text-sm text-stone-600 dark:text-stone-400">
              Explore your personal, batch, and school connections — visual,
              lightweight, and privacy-aware.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200/90 bg-white/70 p-1 dark:border-stone-700 dark:bg-stone-900/60">
            <TabButton
              active={tab === "my"}
              label="My Web"
              onClick={() => navigate({ view: "my" })}
            />
            <TabButton
              active={tab === "batch"}
              label="Batch Web"
              onClick={() =>
                navigate({
                  view: "batch",
                  batchId: selectedBatchId ?? viewerBatchId ?? undefined,
                })
              }
            />
            <TabButton
              active={tab === "school"}
              label="School Web"
              onClick={() => navigate({ view: "school" })}
            />
          </div>
        </header>
      ) : null}

      {tab === "my" ? (
        <>
          <section className="social-card flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white/90 p-4 dark:border-stone-800 dark:bg-stone-950/90 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                {viewingOwnWeb ? "Your personal web" : "Their alumni web"}
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                You sit at the center — direct links close by, mutual paths a
                ring farther out (up to three steps).
              </p>
              {viewingOwnWeb && showAccountPanel ? (
                <Link
                  href={`/dashboard/school?schoolId=${encodeURIComponent(schoolId)}`}
                  className="social-pill-btn inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-from)] dark:text-[var(--accent-to)]"
                >
                  Grow your alumni web
                </Link>
              ) : null}
            </div>
            <ConnectionGraphPreview
              profileCount={baseSubgraph.profileIds.length}
              edgeCount={baseSubgraph.edges.length}
              className="w-full shrink-0 sm:max-w-[220px]"
            />
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-teal-200/80 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/30">
              <p className="text-[10px] font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                My connections
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-teal-950 dark:text-teal-50">
                {directIds.length}
              </p>
            </div>
            <div className="rounded-2xl border border-violet-200/80 bg-violet-50/60 px-4 py-3 dark:border-violet-900/50 dark:bg-violet-950/30">
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
                Mutual paths
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-violet-950 dark:text-violet-50">
                {mutuals.length}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                Pending requests
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-950 dark:text-amber-50">
                {incoming.length}
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Filters
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-stone-700 dark:text-stone-300">
                  Degrees out
                </span>
                <select
                  value={maxDegree}
                  onChange={(e) => setMaxDegree(Number(e.target.value))}
                  className="w-full min-w-[8rem] rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                >
                  <option value={1}>Direct only</option>
                  <option value={2}>2 degrees</option>
                  <option value={3}>3 degrees</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-stone-700 dark:text-stone-300">
                  Batch
                </span>
                <select
                  value={batchId}
                  onChange={(e) => {
                    setBatchId(e.target.value);
                    setSectionId("");
                  }}
                  className="w-full min-w-[10rem] rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                >
                  <option value="">All</option>
                  {batchOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.year != null ? ` (${b.year})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-stone-700 dark:text-stone-300">
                  Section
                </span>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  disabled={sectionsForBatchFilterMy.length === 0}
                  className="w-full min-w-[10rem] rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                >
                  <option value="">All</option>
                  {sectionsForBatchFilterMy.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-stone-600 dark:text-stone-400">
                Connection types (none = all)
              </p>
              <div className="flex flex-wrap gap-2">
                {CONNECTION_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs",
                      typeFilters.has(t)
                        ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100"
                        : "border-stone-200 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400",
                    )}
                  >
                    {CONNECTION_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Connection map
            </h3>
            {filtered.profileIds.length <= 1 ? (
              <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-600 dark:border-stone-600 dark:text-stone-400">
                No connections match these filters yet. Say hi or reconnect from{" "}
                <Link
                  href={`/dashboard/school?schoolId=${encodeURIComponent(schoolId)}`}
                  className="font-medium text-teal-800 underline dark:text-teal-300"
                >
                  your school directory
                </Link>
                .
              </p>
            ) : (
              <NetworkGraphSvg
                rootProfileId={graphCenterProfileId}
                centerLabel={graphCenterLabel}
                profileIds={filtered.profileIds}
                depthByProfile={filtered.depthByProfile}
                edges={filtered.edges}
                profiles={profiles}
                showBadgeLegend
                onSelectProfile={(id) => setSheetProfileId(id)}
              />
            )}
          </section>

          {!showAccountPanel &&
          graphCenterProfileId !== viewerOwnProfileId ? (
            <section className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                Your link
              </h3>
              <div className="mt-2">
                <KnowPersonButton
                  schoolId={schoolId}
                  myProfileId={viewerOwnProfileId}
                  peerProfileId={graphCenterProfileId}
                />
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              {graphCenterProfileId === viewerOwnProfileId
                ? "Direct connections"
                : "Their direct connections"}
            </h3>
            {directIds.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                No direct connections in this view.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {directIds.map((id) => {
                  const p = profiles[id];
                  if (!p) {
                    return null;
                  }
                  return miniCard(p);
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              {mutualSectionTitle}
            </h3>
            {mutuals.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {mutualSectionEmpty}
              </p>
            ) : (
              <ul className="space-y-2">
                {mutuals.map((m) => (
                  <li
                    key={m.profile.id}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-stone-800 dark:bg-stone-950"
                  >
                    <Link
                      href={`/dashboard/network/${m.profile.id}`}
                      className="font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
                    >
                      {m.profile.display_name?.trim() ?? "Alumni"}
                    </Link>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {m.viaSummary}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {showAccountPanel ? (
            <IncomingConnectionRequests
              rows={incoming}
              requesterProfiles={requesterProfiles}
            />
          ) : null}

          {showAccountPanel ? (
            <NetworkPrivacyForm
              alumniProfileId={viewerOwnProfileId}
              initial={privacyRow}
            />
          ) : null}
        </>
      ) : null}

      {tab === "batch" ? (
        <>
          {!batchWeb ? (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 px-6 py-12 text-center dark:border-amber-800 dark:bg-amber-950/40">
              <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
                Add your graduation batch on your profile to unlock Batch Web.
              </p>
              <Link
                href="/dashboard/profile"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-900 px-5 text-sm font-semibold text-white hover:bg-amber-800"
              >
                Complete profile
              </Link>
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 dark:border-stone-800 dark:bg-stone-950/90">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                  How connected is your batch?
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Only accepted connections between alumni in this batch.
                  Hidden maps respect privacy settings.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <label className="block flex-1 text-sm">
                    <span className="mb-1 block font-medium text-stone-700 dark:text-stone-300">
                      Batch
                    </span>
                    <select
                      value={selectedBatchId ?? ""}
                      onChange={(e) => {
                        navigate({
                          view: "batch",
                          batchId: e.target.value,
                          sectionId: undefined,
                        });
                      }}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                    >
                      {batchOptions.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                          {b.year != null ? ` (${b.year})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block flex-1 text-sm">
                    <span className="mb-1 block font-medium text-stone-700 dark:text-stone-300">
                      Section filter
                    </span>
                    <select
                      value={selectedSectionId ?? ""}
                      onChange={(e) =>
                        navigate({
                          view: "batch",
                          batchId: selectedBatchId ?? undefined,
                          sectionId: e.target.value || undefined,
                        })
                      }
                      disabled={sectionsForBatch.length === 0}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                    >
                      <option value="">All sections</option>
                      {sectionsForBatch.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/80">
                  <p className="text-[10px] font-bold uppercase text-stone-500">
                    Alumni joined
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {batchWeb.stats.alumniInScope}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/80">
                  <p className="text-[10px] font-bold uppercase text-stone-500">
                    Batch connections
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {batchWeb.stats.connectionsInScope}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/80">
                  <p className="text-[10px] font-bold uppercase text-stone-500">
                    Completion
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {batchWeb.stats.completionPct}%
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/80">
                  <p className="text-[10px] font-bold uppercase text-stone-500">
                    Top section
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    {batchWeb.stats.mostConnectedSectionLabel ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/classmates?schoolId=${encodeURIComponent(schoolId)}`}
                  className="social-pill-btn inline-flex min-h-10 items-center rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  View classmates
                </Link>
                <Link
                  href={`/dashboard/batchmates?schoolId=${encodeURIComponent(schoolId)}`}
                  className="social-pill-btn inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                >
                  Invite batchmates
                </Link>
                <Link
                  href={`/dashboard/school?schoolId=${encodeURIComponent(schoolId)}`}
                  className="social-pill-btn inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                >
                  I Know This Person
                </Link>
              </div>

              {batchWeb.stats.mapVisibleAlumni === 0 ? (
                <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-600 dark:border-stone-600 dark:text-stone-400">
                  Everyone in this batch has hidden their map — try another batch
                  or encourage friends to stay visible in privacy settings.
                </p>
              ) : batchWeb.subgraph.profileIds.length <= 1 ? (
                <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-600 dark:border-stone-600 dark:text-stone-400">
                  No connections inside this batch yet. Be the first to link up —
                  invite batchmates or send reconnects.
                </p>
              ) : (
                <>
                  <NetworkGraphSvg
                    rootProfileId={batchWeb.rootProfileId}
                    centerLabel={batchCenterLabel}
                    profileIds={batchWeb.subgraph.profileIds}
                    depthByProfile={batchWeb.subgraph.depthByProfile}
                    edges={batchWeb.subgraph.edges}
                    profiles={batchWeb.profiles}
                    showBadgeLegend={false}
                    onSelectProfile={(id) => setSheetProfileId(id)}
                  />
                  {batchWeb.stats.graphCapped ? (
                    <p className="text-center text-xs text-stone-500 dark:text-stone-400">
                      Showing up to {BATCH_WEB_GRAPH_NODES} people for clarity.
                      Narrow by section or browse the directory for everyone.
                    </p>
                  ) : null}
                </>
              )}
            </>
          )}
        </>
      ) : null}

      {tab === "school" ? (
        <>
          {!schoolWeb ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              Could not load school overview.
            </p>
          ) : schoolWeb.batches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center dark:border-stone-600 dark:bg-stone-900/50">
              <p className="text-sm text-stone-700 dark:text-stone-300">
                Once alumni join with batches, you&apos;ll see an aggregate web
                — no individual pile-up, promise.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 px-4 py-3 dark:border-indigo-900/50 dark:bg-indigo-950/40">
                  <p className="text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-200">
                    Total alumni joined
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-indigo-950 dark:text-indigo-50">
                    {schoolWeb.totalAlumni}
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-200/80 bg-white/90 px-4 py-3 dark:border-indigo-900/40 dark:bg-stone-950/80">
                  <p className="text-[10px] font-bold uppercase text-stone-500">
                    Total connections
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {schoolWeb.totalConnections}
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-200/80 bg-white/90 px-4 py-3 dark:border-indigo-900/40 dark:bg-stone-950/80">
                  <p className="text-[10px] font-bold uppercase text-stone-500">
                    Most active batch
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    {schoolWeb.batches.find(
                      (b) => b.batchId === schoolWeb.mostActiveBatchId,
                    )?.label ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-200/80 bg-teal-50/70 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/40">
                  <p className="text-[10px] font-bold uppercase text-teal-800 dark:text-teal-200">
                    Hottest section
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    {schoolWeb.hottestSection
                      ? `${schoolWeb.hottestSection.label} · ${schoolWeb.hottestSection.edgeTouches} edge touches (sample)`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/80 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase text-stone-500">
                    Newest batch activity
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {schoolWeb.newestBatchLabel && schoolWeb.newestActivityAt
                      ? `${schoolWeb.newestBatchLabel} · ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(schoolWeb.newestActivityAt))}`
                      : "Quiet for now — spark the first link."}
                  </p>
                </div>
              </div>

              {schoolWeb.aggregateSampleCapped ? (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Batch link thickness uses a sample of{" "}
                  {schoolWeb.aggregateSampleSize} connections — totals above are
                  exact school-wide counts.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/batchmates?schoolId=${encodeURIComponent(schoolId)}`}
                  className="social-pill-btn inline-flex min-h-10 items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Browse batches
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="social-pill-btn inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold dark:border-stone-600 dark:bg-stone-900"
                >
                  Join / complete your batch
                </Link>
                <Link
                  href={`/s/${schoolSlug}/join`}
                  className="social-pill-btn inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold dark:border-stone-600 dark:bg-stone-900"
                >
                  Invite alumni
                </Link>
              </div>

              <NetworkSchoolGraphSvg
                schoolName={schoolName}
                batches={schoolWeb.batches}
                mostActiveBatchId={schoolWeb.mostActiveBatchId}
                onSelectBatch={(bid) =>
                  navigate({ view: "batch", batchId: bid, sectionId: undefined })
                }
              />
            </>
          )}
        </>
      ) : null}

      <NetworkProfileMiniSheet
        schoolId={schoolId}
        viewerOwnProfileId={viewerOwnProfileId}
        peer={sheetPeer}
        open={Boolean(sheetPeer)}
        onClose={() => setSheetProfileId(null)}
        badge={sheetBadge}
      />
    </div>
  );
}
