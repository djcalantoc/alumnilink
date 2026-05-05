import type { SubgraphResult } from "@/features/alumni-network/lib/queries";
import type { ConnectionType } from "@/features/alumni-network/lib/types";
import type { NetworkProfileNode } from "@/features/alumni-network/lib/types";

export function filterSubgraphByProfileMeta(
  result: SubgraphResult,
  profiles: Record<string, NetworkProfileNode>,
  rootProfileId: string,
  opts: { batchId?: string; sectionId?: string },
): SubgraphResult {
  const { batchId, sectionId } = opts;
  if (!batchId && !sectionId) {
    return result;
  }

  const keep = new Set<string>();
  for (const id of result.profileIds) {
    if (id === rootProfileId) {
      keep.add(id);
      continue;
    }
    const p = profiles[id];
    if (!p) {
      continue;
    }
    if (batchId && p.batch_id !== batchId) {
      continue;
    }
    if (sectionId && p.section_id !== sectionId) {
      continue;
    }
    keep.add(id);
  }

  const depthByProfile: Record<string, number> = {};
  for (const id of keep) {
    depthByProfile[id] = result.depthByProfile[id] ?? 0;
  }

  const edges = result.edges.filter(
    (e) =>
      keep.has(e.requester_profile_id) && keep.has(e.receiver_profile_id),
  );

  return {
    profileIds: [...keep],
    depthByProfile,
    edges,
  };
}

export function filterSubgraphByMaxDegree(
  result: SubgraphResult,
  rootProfileId: string,
  maxDegree: number,
): SubgraphResult {
  const keep = new Set<string>();
  for (const id of result.profileIds) {
    const d = result.depthByProfile[id] ?? 0;
    if (d <= maxDegree) {
      keep.add(id);
    }
  }
  keep.add(rootProfileId);
  const depthByProfile: Record<string, number> = {};
  for (const id of keep) {
    depthByProfile[id] = result.depthByProfile[id] ?? 0;
  }
  const edges = result.edges.filter(
    (e) =>
      keep.has(e.requester_profile_id) && keep.has(e.receiver_profile_id),
  );
  return { profileIds: [...keep], depthByProfile, edges };
}

export function filterSubgraphByEdgeTypes(
  result: SubgraphResult,
  rootProfileId: string,
  types: ConnectionType[] | null,
): SubgraphResult {
  if (!types?.length) {
    return result;
  }
  const allow = new Set(types);
  const edges = result.edges.filter((e) => allow.has(e.connection_type));
  const touched = new Set<string>();
  for (const e of edges) {
    touched.add(e.requester_profile_id);
    touched.add(e.receiver_profile_id);
  }
  touched.add(rootProfileId);
  const profileIds = result.profileIds.filter((id) => touched.has(id));
  const depthByProfile: Record<string, number> = {};
  for (const id of profileIds) {
    depthByProfile[id] = result.depthByProfile[id] ?? 0;
  }
  return { profileIds, depthByProfile, edges };
}
