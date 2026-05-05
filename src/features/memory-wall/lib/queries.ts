import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemoryWithRelations } from "@/features/memory-wall/lib/types";

const memorySelect = `
  id,
  school_id,
  author_user_id,
  title,
  body,
  media_urls,
  status,
  batch_id,
  section_id,
  created_at,
  updated_at,
  schools ( id, name, slug ),
  batches ( id, name, graduation_year ),
  sections ( id, name )
`;

export async function fetchMemoriesByAuthor(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ rows: MemoryWithRelations[]; error: string | null }> {
  const { data, error } = await supabase
    .from("memories")
    .select(memorySelect)
    .eq("author_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as unknown as MemoryWithRelations[], error: null };
}

export async function fetchApprovedMemoriesForSchool(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ rows: MemoryWithRelations[]; error: string | null }> {
  const { data, error } = await supabase
    .from("memories")
    .select(memorySelect)
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as unknown as MemoryWithRelations[], error: null };
}

export async function fetchPendingMemoriesForSchool(
  supabase: SupabaseClient,
  schoolId: string,
  filters: { batchId?: string; sectionId?: string },
): Promise<{ rows: MemoryWithRelations[]; error: string | null }> {
  let q = supabase
    .from("memories")
    .select(memorySelect)
    .eq("school_id", schoolId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (filters.batchId) {
    q = q.eq("batch_id", filters.batchId);
  }
  if (filters.sectionId) {
    q = q.eq("section_id", filters.sectionId);
  }

  const { data, error } = await q;
  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as unknown as MemoryWithRelations[], error: null };
}
