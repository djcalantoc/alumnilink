import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemoryTagRow } from "@/features/memory-tagging/lib/types";

export async function fetchMemoryTagsForMemories(
  supabase: SupabaseClient,
  memoryIds: string[],
): Promise<{ byMemory: Record<string, MemoryTagRow[]>; error: string | null }> {
  if (memoryIds.length === 0) {
    return { byMemory: {}, error: null };
  }
  const { data, error } = await supabase
    .from("memory_tags")
    .select("id, memory_id, school_id, tagged_user_id, tagged_by_user_id, created_at")
    .in("memory_id", memoryIds);

  if (error) {
    return { byMemory: {}, error: error.message };
  }

  const rows = (data ?? []) as Omit<MemoryTagRow, "users">[];
  if (rows.length === 0) {
    return { byMemory: {}, error: null };
  }

  const schoolId = rows[0].school_id;
  const userIds = [...new Set(rows.map((r) => r.tagged_user_id))];
  const { data: profiles } = await supabase
    .from("alumni_profiles")
    .select("user_id, display_name")
    .eq("school_id", schoolId)
    .in("user_id", userIds);

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name]),
  );

  const byMemory: Record<string, MemoryTagRow[]> = {};
  for (const row of rows) {
    const displayName = nameMap.get(row.tagged_user_id);
    const enriched: MemoryTagRow = {
      ...row,
      users: { full_name: displayName ?? null, email: null },
    };
    if (!byMemory[row.memory_id]) {
      byMemory[row.memory_id] = [];
    }
    byMemory[row.memory_id].push(enriched);
  }
  return { byMemory, error: null };
}
