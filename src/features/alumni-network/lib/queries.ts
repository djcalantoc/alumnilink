import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BATCH_WEB_GRAPH_NODES,
  MAX_GRAPH_NODES,
  SCHOOL_STATS_EDGE_SAMPLE,
  SCHOOL_WEB_EDGE_AGG_SAMPLE,
} from "@/features/alumni-network/lib/constants";
import type {
  AlumniConnectionRow,
  ConnectionType,
  MutualAnchor,
  NetworkEdge,
  NetworkPrivacyRow,
  NetworkProfileNode,
} from "@/features/alumni-network/lib/types";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function fetchAcceptedEdgesTouchingIds(
  supabase: SupabaseClient,
  schoolId: string,
  profileIds: string[],
): Promise<{ edges: NetworkEdge[]; error: string | null }> {
  if (profileIds.length === 0) {
    return { edges: [], error: null };
  }
  const seen = new Set<string>();
  const edges: NetworkEdge[] = [];
  for (const group of chunk(profileIds, 12)) {
    const orClause = group
      .flatMap((id) => [
        `requester_profile_id.eq.${id}`,
        `receiver_profile_id.eq.${id}`,
      ])
      .join(",");
    const { data, error } = await supabase
      .from("alumni_connections")
      .select("id, requester_profile_id, receiver_profile_id, connection_type")
      .eq("school_id", schoolId)
      .eq("status", "accepted")
      .or(orClause);
    if (error) {
      return { edges: [], error: error.message };
    }
    for (const row of data ?? []) {
      if (seen.has(row.id)) {
        continue;
      }
      seen.add(row.id);
      edges.push(row as NetworkEdge);
    }
  }
  return { edges, error: null };
}

export async function fetchPrivacyMap(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<{ map: Record<string, NetworkPrivacyRow>; error: string | null }> {
  if (profileIds.length === 0) {
    return { map: {}, error: null };
  }
  const map: Record<string, NetworkPrivacyRow> = {};
  for (const group of chunk(profileIds, 80)) {
    const { data, error } = await supabase
      .from("network_privacy_settings")
      .select("*")
      .in("alumni_profile_id", group);
    if (error) {
      return { map: {}, error: error.message };
    }
    for (const row of (data ?? []) as NetworkPrivacyRow[]) {
      map[row.alumni_profile_id] = row;
    }
  }
  return { map, error: null };
}

function showOnMap(
  profileId: string,
  privacy: Record<string, NetworkPrivacyRow>,
): boolean {
  const row = privacy[profileId];
  if (!row) {
    return true;
  }
  return row.show_in_network_map;
}

function showMutualFor(
  profileId: string,
  privacy: Record<string, NetworkPrivacyRow>,
): boolean {
  const row = privacy[profileId];
  if (!row) {
    return true;
  }
  return row.show_mutual_connections;
}

export async function fetchBlockedProfileIdsForViewer(
  supabase: SupabaseClient,
  schoolId: string,
  myProfileId: string,
): Promise<{ blocked: Set<string>; error: string | null }> {
  const blocked = new Set<string>();
  const { data, error } = await supabase
    .from("connection_blocks")
    .select("blocker_profile_id, blocked_profile_id")
    .eq("school_id", schoolId)
    .or(
      `blocker_profile_id.eq.${myProfileId},blocked_profile_id.eq.${myProfileId}`,
    );
  if (error) {
    return { blocked: new Set(), error: error.message };
  }
  for (const row of data ?? []) {
    if (row.blocker_profile_id === myProfileId) {
      blocked.add(row.blocked_profile_id);
    } else {
      blocked.add(row.blocker_profile_id);
    }
  }
  return { blocked, error: null };
}

export type SubgraphResult = {
  edges: NetworkEdge[];
  profileIds: string[];
  depthByProfile: Record<string, number>;
};

export async function buildSubgraphAroundProfile(
  supabase: SupabaseClient,
  schoolId: string,
  rootProfileId: string,
  maxDepth: number,
  filters: { connectionTypes: ConnectionType[] | null },
): Promise<{ result: SubgraphResult | null; error: string | null }> {
  const { blocked: blockedIds, error: bErr } =
    await fetchBlockedProfileIdsForViewer(supabase, schoolId, rootProfileId);
  if (bErr) {
    return { result: null, error: bErr };
  }

  const privacyMap: Record<string, NetworkPrivacyRow> = {};
  const mergePrivacy = async (ids: string[]) => {
    const { map, error } = await fetchPrivacyMap(
      supabase,
      ids.filter((id) => !privacyMap[id]),
    );
    if (error) {
      return error;
    }
    Object.assign(privacyMap, map);
    return null;
  };

  if (await mergePrivacy([rootProfileId])) {
    return { result: null, error: "Privacy load failed." };
  }

  const inSubgraph = new Set<string>([rootProfileId]);
  const depthByProfile: Record<string, number> = { [rootProfileId]: 0 };
  const allEdges: NetworkEdge[] = [];
  const edgeIds = new Set<string>();
  let frontier = new Set<string>([rootProfileId]);

  for (let d = 1; d <= maxDepth; d++) {
    if (frontier.size === 0) {
      break;
    }
    const { edges: layerEdges, error: eErr } =
      await fetchAcceptedEdgesTouchingIds(
        supabase,
        schoolId,
        [...frontier],
      );
    if (eErr) {
      return { result: null, error: eErr };
    }

    let fe = layerEdges;
    if (filters.connectionTypes?.length) {
      const allow = new Set(filters.connectionTypes);
      fe = fe.filter((e) => allow.has(e.connection_type));
    }

    for (const e of fe) {
      if (!edgeIds.has(e.id)) {
        edgeIds.add(e.id);
        allEdges.push(e);
      }
    }

    const candidates = new Set<string>();
    for (const e of fe) {
      candidates.add(e.requester_profile_id);
      candidates.add(e.receiver_profile_id);
    }
    for (const id of inSubgraph) {
      candidates.delete(id);
    }

    const newIds = [...candidates];
    const pErr = await mergePrivacy(newIds);
    if (pErr) {
      return { result: null, error: pErr };
    }

    const nextFrontier = new Set<string>();
    for (const id of newIds) {
      if (blockedIds.has(id)) {
        continue;
      }
      if (!showOnMap(id, privacyMap)) {
        continue;
      }
      if (inSubgraph.size >= MAX_GRAPH_NODES) {
        break;
      }
      inSubgraph.add(id);
      depthByProfile[id] = d;
      nextFrontier.add(id);
    }
    frontier = nextFrontier;
    if (inSubgraph.size >= MAX_GRAPH_NODES) {
      break;
    }
  }

  const finalEdges = allEdges.filter((e) => {
    const a = e.requester_profile_id;
    const b = e.receiver_profile_id;
    if (!inSubgraph.has(a) || !inSubgraph.has(b)) {
      return false;
    }
    if (blockedIds.has(a) || blockedIds.has(b)) {
      return false;
    }
    if (!showOnMap(a, privacyMap) || !showOnMap(b, privacyMap)) {
      return false;
    }
    if (filters.connectionTypes?.length) {
      const allow = new Set(filters.connectionTypes);
      if (!allow.has(e.connection_type)) {
        return false;
      }
    }
    return true;
  });

  return {
    result: {
      edges: finalEdges,
      profileIds: [...inSubgraph],
      depthByProfile,
    },
    error: null,
  };
}

export async function fetchProfilesByIds(
  supabase: SupabaseClient,
  schoolId: string,
  ids: string[],
): Promise<{ map: Record<string, NetworkProfileNode>; error: string | null }> {
  if (ids.length === 0) {
    return { map: {}, error: null };
  }
  const map: Record<string, NetworkProfileNode> = {};
  for (const group of chunk(ids, 60)) {
    const { data, error } = await supabase
      .from("alumni_profiles")
      .select(
        `
        id,
        user_id,
        display_name,
        photo_url,
        batch_id,
        section_id,
        batches ( name, graduation_year ),
        sections ( name )
      `,
      )
      .eq("school_id", schoolId)
      .eq("status", "approved")
      .in("id", group);
    if (error) {
      return { map: {}, error: error.message };
    }
    for (const row of data ?? []) {
      map[row.id as string] = row as unknown as NetworkProfileNode;
    }
  }
  return { map, error: null };
}

/** People you link to through one shared direct connection (not your direct links). */
export async function fetchMutualConnectionsForViewer(
  supabase: SupabaseClient,
  schoolId: string,
  myProfileId: string,
): Promise<{ anchors: MutualAnchor[]; error: string | null }> {
  const { edges: myLayer, error: e0 } = await fetchAcceptedEdgesTouchingIds(
    supabase,
    schoolId,
    [myProfileId],
  );
  if (e0) {
    return { anchors: [], error: e0 };
  }

  const direct = new Set<string>();
  for (const e of myLayer) {
    const other =
      e.requester_profile_id === myProfileId
        ? e.receiver_profile_id
        : e.requester_profile_id;
    direct.add(other);
  }
  if (direct.size === 0) {
    return { anchors: [], error: null };
  }

  const { blocked: blockedIds, error: bErr } =
    await fetchBlockedProfileIdsForViewer(supabase, schoolId, myProfileId);
  if (bErr) {
    return { anchors: [], error: bErr };
  }

  const viaByPeer = new Map<string, string>();

  for (const m of direct) {
    const { edges: ring, error: re } = await fetchAcceptedEdgesTouchingIds(
      supabase,
      schoolId,
      [m],
    );
    if (re) {
      return { anchors: [], error: re };
    }
    for (const e of ring) {
      const p =
        e.requester_profile_id === m
          ? e.receiver_profile_id
          : e.requester_profile_id;
      if (p === myProfileId || p === m) {
        continue;
      }
      if (direct.has(p)) {
        continue;
      }
      if (blockedIds.has(p)) {
        continue;
      }
      if (!viaByPeer.has(p)) {
        viaByPeer.set(p, m);
      }
    }
  }

  const peerIds = [...viaByPeer.keys()];
  if (peerIds.length === 0) {
    return { anchors: [], error: null };
  }

  const viaIds = [...new Set([...viaByPeer.values()])];
  const { map: profiles, error: pErr } = await fetchProfilesByIds(
    supabase,
    schoolId,
    [...peerIds, ...viaIds],
  );
  if (pErr) {
    return { anchors: [], error: pErr };
  }

  const { map: privacy, error: prErr } = await fetchPrivacyMap(
    supabase,
    [...peerIds, ...viaIds],
  );
  if (prErr) {
    return { anchors: [], error: prErr };
  }

  const anchors: MutualAnchor[] = [];
  for (const pid of peerIds) {
    const via = viaByPeer.get(pid)!;
    if (!showMutualFor(pid, privacy) || !showMutualFor(via, privacy)) {
      continue;
    }
    const prof = profiles[pid];
    if (!prof) {
      continue;
    }
    const viaName =
      profiles[via]?.display_name?.trim() ?? "a classmate";
    anchors.push({
      profile: prof,
      viaSummary: `You both know ${viaName}`,
    });
  }

  return { anchors, error: null };
}

export async function fetchSharedConnectionsWithPeer(
  supabase: SupabaseClient,
  schoolId: string,
  myProfileId: string,
  peerProfileId: string,
): Promise<{ anchors: MutualAnchor[]; error: string | null }> {
  if (myProfileId === peerProfileId) {
    return { anchors: [], error: null };
  }

  const [{ edges: myE, error: e1 }, { edges: peerE, error: e2 }] =
    await Promise.all([
      fetchAcceptedEdgesTouchingIds(supabase, schoolId, [myProfileId]),
      fetchAcceptedEdgesTouchingIds(supabase, schoolId, [peerProfileId]),
    ]);
  if (e1) {
    return { anchors: [], error: e1 };
  }
  if (e2) {
    return { anchors: [], error: e2 };
  }

  const myN = new Set<string>();
  for (const e of myE) {
    const o =
      e.requester_profile_id === myProfileId
        ? e.receiver_profile_id
        : e.requester_profile_id;
    if (o !== peerProfileId) {
      myN.add(o);
    }
  }
  const peerN = new Set<string>();
  for (const e of peerE) {
    const o =
      e.requester_profile_id === peerProfileId
        ? e.receiver_profile_id
        : e.requester_profile_id;
    if (o !== myProfileId) {
      peerN.add(o);
    }
  }

  const shared = [...myN].filter((id) => peerN.has(id));
  if (shared.length === 0) {
    return { anchors: [], error: null };
  }

  const { map: profiles, error: pErr } = await fetchProfilesByIds(
    supabase,
    schoolId,
    shared,
  );
  if (pErr) {
    return { anchors: [], error: pErr };
  }
  const { map: privacy, error: prErr } = await fetchPrivacyMap(
    supabase,
    shared,
  );
  if (prErr) {
    return { anchors: [], error: prErr };
  }

  const peerLabel =
    (await fetchProfilesByIds(supabase, schoolId, [peerProfileId])).map[
      peerProfileId
    ]?.display_name?.trim() ?? "them";

  const anchors: MutualAnchor[] = [];
  for (const sid of shared) {
    if (!showMutualFor(sid, privacy)) {
      continue;
    }
    const prof = profiles[sid];
    if (!prof) {
      continue;
    }
    const name = prof.display_name?.trim() ?? "Alumni";
    anchors.push({
      profile: prof,
      viaSummary: `You and ${peerLabel} both know ${name}`,
    });
  }
  return { anchors, error: null };
}

export async function fetchIncomingConnectionRequests(
  supabase: SupabaseClient,
  schoolId: string,
  receiverProfileId: string,
): Promise<{ rows: AlumniConnectionRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("alumni_connections")
    .select("*")
    .eq("school_id", schoolId)
    .eq("receiver_profile_id", receiverProfileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as AlumniConnectionRow[], error: null };
}

export type ConnectionPairState =
  | "none"
  | "pending_out"
  | "pending_in"
  | "accepted"
  | "declined"
  | "removed";

export async function fetchConnectionStateBetween(
  supabase: SupabaseClient,
  schoolId: string,
  aProfileId: string,
  bProfileId: string,
): Promise<{
  state: ConnectionPairState;
  row: AlumniConnectionRow | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("alumni_connections")
    .select("*")
    .eq("school_id", schoolId)
    .or(
      `and(requester_profile_id.eq.${aProfileId},receiver_profile_id.eq.${bProfileId}),and(requester_profile_id.eq.${bProfileId},receiver_profile_id.eq.${aProfileId})`,
    )
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) {
    return { state: "none", row: null, error: error.message };
  }
  const rows = (data ?? []) as AlumniConnectionRow[];
  const pending = rows.find((r) => r.status === "pending");
  if (pending) {
    if (pending.requester_profile_id === aProfileId) {
      return { state: "pending_out", row: pending, error: null };
    }
    return { state: "pending_in", row: pending, error: null };
  }
  const accepted = rows.find((r) => r.status === "accepted");
  if (accepted) {
    return { state: "accepted", row: accepted, error: null };
  }
  const declined = rows.find((r) => r.status === "declined");
  if (declined) {
    return { state: "declined", row: declined, error: null };
  }
  const removed = rows.find((r) => r.status === "removed");
  if (removed) {
    return { state: "removed", row: removed, error: null };
  }
  return { state: "none", row: null, error: null };
}

export async function fetchMyNetworkPrivacy(
  supabase: SupabaseClient,
  profileId: string,
): Promise<{ row: NetworkPrivacyRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("network_privacy_settings")
    .select("*")
    .eq("alumni_profile_id", profileId)
    .maybeSingle();
  if (error) {
    return { row: null, error: error.message };
  }
  return { row: (data as NetworkPrivacyRow) ?? null, error: null };
}

export type SchoolNetworkSummary = {
  totalConnections: number;
  topBatches: { batchId: string; label: string; count: number }[];
  topSections: { sectionId: string; label: string; count: number }[];
  topConnectors: { profileId: string; name: string; degree: number }[];
};

export async function fetchSchoolNetworkSummary(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ summary: SchoolNetworkSummary | null; error: string | null }> {
  const { count, error: cErr } = await supabase
    .from("alumni_connections")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "accepted");
  if (cErr) {
    return { summary: null, error: cErr.message };
  }

  const { data: edgeRows, error: eErr } = await supabase
    .from("alumni_connections")
    .select("requester_profile_id, receiver_profile_id")
    .eq("school_id", schoolId)
    .eq("status", "accepted")
    .limit(SCHOOL_STATS_EDGE_SAMPLE);
  if (eErr) {
    return { summary: null, error: eErr.message };
  }

  const ids = new Set<string>();
  for (const r of edgeRows ?? []) {
    ids.add(r.requester_profile_id as string);
    ids.add(r.receiver_profile_id as string);
  }

  const { map: privacy } = await fetchPrivacyMap(supabase, [...ids]);

  const degree = new Map<string, number>();
  const batchHits = new Map<string, number>();
  const sectionHits = new Map<string, number>();

  for (const r of edgeRows ?? []) {
    const a = r.requester_profile_id as string;
    const b = r.receiver_profile_id as string;
    const pa = privacy[a];
    const pb = privacy[b];
    if (pa && !pa.show_in_network_map) {
      continue;
    }
    if (pb && !pb.show_in_network_map) {
      continue;
    }
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }

  const { map: profiles, error: pErr } = await fetchProfilesByIds(
    supabase,
    schoolId,
    [...ids],
  );
  if (pErr) {
    return { summary: null, error: pErr };
  }

  for (const r of edgeRows ?? []) {
    const a = r.requester_profile_id as string;
    const b = r.receiver_profile_id as string;
    const pa = profiles[a];
    const pb = profiles[b];
    const pra = privacy[a];
    const prb = privacy[b];
    if (pra && !pra.show_in_network_map) {
      continue;
    }
    if (prb && !prb.show_in_network_map) {
      continue;
    }
    if (!pa || !pb) {
      continue;
    }
    batchHits.set(pa.batch_id, (batchHits.get(pa.batch_id) ?? 0) + 1);
    batchHits.set(pb.batch_id, (batchHits.get(pb.batch_id) ?? 0) + 1);
    if (pa.section_id) {
      sectionHits.set(
        pa.section_id,
        (sectionHits.get(pa.section_id) ?? 0) + 1,
      );
    }
    if (pb.section_id) {
      sectionHits.set(
        pb.section_id,
        (sectionHits.get(pb.section_id) ?? 0) + 1,
      );
    }
  }

  const topBatches = [...batchHits.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([batchId, cnt]) => ({
      batchId,
      label:
        [...ids].map((i) => profiles[i]).find((p) => p?.batch_id === batchId)
          ?.batches?.name ?? "Batch",
      count: cnt,
    }));

  const topSections = [...sectionHits.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([sectionId, cnt]) => {
      const prof = [...ids]
        .map((i) => profiles[i])
        .find((p) => p?.section_id === sectionId);
      return {
        sectionId,
        label: prof?.sections?.name ?? "Section",
        count: cnt,
      };
    });

  const topConnectors = [...degree.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 8)
    .map(([profileId, deg]) => ({
      profileId,
      name: profiles[profileId]?.display_name?.trim() ?? "Alumni",
      degree: deg,
    }));

  return {
    summary: {
      totalConnections: count ?? 0,
      topBatches,
      topSections,
      topConnectors,
    },
    error: null,
  };
}

export type BatchWebStatsPayload = {
  alumniInScope: number;
  mapVisibleAlumni: number;
  connectionsInScope: number;
  completionPct: number;
  mostConnectedSectionLabel: string | null;
  graphCapped: boolean;
};

export type SchoolWebSectionAgg = {
  sectionId: string;
  label: string;
  alumniCount: number;
  edgeTouches: number;
};

export type SchoolWebBatchAgg = {
  batchId: string;
  label: string;
  graduationYear: number | null;
  alumniCount: number;
  /** Accepted connections where both ends map-visible and share this batch */
  internalConnectionCount: number;
  topSections: { sectionId: string; label: string; alumniCount: number }[];
};

export type SchoolWebAggregatePayload = {
  totalAlumni: number;
  totalConnections: number;
  /** Edges counted in batch/section aggregates (capped sample) */
  aggregateSampleSize: number;
  aggregateSampleCapped: boolean;
  batches: SchoolWebBatchAgg[];
  mostActiveBatchId: string | null;
  hottestSection: SchoolWebSectionAgg | null;
  newestBatchLabel: string | null;
  newestActivityAt: string | null;
};

type ProfileMeta = {
  batchId: string;
  sectionId: string | null;
};

async function fetchEdgesForSchoolSample(
  supabase: SupabaseClient,
  schoolId: string,
  limit: number,
): Promise<{
  rows: { a: string; b: string; acceptedAt: string | null }[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("alumni_connections")
    .select("requester_profile_id, receiver_profile_id, accepted_at")
    .eq("school_id", schoolId)
    .eq("status", "accepted")
    .limit(limit);
  if (error) {
    return { rows: [], error: error.message };
  }
  const rows = (data ?? []).map((r) => ({
    a: r.requester_profile_id as string,
    b: r.receiver_profile_id as string,
    acceptedAt: (r.accepted_at as string | null) ?? null,
  }));
  return { rows, error: null };
}

/** Aggregates for School Web (no individual edges exposed in UI). */
export async function fetchSchoolWebAggregatePayload(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ payload: SchoolWebAggregatePayload | null; error: string | null }> {
  const { count: totalConnections, error: cErr } = await supabase
    .from("alumni_connections")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "accepted");
  if (cErr) {
    return { payload: null, error: cErr.message };
  }

  const { data: profRows, error: pErr } = await supabase
    .from("alumni_profiles")
    .select(
      `
      id,
      batch_id,
      section_id,
      batches ( name, graduation_year ),
      sections ( name )
    `,
    )
    .eq("school_id", schoolId)
    .eq("status", "approved");
  if (pErr) {
    return { payload: null, error: pErr.message };
  }

  type ProfRow = {
    id: string;
    batch_id: string | null;
    section_id: string | null;
    batches: { name: string; graduation_year: number | null } | null;
    sections: { name: string } | null;
  };

  const rows = (profRows ?? []) as unknown as ProfRow[];
  const profileMeta = new Map<string, ProfileMeta & { batchLabel: string; sectionLabel: string }>();
  const batchAlumni = new Map<string, string[]>();
  const sectionAlumni = new Map<string, { label: string; ids: string[] }>();

  for (const r of rows) {
    const bid = r.batch_id ?? "";
    const sid = r.section_id ?? "";
    const batchLabel = r.batches?.name ?? "Batch";
    const sectionLabel = r.sections?.name ?? "Section";
    profileMeta.set(r.id, {
      batchId: bid,
      sectionId: sid || null,
      batchLabel,
      sectionLabel,
    });
    if (bid) {
      const list = batchAlumni.get(bid) ?? [];
      list.push(r.id);
      batchAlumni.set(bid, list);
    }
    if (sid) {
      const ent =
        sectionAlumni.get(sid) ?? { label: sectionLabel, ids: [] };
      ent.ids.push(r.id);
      sectionAlumni.set(sid, ent);
    }
  }

  const totalAlumni = rows.length;

  const { rows: edgeSample, error: eErr } = await fetchEdgesForSchoolSample(
    supabase,
    schoolId,
    SCHOOL_WEB_EDGE_AGG_SAMPLE,
  );
  if (eErr) {
    return { payload: null, error: eErr };
  }

  const endpointIds = new Set<string>();
  for (const e of edgeSample) {
    endpointIds.add(e.a);
    endpointIds.add(e.b);
  }
  const { map: privacy } = await fetchPrivacyMap(supabase, [...endpointIds]);

  const internalByBatch = new Map<string, number>();
  const sectionTouches = new Map<string, number>();

  for (const e of edgeSample) {
    const pa = privacy[e.a];
    const pb = privacy[e.b];
    if (pa && !pa.show_in_network_map) {
      continue;
    }
    if (pb && !pb.show_in_network_map) {
      continue;
    }
    const ma = profileMeta.get(e.a);
    const mb = profileMeta.get(e.b);
    if (!ma?.batchId || !mb?.batchId) {
      continue;
    }
    if (ma.batchId === mb.batchId) {
      const bid = ma.batchId;
      internalByBatch.set(bid, (internalByBatch.get(bid) ?? 0) + 1);
    }
    for (const pid of [e.a, e.b]) {
      const m = profileMeta.get(pid);
      if (m?.sectionId) {
        sectionTouches.set(
          m.sectionId,
          (sectionTouches.get(m.sectionId) ?? 0) + 1,
        );
      }
    }
  }

  const batches: SchoolWebBatchAgg[] = [];
  for (const [batchId, ids] of batchAlumni) {
    if (!batchId) {
      continue;
    }
    const anyProf = profileMeta.get(ids[0]);
    const bySection = new Map<string, number>();
    for (const id of ids) {
      const m = profileMeta.get(id);
      const sKey = m?.sectionId ?? "__none__";
      bySection.set(sKey, (bySection.get(sKey) ?? 0) + 1);
    }
    const topSections = [...bySection.entries()]
      .filter(([k]) => k !== "__none__")
      .map(([sectionId, alumniCount]) => ({
        sectionId,
        label:
          sectionAlumni.get(sectionId)?.label ??
          profileMeta.get(ids.find((i) => profileMeta.get(i)?.sectionId === sectionId) ?? "")
            ?.sectionLabel ??
          "Section",
        alumniCount,
      }))
      .sort((x, y) => y.alumniCount - x.alumniCount)
      .slice(0, 4);

    batches.push({
      batchId,
      label: anyProf?.batchLabel ?? "Batch",
      graduationYear:
        rows.find((x) => x.batch_id === batchId)?.batches?.graduation_year ??
        null,
      alumniCount: ids.length,
      internalConnectionCount: internalByBatch.get(batchId) ?? 0,
      topSections,
    });
  }

  batches.sort((a, b) => b.alumniCount - a.alumniCount);

  let mostActiveBatchId: string | null = null;
  let bestScore = -1;
  for (const b of batches) {
    const score = b.internalConnectionCount * 2 + b.alumniCount;
    if (score > bestScore) {
      bestScore = score;
      mostActiveBatchId = b.batchId;
    }
  }

  let hottestSection: SchoolWebSectionAgg | null = null;
  for (const [sectionId, ent] of sectionAlumni) {
    const touches = sectionTouches.get(sectionId) ?? 0;
    const cand: SchoolWebSectionAgg = {
      sectionId,
      label: ent.label,
      alumniCount: ent.ids.length,
      edgeTouches: touches,
    };
    if (
      !hottestSection ||
      cand.edgeTouches > hottestSection.edgeTouches ||
      (cand.edgeTouches === hottestSection.edgeTouches &&
        cand.alumniCount > hottestSection.alumniCount)
    ) {
      hottestSection = cand;
    }
  }

  const { data: recentRows, error: rErr } = await supabase
    .from("alumni_connections")
    .select("accepted_at, requester_profile_id, receiver_profile_id")
    .eq("school_id", schoolId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })
    .limit(24);
  if (rErr) {
    return { payload: null, error: rErr.message };
  }

  let newestBatchLabel: string | null = null;
  let newestActivityAt: string | null = null;
  for (const raw of recentRows ?? []) {
    const ra = raw.requester_profile_id as string;
    const rb = raw.receiver_profile_id as string;
    const pr = profileMeta.get(ra);
    const p2 = profileMeta.get(rb);
    if (!pr?.batchId || !p2?.batchId) {
      continue;
    }
    newestBatchLabel =
      pr.batchId === p2.batchId
        ? pr.batchLabel
        : `${pr.batchLabel} ↔ ${p2.batchLabel}`;
    newestActivityAt = (raw.accepted_at as string) ?? null;
    break;
  }

  const aggregateSampleSize = edgeSample.length;
  const aggregateSampleCapped =
    aggregateSampleSize >= SCHOOL_WEB_EDGE_AGG_SAMPLE;

  return {
    payload: {
      totalAlumni,
      totalConnections: totalConnections ?? 0,
      aggregateSampleSize,
      aggregateSampleCapped,
      batches,
      mostActiveBatchId,
      hottestSection,
      newestBatchLabel,
      newestActivityAt,
    },
    error: null,
  };
}

async function collectEdgesWithinProfileSet(
  supabase: SupabaseClient,
  schoolId: string,
  profileSet: Set<string>,
): Promise<{ edges: NetworkEdge[]; error: string | null }> {
  const ids = [...profileSet];
  const edgeById = new Map<string, NetworkEdge>();
  for (const group of chunk(ids, 16)) {
    const { edges, error } = await fetchAcceptedEdgesTouchingIds(
      supabase,
      schoolId,
      group,
    );
    if (error) {
      return { edges: [], error };
    }
    for (const e of edges) {
      if (!profileSet.has(e.requester_profile_id)) {
        continue;
      }
      if (!profileSet.has(e.receiver_profile_id)) {
        continue;
      }
      edgeById.set(e.id, e);
    }
  }
  return { edges: [...edgeById.values()], error: null };
}

export async function buildBatchWebSubgraph(
  supabase: SupabaseClient,
  schoolId: string,
  batchId: string,
  sectionIdFilter: string | null,
  viewerProfileId: string,
): Promise<{
  subgraph: SubgraphResult;
  stats: BatchWebStatsPayload;
  rootProfileId: string;
  error: string | null;
}> {
  let q = supabase
    .from("alumni_profiles")
    .select("id")
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .eq("batch_id", batchId);
  if (sectionIdFilter) {
    q = q.eq("section_id", sectionIdFilter);
  }
  const { data: batchMembers, error: bmErr } = await q;
  if (bmErr) {
    return {
      subgraph: { edges: [], profileIds: [], depthByProfile: {} },
      stats: {
        alumniInScope: 0,
        mapVisibleAlumni: 0,
        connectionsInScope: 0,
        completionPct: 0,
        mostConnectedSectionLabel: null,
        graphCapped: false,
      },
      rootProfileId: viewerProfileId,
      error: bmErr.message,
    };
  }

  const batchProfileIds = new Set(
    (batchMembers ?? []).map((r) => r.id as string),
  );
  const alumniInScope = batchProfileIds.size;

  const { edges: rawEdges, error: eErr } = await collectEdgesWithinProfileSet(
    supabase,
    schoolId,
    batchProfileIds,
  );
  if (eErr) {
    return {
      subgraph: { edges: [], profileIds: [], depthByProfile: {} },
      stats: {
        alumniInScope,
        mapVisibleAlumni: 0,
        connectionsInScope: 0,
        completionPct: 0,
        mostConnectedSectionLabel: null,
        graphCapped: false,
      },
      rootProfileId: viewerProfileId,
      error: eErr,
    };
  }

  const inScopeWithEdge = new Set<string>();
  for (const e of rawEdges) {
    inScopeWithEdge.add(e.requester_profile_id);
    inScopeWithEdge.add(e.receiver_profile_id);
  }
  const completionPct =
    alumniInScope > 0
      ? Math.round((inScopeWithEdge.size / alumniInScope) * 100)
      : 0;

  const { map: privacy, error: prErr } = await fetchPrivacyMap(
    supabase,
    [...batchProfileIds],
  );
  if (prErr) {
    return {
      subgraph: { edges: [], profileIds: [], depthByProfile: {} },
      stats: {
        alumniInScope,
        mapVisibleAlumni: 0,
        connectionsInScope: 0,
        completionPct,
        mostConnectedSectionLabel: null,
        graphCapped: false,
      },
      rootProfileId: viewerProfileId,
      error: prErr,
    };
  }

  const eligible = new Set<string>();
  for (const id of batchProfileIds) {
    if (showOnMap(id, privacy)) {
      eligible.add(id);
    }
  }

  const mapEdges = rawEdges.filter(
    (e) =>
      eligible.has(e.requester_profile_id) &&
      eligible.has(e.receiver_profile_id),
  );

  const connectionsInScope = mapEdges.length;

  const degree = new Map<string, number>();
  for (const e of mapEdges) {
    degree.set(e.requester_profile_id, (degree.get(e.requester_profile_id) ?? 0) + 1);
    degree.set(e.receiver_profile_id, (degree.get(e.receiver_profile_id) ?? 0) + 1);
  }

  const { map: profMap, error: pfErr } = await fetchProfilesByIds(
    supabase,
    schoolId,
    [...eligible],
  );
  if (pfErr) {
    return {
      subgraph: { edges: [], profileIds: [], depthByProfile: {} },
      stats: {
        alumniInScope,
        mapVisibleAlumni: eligible.size,
        connectionsInScope,
        completionPct,
        mostConnectedSectionLabel: null,
        graphCapped: false,
      },
      rootProfileId: viewerProfileId,
      error: pfErr,
    };
  }

  const sectionConn = new Map<string, number>();
  for (const e of mapEdges) {
    const s1 = profMap[e.requester_profile_id]?.section_id;
    const s2 = profMap[e.receiver_profile_id]?.section_id;
    if (s1) {
      sectionConn.set(s1, (sectionConn.get(s1) ?? 0) + 1);
    }
    if (s2) {
      sectionConn.set(s2, (sectionConn.get(s2) ?? 0) + 1);
    }
  }

  let mostConnectedSectionLabel: string | null = null;
  let bestSec = -1;
  for (const [sid, cnt] of sectionConn) {
    if (cnt > bestSec) {
      bestSec = cnt;
      const holder = [...eligible].find(
        (id) => profMap[id]?.section_id === sid,
      );
      mostConnectedSectionLabel = holder
        ? (profMap[holder]?.sections?.name ?? "Section")
        : "Section";
    }
  }

  let rootProfileId = viewerProfileId;
  if (!eligible.has(rootProfileId)) {
    const sorted = [...eligible].sort(
      (a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0),
    );
    rootProfileId = sorted[0] ?? viewerProfileId;
  }

  const graphCapped = eligible.size > BATCH_WEB_GRAPH_NODES;

  if (!eligible.has(rootProfileId) || eligible.size === 0) {
    return {
      subgraph: { edges: [], profileIds: [], depthByProfile: {} },
      stats: {
        alumniInScope,
        mapVisibleAlumni: eligible.size,
        connectionsInScope,
        completionPct,
        mostConnectedSectionLabel,
        graphCapped,
      },
      rootProfileId: viewerProfileId,
      error: null,
    };
  }

  const selected = new Set<string>();
  selected.add(rootProfileId);

  const adj = new Map<string, Set<string>>();
  for (const e of mapEdges) {
    const a = e.requester_profile_id;
    const b = e.receiver_profile_id;
    if (!adj.has(a)) {
      adj.set(a, new Set());
    }
    if (!adj.has(b)) {
      adj.set(b, new Set());
    }
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }

  const frontier: string[] = [...(adj.get(rootProfileId) ?? [])].sort(
    (x, y) => (degree.get(y) ?? 0) - (degree.get(x) ?? 0),
  );

  while (selected.size < BATCH_WEB_GRAPH_NODES && frontier.length > 0) {
    const next = frontier.shift()!;
    if (selected.has(next)) {
      continue;
    }
    selected.add(next);
    const nbrs = [...(adj.get(next) ?? [])]
      .filter((id) => !selected.has(id))
      .sort((x, y) => (degree.get(y) ?? 0) - (degree.get(x) ?? 0));
    frontier.push(...nbrs);
    frontier.sort(
      (x, y) => (degree.get(y) ?? 0) - (degree.get(x) ?? 0),
    );
  }

  const filteredEdges = mapEdges.filter(
    (e) =>
      selected.has(e.requester_profile_id) &&
      selected.has(e.receiver_profile_id),
  );

  const depthByProfile: Record<string, number> = {
    [rootProfileId]: 0,
  };
  const bfsQ = [rootProfileId];
  while (bfsQ.length > 0) {
    const cur = bfsQ.shift()!;
    const d = depthByProfile[cur] ?? 0;
    for (const nb of adj.get(cur) ?? []) {
      if (!selected.has(nb)) {
        continue;
      }
      if (depthByProfile[nb] === undefined) {
        depthByProfile[nb] = d + 1;
        bfsQ.push(nb);
      }
    }
  }

  return {
    subgraph: {
      edges: filteredEdges,
      profileIds: [...selected],
      depthByProfile,
    },
    stats: {
      alumniInScope,
      mapVisibleAlumni: eligible.size,
      connectionsInScope,
      completionPct,
      mostConnectedSectionLabel,
      graphCapped,
    },
    rootProfileId,
    error: null,
  };
}
